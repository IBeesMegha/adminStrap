/**
 * Media Service - Handles media extraction, storage, and linking to chunks
 */

import { prisma } from '@/lib/prisma';
import { CrawledMedia } from '@/lib/web-crawler';

export interface MediaChunkLink {
  mediaId: string;
  relevanceScore: number;
}

export interface MediaWithMetadata extends CrawledMedia {
  id?: string;
  chunkId?: string | null;
  relevanceScore?: number;
  pageUrl?: string;
  sourceName?: string;
}

const DECORATIVE_PATTERNS = [
  'banner', 'slide', 'carousel', 'thumbnail', 'icon', 'logo',
  'sprite', 'bg-', 'background', 'spacer', 'dot.gif', 'pixel',
  'loading', 'placeholder', 'home-banner', 'hero-banner',
  'nav-', 'footer', 'header',
];

function isDecorativeImage(url?: string | null, title?: string | null, alt?: string | null): boolean {
  const text = [url, title, alt].filter(Boolean).join(' ').toLowerCase();
  return DECORATIVE_PATTERNS.some(p => text.includes(p));
}

/**
 * Store crawled media in the database
 * Called after web crawling but before chunk creation
 */
export async function storeMediaFromPage(
  pageId: string,
  media: CrawledMedia[]
): Promise<string[]> {
  if (!media || media.length === 0) {
    return [];
  }

  const mediaIds: string[] = [];

  for (const item of media) {
    try {
      const storedMedia = await prisma.knowledgeMedia.create({
        data: {
          pageId,
          type: item.type,
          mediaUrl: item.mediaUrl,
          altText: item.altText,
          caption: item.caption,
          title: item.title,
          mimeType: item.mimeType,
          width: item.width,
          height: item.height,
          metadata: item.metadata || {},
        },
      });

      mediaIds.push(storedMedia.id);
    } catch (error) {
      console.error(`Error storing media: ${item.mediaUrl}`, error);
    }
  }

  return mediaIds;
}

/**
 * Link images to chunks based on text similarity and proximity
 * Called after chunks are created for a page
 */
export async function linkMediaToChunks(pageId: string): Promise<number> {
  try {
    // Get all chunks for this page, ordered by chunk index
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { pageId },
      orderBy: { chunkIndex: 'asc' },
      select: {
        id: true,
        chunkIndex: true,
        chunkText: true,
      },
    });

    // Get all media for this page
    const media = await prisma.knowledgeMedia.findMany({
      where: { pageId },
      select: {
        id: true,
        altText: true,
        caption: true,
        title: true,
        mediaUrl: true,
        type: true,
      },
    });

    if (chunks.length === 0 || media.length === 0) {
      return 0;
    }

    let linksCreated = 0;

    // For each media item, find the best matching chunk
    for (const mediaItem of media) {
      // Combine all text metadata from the media item
      const mediaText = [
        mediaItem.altText,
        mediaItem.caption,
        mediaItem.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // If media has minimal text metadata, skip linking (likely decorative)
      if (mediaText.length < 5) {
        continue;
      }

      // Calculate similarity scores with all chunks
      let bestChunkId: string | null = null;
      let bestScore = 0;

      for (const chunk of chunks) {
        const chunkTextLower = chunk.chunkText.toLowerCase();
        const score = calculateTextSimilarity(mediaText, chunkTextLower);

        if (score > bestScore && score > 0.2) {
          bestScore = score;
          bestChunkId = chunk.id;
        }
      }

      // Link media to the best matching chunk (or null if no good match)
      if (bestChunkId || bestScore > 0) {
        await prisma.knowledgeMedia.update({
          where: { id: mediaItem.id },
          data: {
            chunkId: bestChunkId,
          },
        });

        if (bestChunkId) {
          linksCreated++;
        }
      }
    }

    console.log(
      `[MEDIA LINKING] Linked ${linksCreated} media items to chunks for page ${pageId}`
    );

    return linksCreated;
  } catch (error) {
    console.error(`Error linking media to chunks for page ${pageId}:`, error);
    return 0;
  }
}

/**
 * Retrieve media related to chunks
 * Called during RAG retrieval to get associated images
 */
export async function getMediaForChunks(
  chunkIds: string[]
): Promise<Map<string, MediaWithMetadata[]>> {
  const mediaByChunkId = new Map<string, MediaWithMetadata[]>();

  if (chunkIds.length === 0) {
    return mediaByChunkId;
  }

  try {
    const media = await prisma.knowledgeMedia.findMany({
      where: {
        chunkId: {
          in: chunkIds,
        },
      },
      include: {
        page: { select: { url: true, pageTitle: true } },
      },
    });

    // Group media by chunk ID
    for (const item of media) {
      if (item.chunkId) {
        // Filter decorative images at query time
        if (isDecorativeImage(item.mediaUrl, item.title, item.altText)) {
          continue;
        }

        if (!mediaByChunkId.has(item.chunkId)) {
          mediaByChunkId.set(item.chunkId, []);
        }

        mediaByChunkId.get(item.chunkId)!.push({
          type: (item.type as 'image' | 'pdf' | 'video') || 'image',
          mediaUrl: item.mediaUrl,
          altText: item.altText || undefined,
          caption: item.caption || undefined,
          title: item.title || undefined,
          mimeType: item.mimeType || undefined,
          width: item.width || undefined,
          height: item.height || undefined,
          metadata: item.metadata as Record<string, any> | undefined,
          id: item.id,
          chunkId: item.chunkId,
          pageUrl: item.page?.url || undefined,
          sourceName: undefined,
        });
      }
    }
  } catch (error) {
    console.error('Error retrieving media for chunks:', error);
  }

  return mediaByChunkId;
}

/**
 * Directly search KnowledgeMedia records by text metadata.
 * Searches title, altText, caption, surrounding text context, and page title/URL.
 * This catches media that isn't linked to any chunk (e.g., on skipped/media-only pages).
 */
export async function searchMediaByText(
  query: string,
  options: { sourceId?: string; type?: string; topK?: number } = {}
): Promise<MediaWithMetadata[]> {
  const { sourceId, type, topK = 20 } = options;

  const queryTerms = tokenizeMediaQuery(query);
  if (queryTerms.length === 0) return [];

  const where: any = {};
  if (sourceId) {
    where.page = { sourceId };
  }
  if (type) {
    where.type = type;
  }

  const media = await prisma.knowledgeMedia.findMany({
    where,
    include: {
      page: { select: { pageTitle: true, url: true } },
    },
  });

  if (media.length === 0) return [];

  const queryLower = query.toLowerCase();
  const queryTokens = new Set(queryTerms);

  const scored: MediaWithMetadata[] = media.map(item => {
    const meta = item.metadata as Record<string, any> | null;

    const searchText = [
      item.title,
      item.altText,
      item.caption,
      meta?.surroundingText,
      item.page?.pageTitle,
      item.page?.url,
    ]
      .filter(Boolean)
      .join(' ');

    const mediaTerms = tokenizeMediaQuery(searchText);

    // Word overlap: what fraction of query tokens appear in media text?
    const foundTokens = new Set(mediaTerms.filter(mt => queryTokens.has(mt)));
    const overlapRatio = queryTerms.length > 0 ? foundTokens.size / queryTerms.length : 0;

    // Title exact-match: highest signal
    let titleBonus = 0;
    if (item.title) {
      const t = item.title.toLowerCase();
      if (t === queryLower) titleBonus = 0.8;
      else if (queryTerms.some(qt => t.includes(qt))) titleBonus = 0.4;
    }

    // Alt text match
    let altBonus = 0;
    if (item.altText) {
      const a = item.altText.toLowerCase();
      if (a === queryLower) altBonus = 0.6;
      else if (queryTerms.some(qt => a.includes(qt))) altBonus = 0.25;
    }

    // Caption match
    let captionBonus = 0;
    if (item.caption) {
      const c = item.caption.toLowerCase();
      if (queryTerms.some(qt => c.includes(qt))) captionBonus = 0.15;
    }

    // Surrounding text match (weaker signal)
    let contextBonus = 0;
    if (meta?.surroundingText) {
      const ctx = meta.surroundingText.toLowerCase();
      if (queryTerms.some(qt => ctx.includes(qt))) contextBonus = 0.1;
    }

    // Decorative penalty
    const decorativePenalty = isDecorativeImage(item.mediaUrl, item.title, item.altText) ? -0.5 : 0;

    const score = overlapRatio + titleBonus + altBonus + captionBonus + contextBonus + decorativePenalty;

    // Only include if above threshold
    if (score <= 0) return null;

    return {
      type: (item.type as 'image' | 'pdf' | 'video') || 'image',
      mediaUrl: item.mediaUrl,
      altText: item.altText || undefined,
      caption: item.caption || undefined,
      title: item.title || undefined,
      mimeType: item.mimeType || undefined,
      width: item.width || undefined,
      height: item.height || undefined,
      metadata: meta || undefined,
      id: item.id,
      chunkId: item.chunkId,
      pageUrl: item.page?.url || undefined,
      sourceName: undefined,
      relevanceScore: Math.max(0, score),
    } as MediaWithMetadata;
  }).filter(m => m !== null) as MediaWithMetadata[];

  scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return scored.slice(0, topK);
}

/**
 * Tokenize text for media search queries
 */
function tokenizeMediaQuery(text: string): string[] {
  const results = new Set<string>();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);

  for (const t of tokens) {
    results.add(t);
  }

  // Join adjacent short tokens: ["b", "tech"] → also "btech"
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].length <= 2 || tokens[i + 1].length <= 2) {
      results.add(tokens[i] + tokens[i + 1]);
    }
  }

  // Split compound tokens for queries: "btech" → also "b" + "tech"
  for (const t of tokens) {
    if (t.length >= 3 && t.length <= 6) {
      for (let splitAt = 1; splitAt < t.length; splitAt++) {
        const left = t.slice(0, splitAt);
        const right = t.slice(splitAt);
        if (left.length >= 1 && right.length >= 2) {
          results.add(left);
          results.add(right);
        }
      }
    }
  }

  return [...results];
}

/**
 * Retrieve media for a specific page
 * Optionally filtered by type (image, pdf, video)
 */
export async function getMediaForPage(
  pageId: string,
  type?: 'image' | 'pdf' | 'video'
): Promise<MediaWithMetadata[]> {
  try {
    const whereClause: any = { pageId };

    if (type) {
      whereClause.type = type;
    }

    const media = await prisma.knowledgeMedia.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return media.map(item => ({
      type: (item.type as 'image' | 'pdf' | 'video') || 'image',
      mediaUrl: item.mediaUrl,
      altText: item.altText || undefined,
      caption: item.caption || undefined,
      title: item.title || undefined,
      mimeType: item.mimeType || undefined,
      width: item.width || undefined,
      height: item.height || undefined,
      id: item.id,
      chunkId: item.chunkId || undefined,
    }));
  } catch (error) {
    console.error(`Error retrieving media for page ${pageId}:`, error);
    return [];
  }
}

/**
 * Deduplicate media across chunks
 * Removes the same media URL from appearing twice in results
 */
export function deduplicateMedia(
  mediaByChunkId: Map<string, MediaWithMetadata[]>
): MediaWithMetadata[] {
  const uniqueMedia = new Map<string, MediaWithMetadata>();

  for (const mediaList of mediaByChunkId.values()) {
    for (const item of mediaList) {
      if (!uniqueMedia.has(item.mediaUrl)) {
        uniqueMedia.set(item.mediaUrl, item);
      }
    }
  }

  return Array.from(uniqueMedia.values());
}

/**
 * Rank media by relevance based on chunk relevance scores
 */
export function rankMediaByRelevance(
  media: MediaWithMetadata[],
  chunkRelevanceMap: Map<string, number>
): MediaWithMetadata[] {
  return media
    .map(item => ({
      ...item,
      relevanceScore: item.chunkId 
        ? chunkRelevanceMap.get(item.chunkId) || 0 
        : 0,
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

/**
 * Calculate text similarity between two strings
 * Uses a simple word overlap method
 * Returns a score between 0 and 1
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  // Calculate intersection
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      intersection++;
    }
  }

  // Calculate union
  const union = words1.size + words2.size - intersection;

  // Jaccard similarity
  return intersection / union;
}

/**
 * Get media statistics for a page
 */
export async function getMediaStats(pageId: string): Promise<{
  totalMedia: number;
  images: number;
  pdfs: number;
  videos: number;
  linked: number;
  unlinked: number;
}> {
  try {
    const allMedia = await prisma.knowledgeMedia.findMany({
      where: { pageId },
      select: {
        id: true,
        type: true,
        chunkId: true,
      },
    });

    const stats = {
      totalMedia: allMedia.length,
      images: 0,
      pdfs: 0,
      videos: 0,
      linked: 0,
      unlinked: 0,
    };

    for (const item of allMedia) {
      if (item.type === 'image') stats.images++;
      else if (item.type === 'pdf') stats.pdfs++;
      else if (item.type === 'video') stats.videos++;

      if (item.chunkId) {
        stats.linked++;
      } else {
        stats.unlinked++;
      }
    }

    return stats;
  } catch (error) {
    console.error(`Error getting media stats for page ${pageId}:`, error);
    return {
      totalMedia: 0,
      images: 0,
      pdfs: 0,
      videos: 0,
      linked: 0,
      unlinked: 0,
    };
  }
}
