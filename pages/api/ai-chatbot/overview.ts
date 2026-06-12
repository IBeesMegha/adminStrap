import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get total sources
    const totalSources = await prisma.knowledgeSource.count();

    // Get total documents (pages)
    const totalDocuments = await prisma.knowledgePage.count();

    // Get total FAQs (assuming you have a FAQ model)
    const totalFaqs = 0; // Update when FAQ model is available

    // Get total chunks
    const totalChunks = await prisma.knowledgeChunk.count();

    // Get embedding status
    const embeddingStatus = 'Active'; // You can calculate this based on your logic

    // Get last training date
    const lastTrainingDate = await prisma.knowledgeSource.findFirst({
      orderBy: { lastCrawlAt: 'desc' },
      select: { lastCrawlAt: true },
    });

    const stats = {
      totalSources,
      totalDocuments,
      totalFaqs,
      totalChunks,
      embeddingStatus,
      lastTrainingDate: lastTrainingDate?.lastCrawlAt,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch overview statistics',
    });
  }
}

export default authMiddleware(handler);
