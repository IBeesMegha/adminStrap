import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { generateEmbedding, cosineSimilarity } from '@/lib/knowledge-processing';

interface SearchResult {
  chunkId: string;
  chunkText: string;
  similarity: number;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
}

/**
 * POST /api/knowledge-base/search - Semantic search across knowledge base
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, sourceId, limit, diversify = false } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Get settings
    const settings = await getOrCreateSettings();
    const maxResults = limit || settings.maxSearchResults;

    console.log(`[SEARCH] Query: "${query}"`);
    console.log(`[SEARCH] Source filter: ${sourceId || 'all'}`);
    console.log(`[SEARCH] Diversify results: ${diversify}`);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, settings.embeddingModel);

    console.log(`[SEARCH] Generated query embedding (${queryEmbedding.length} dimensions)`);

    // Build where clause
    const whereClause: any = {};
    if (sourceId) {
      whereClause.sourceId = sourceId;
    }

    // Fetch all chunks (with source filter if provided)
    const chunks = await prisma.knowledgeChunk.findMany({
      where: whereClause,
      include: {
        page: {
          select: {
            url: true,
            pageTitle: true,
          },
        },
        source: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`[SEARCH] Comparing against ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return res.status(200).json({
        success: true,
        results: [],
        message: sourceId 
          ? 'No processed chunks found for this source' 
          : 'No processed chunks found',
      });
    }

    // Check if query looks like a product code (contains numbers and/or dashes)
    const isProductCode = /\d/.test(query);
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);

    // Calculate similarity for each chunk
    const results: SearchResult[] = [];

    for (const chunk of chunks) {
      try {
        let similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        const chunkLower = chunk.chunkText.toLowerCase();

        // BOOST SCORE for exact/partial text matches
        // This helps product codes, model numbers, and specific terms rank higher
        let textMatchBoost = 0;

        // Check for exact phrase match
        if (chunkLower.includes(queryLower)) {
          textMatchBoost += 0.4; // Huge boost for exact phrase
          console.log(`[SEARCH] Exact match found in chunk ${chunk.id.substring(0, 8)}`);
        }

        // Check for individual word matches (especially important for product codes)
        if (isProductCode) {
          let wordMatchCount = 0;
          for (const word of queryWords) {
            if (word.length > 2 && chunkLower.includes(word)) {
              wordMatchCount++;
            }
          }
          if (wordMatchCount > 0) {
            textMatchBoost += (wordMatchCount / queryWords.length) * 0.3;
          }
        }

        // Apply boost to similarity score
        similarity = Math.min(1.0, similarity + textMatchBoost);

        // Only include results above threshold
        if (similarity >= settings.similarityThreshold) {
          results.push({
            chunkId: chunk.id,
            chunkText: chunk.chunkText,
            similarity,
            pageTitle: chunk.page.pageTitle,
            pageUrl: chunk.page.url,
            sourceName: chunk.source.name,
            sourceId: chunk.sourceId,
            pageId: chunk.pageId,
          });
        }
      } catch (error) {
        console.error(`Error calculating similarity for chunk ${chunk.id}:`, error);
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    let topResults: SearchResult[];

    // CHECK FOR PERFECT MATCHES (100% or very close)
    const perfectMatches = results.filter(r => r.similarity >= 0.98); // 98%+ considered perfect
    
    if (perfectMatches.length > 0) {
      // If we have perfect match(es), ONLY return those
      console.log(`[SEARCH] Found ${perfectMatches.length} perfect match(es) (≥98%). Returning only perfect matches.`);
      topResults = perfectMatches.slice(0, maxResults);
      
      return res.status(200).json({
        success: true,
        results: topResults,
        totalMatches: results.length,
        returned: topResults.length,
        perfectMatch: true,
      });
    }

    // NO PERFECT MATCH: Apply quality filtering
    // Only return HIGH quality matches (within 15% of the best result)
    if (results.length > 0) {
      const bestScore = results[0].similarity;
      const qualityThreshold = bestScore - 0.15; // Within 15% of best
      
      // Filter to only high-quality results
      const highQualityResults = results.filter(r => r.similarity >= qualityThreshold);
      
      console.log(`[SEARCH] Best score: ${(bestScore * 100).toFixed(1)}%, quality threshold: ${(qualityThreshold * 100).toFixed(1)}%`);
      console.log(`[SEARCH] Filtered from ${results.length} to ${highQualityResults.length} high-quality results`);

      if (diversify) {
        // Diversify results: prefer different pages (old behavior)
        const diversifiedResults: SearchResult[] = [];
        const pageChunks = new Map<string, SearchResult[]>();

        // Group high-quality results by page
        for (const result of highQualityResults) {
          if (!pageChunks.has(result.pageId)) {
            pageChunks.set(result.pageId, []);
          }
          pageChunks.get(result.pageId)!.push(result);
        }

        // Take top chunk from each page first (round-robin)
        const pageIds = Array.from(pageChunks.keys());
        let pageIndex = 0;
        let round = 0;

        while (diversifiedResults.length < maxResults && diversifiedResults.length < highQualityResults.length) {
          const pageId = pageIds[pageIndex];
          const chunks = pageChunks.get(pageId)!;

          if (chunks.length > round) {
            diversifiedResults.push(chunks[round]);
          }

          pageIndex++;
          if (pageIndex >= pageIds.length) {
            pageIndex = 0;
            round++;
          }
        }

        topResults = diversifiedResults.slice(0, maxResults);
      } else {
        // Return pure top matches by similarity (default behavior)
        topResults = highQualityResults.slice(0, maxResults);
      }
    } else {
      topResults = [];
    }

    console.log(`[SEARCH] Found ${results.length} results above threshold, returning top ${topResults.length} high-quality matches`);

    return res.status(200).json({
      success: true,
      results: topResults,
      totalMatches: results.length,
      returned: topResults.length,
      perfectMatch: false,
    });

  } catch (error: any) {
    console.error('[SEARCH] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Search failed',
    });
  }
}

/**
 * Get or create default settings
 */
async function getOrCreateSettings() {
  let settings = await prisma.knowledgeSettings.findFirst();

  if (!settings) {
    settings = await prisma.knowledgeSettings.create({
      data: {
        chunkSize: 800,
        chunkOverlap: 100,
        similarityThreshold: 0.7,
        maxSearchResults: 10,
        embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
      },
    });
  }

  return settings;
}

export default authMiddleware(handler);
