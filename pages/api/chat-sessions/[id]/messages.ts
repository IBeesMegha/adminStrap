import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { getSessionMessages, sendMessage } from '@/lib/chat-service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sessionId = req.query.id as string;

  if (req.method === 'GET') {
    try {
      const messages = await getSessionMessages(sessionId);
      return res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { query, sourceId, vectorTopK, rerankTopK, skipFAQ } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Query is required' });
      }

      const result = await sendMessage(sessionId, query.trim(), {
        sourceId,
        vectorTopK,
        rerankTopK,
        skipFAQ,
      });

      const assistantMsg = result.assistantMessage;
      const responseData: any = {
        success: true,
        id: assistantMsg.id,
        source: assistantMsg.source || 'rag',
        answer: assistantMsg.content,
        faqQuestion: assistantMsg.faqQuestion,
        faqId: assistantMsg.faqId,
        relevanceScore: assistantMsg.relevanceScore,
        supportingChunks: assistantMsg.supportingChunks || [],
        totalRetrieved: assistantMsg.totalRetrieved || 0,
        totalAfterRerank: assistantMsg.totalAfterRerank || 0,
        images: assistantMsg.images || [],
      };

      return res.status(200).json(responseData);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
