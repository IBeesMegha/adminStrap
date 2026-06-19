import { prisma } from '@/lib/prisma';
import { generateAnswer } from '@/lib/llm-service';
import { getMediaForChunks, deduplicateMedia, rankMediaByRelevance, searchMediaByText, MediaWithMetadata } from '@/lib/media-service';

export interface ChunkRecord {
  id: string;
  chunkText: string;
  chunkIndex: number;
  sectionHeading: string | null;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
  similarity: number;
}

export interface RetrievedImage {
  url: string;
  alt?: string;
  caption?: string;
  title?: string;
  width?: number;
  height?: number;
  type: 'image' | 'pdf' | 'video';
  mimeType?: string;
  source?: string;
  pageUrl?: string;
  relevanceScore?: number;
}

export interface RAGResponse {
  answer: string;
  supportingChunks: ChunkRecord[];
  totalRetrieved: number;
  totalAfterRerank: number;
  images?: RetrievedImage[];
}

const NOT_FOUND_MESSAGE = 'The requested information was not found in the knowledge base.';

const SYSTEM_PROMPT = `You are a knowledge base assistant.

Use ONLY the information provided in the context below.

Combine information from multiple chunks and pages into a single coherent answer.

Do not mention chunks, embeddings, vector search, reranking, or retrieval.

If information exists across multiple sections, merge it naturally.

If the answer is not present in the provided context, reply:

"${NOT_FOUND_MESSAGE}"

Provide clear, concise, and accurate answers.`;

export async function ragSearch(
  query: string,
  options: {
    sourceId?: string;
    llmModel?: string;
    vectorTopK?: number;
    rerankTopK?: number;
  } = {}
): Promise<RAGResponse> {
  const {
    sourceId,
    llmModel = 'Qwen/Qwen3-4B-Instruct-2507',
    vectorTopK = 50,
    rerankTopK = 10,
  } = options;

  const whereClause: any = {};
  if (sourceId) {
    whereClause.sourceId = sourceId;
  }

  const allChunks = await prisma.knowledgeChunk.findMany({
    where: whereClause,
    include: {
      page: { select: { url: true, pageTitle: true } },
      source: { select: { name: true } },
    },
  });

  if (allChunks.length === 0) {
    return {
      answer: NOT_FOUND_MESSAGE,
      supportingChunks: [],
      totalRetrieved: 0,
      totalAfterRerank: 0,
    };
  }

  const queryTerms = tokenizeQuery(query);
  const totalDocs = allChunks.length;

  const scored: ChunkRecord[] = [];
  for (const chunk of allChunks) {
    // Augment chunk text with page title and section heading for better scoring
    const augmentedText = [chunk.chunkText, chunk.page.pageTitle, chunk.sectionHeading]
      .filter(Boolean)
      .join(' ');
    const chunkTerms = tokenize(augmentedText);
    const allTexts = allChunks.map(c =>
      [c.chunkText, c.page.pageTitle, c.sectionHeading].filter(Boolean).join(' ')
    );
    const score = bm25Score(queryTerms, chunkTerms, augmentedText, allTexts);
    scored.push({
      id: chunk.id,
      chunkText: chunk.chunkText,
      chunkIndex: chunk.chunkIndex,
      sectionHeading: chunk.sectionHeading,
      pageTitle: chunk.page.pageTitle,
      pageUrl: chunk.page.url,
      sourceName: chunk.source.name,
      sourceId: chunk.sourceId,
      pageId: chunk.pageId,
      similarity: score,
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const topK = scored.slice(0, vectorTopK);
  const totalRetrieved = scored.length;

  const rerankedChunks = topK.slice(0, rerankTopK);

  // PATH 1: Retrieve media linked to reranked chunks
  const chunkRelevanceMap = new Map<string, number>();
  rerankedChunks.forEach((chunk, index) => {
    chunkRelevanceMap.set(chunk.id, chunk.similarity);
  });

  const mediaByChunkId = await getMediaForChunks(rerankedChunks.map(c => c.id));
  const chunkLinkedMedia = deduplicateMedia(mediaByChunkId);
  const rankedChunkMedia = rankMediaByRelevance(chunkLinkedMedia, chunkRelevanceMap);

  // PATH 2: Directly search media by text metadata (catches media on skipped/media-only pages)
  const directMedia = await searchMediaByText(query, { sourceId, type: 'image' });

  // Merge both paths: direct media has its own relevance scores, chunk-linked media has scores derived from chunk relevance.
  // Union by mediaUrl, preferring the higher score.
  const mergedMediaMap = new Map<string, MediaWithMetadata>();

  for (const m of rankedChunkMedia) {
    mergedMediaMap.set(m.mediaUrl, m);
  }
  for (const m of directMedia) {
    const existing = mergedMediaMap.get(m.mediaUrl);
    if (!existing || (m.relevanceScore || 0) > (existing.relevanceScore || 0)) {
      mergedMediaMap.set(m.mediaUrl, m);
    }
  }

  const mergedMedia = Array.from(mergedMediaMap.values())
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // Convert media to response format (limited to top 5 images)
  const images: RetrievedImage[] = mergedMedia
    .filter(m => m.type === 'image') // Prioritize images for display
    .slice(0, 5)
    .map(m => ({
      url: m.mediaUrl,
      alt: m.altText,
      caption: m.caption,
      title: m.title,
      width: m.width,
      height: m.height,
      type: m.type,
      mimeType: m.mimeType,
      source: m.sourceName,
      pageUrl: m.pageUrl,
      relevanceScore: m.relevanceScore,
    }));

  const context = buildContext(rerankedChunks);

  let answer: string;
  try {
    answer = await generateAnswer(SYSTEM_PROMPT, buildUserPrompt(context, query, images), {
      model: llmModel,
      temperature: 0.1,
      maxTokens: 1024,
    });
  } catch {
    answer = NOT_FOUND_MESSAGE;
  }

  const hasAnswer = answer !== NOT_FOUND_MESSAGE && answer.trim().length > 0;

  return {
    answer,
    supportingChunks: rerankedChunks,
    totalRetrieved,
    totalAfterRerank: rerankedChunks.length,
    images: hasAnswer && images.length > 0 ? images : undefined,
  };
}

function tokenize(text: string): string[] {
  const results = new Set<string>();

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);

  for (const t of tokens) {
    results.add(t);
  }

  // Join adjacent short tokens: ["b", "tech"] → also add "btech"
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].length <= 2 || tokens[i + 1].length <= 2) {
      results.add(tokens[i] + tokens[i + 1]);
    }
  }

  return [...results];
}

/**
 * Tokenize a search query (more aggressive expansion to handle abbreviations).
 * "btech" → ["btech", "b", "tech"] so it matches "B.Tech" in documents.
 */
function tokenizeQuery(query: string): string[] {
  const results = new Set(tokenize(query));

  // Try splitting compound tokens (abbreviations without spaces)
  for (const t of [...results]) {
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

function bm25Score(
  queryTerms: string[],
  docTerms: string[],
  docText: string,
  allDocTexts: string[]
): number {
  const k1 = 1.5;
  const b = 0.75;
  const avgdl = allDocTexts.reduce((s, t) => s + tokenize(t).length, 0) / allDocTexts.length;
  const dl = docTerms.length;

  let score = 0;
  for (const qt of queryTerms) {
    const tf = docTerms.filter(t => t === qt).length;
    if (tf === 0) continue;
    const df = allDocTexts.filter(t => tokenize(t).includes(qt)).length;
    const idf = Math.log((allDocTexts.length - df + 0.5) / (df + 0.5) + 1);
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl))));
  }

  if (docText.toLowerCase().includes(queryTerms.join(' '))) {
    score *= 1.5;
  }

  return score;
}

function buildContext(chunks: ChunkRecord[]): string {
  const groups = new Map<string, { pageTitle: string; pageUrl: string; sections: Map<string, string[]> }>();

  for (const chunk of chunks) {
    const key = chunk.pageId;
    if (!groups.has(key)) {
      groups.set(key, {
        pageTitle: chunk.pageTitle || 'Untitled',
        pageUrl: chunk.pageUrl,
        sections: new Map(),
      });
    }
    const group = groups.get(key)!;
    const sectionKey = chunk.sectionHeading || 'General';
    if (!group.sections.has(sectionKey)) {
      group.sections.set(sectionKey, []);
    }
    group.sections.get(sectionKey)!.push(chunk.chunkText);
  }

  const parts: string[] = [];
  for (const group of Array.from(groups.values())) {
    for (const [section, texts] of Array.from(group.sections.entries())) {
      parts.push(`Page: ${group.pageTitle} (${group.pageUrl})`);
      if (section !== 'General') {
        parts.push(`Section: ${section}`);
      }
      parts.push('');
      parts.push(texts.join('\n\n'));
      parts.push('');
    }
  }

  return parts.join('\n').trim();
}

function buildUserPrompt(context: string, query: string, images?: RetrievedImage[]): string {
  let prompt = `Context:\n${context}`;

  // Add image metadata to context if images are available
  if (images && images.length > 0) {
    prompt += '\n\nRelated Images:';
    images.forEach((img, idx) => {
      prompt += `\n${idx + 1}. `;
      if (img.title) prompt += `${img.title}: `;
      if (img.alt) prompt += `Alt text - ${img.alt}. `;
      if (img.caption) prompt += `Caption - ${img.caption}`;
    });
  }

  prompt += `\n\nQuestion:\n${query}`;
  return prompt;
}
