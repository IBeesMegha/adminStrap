import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { ragSearch } from '@/lib/rag-service';

/**
 * POST /api/knowledge-base/search - RAG search across knowledge base
 *
 * Returns AI-generated answer from retrieved context.
 * Also returns supporting chunks for transparency.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, sourceId, vectorTopK, rerankTopK } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const settings = await getOrCreateSettings();

    console.log(`[RAG] Query: "${query}"`);
    console.log(`[RAG] Source filter: ${sourceId || 'all'}`);

    const result = await ragSearch(query.trim(), {
      sourceId,
      llmModel: settings.llmModel,
      vectorTopK: vectorTopK || 50,
      rerankTopK: rerankTopK || 10,
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      supportingChunks: result.supportingChunks,
      totalRetrieved: result.totalRetrieved,
      totalAfterRerank: result.totalAfterRerank,
    });
  } catch (error: any) {
    console.error('[RAG] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'RAG search failed',
    });
  }
}

async function getOrCreateSettings() {
  let settings = await prisma.knowledgeSettings.findFirst();

  if (!settings) {
    settings = await prisma.knowledgeSettings.create({
      data: {
        chunkSize: 500,
        chunkOverlap: 50,
        similarityThreshold: 0.7,
        maxSearchResults: 10,
        embeddingModel: 'BAAI/bge-base-en-v1.5',
        rerankerModel: 'BAAI/bge-reranker-base',
        llmModel: 'Qwen/Qwen3-4B-Instruct-2507',
      },
    });
  } else {
    const updateData: any = {};
    if (settings.llmModel === 'Qwen/Qwen3-8B-Instruct') {
      updateData.llmModel = 'Qwen/Qwen3-4B-Instruct-2507';
    }
    if (Object.keys(updateData).length > 0) {
      settings = await prisma.knowledgeSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }
  }

  return settings;
}

export default authMiddleware(handler);
