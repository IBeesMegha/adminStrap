import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ragSearch } from '@/lib/rag-service';
import { searchFAQs } from '@/pages/api/knowledge-base/search';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, skipFAQ, sourceId, vectorTopK, rerankTopK } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const settings = await prisma.widgetSettings.findFirst();
    if (!settings || !settings.embedActive) {
      return res.status(403).json({ success: false, error: 'Widget is not active' });
    }

    const queryTrimmed = message.trim();

    // Try FAQ match first (unless skipFAQ is true)
    if (!skipFAQ) {
      const faqResult = await searchFAQs(queryTrimmed);
      if (faqResult.matched && faqResult.answer) {
        return res.status(200).json({
          success: true,
          data: {
            answer: faqResult.answer,
            source: 'faq',
            faqQuestion: faqResult.question || null,
            faqId: faqResult.id || null,
            relevanceScore: faqResult.relevanceScore || null,
            supportingChunks: [],
          },
        });
      }
    }

    // Fallback to RAG search if no FAQ match
    const result = await ragSearch(queryTrimmed, {
      sourceId,
      vectorTopK,
      rerankTopK,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        source: 'rag',
        supportingChunks: result.supportingChunks || [],
        totalRetrieved: result.totalRetrieved || 0,
        totalAfterRerank: result.totalAfterRerank || 0,
        images: result.images || [],
      },
    });
  } catch (error: any) {
    console.error('Error in widget chat:', error);
    return res.status(500).json({ success: false, error: 'Failed to process message' });
  }
}
