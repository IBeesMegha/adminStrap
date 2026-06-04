import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge-base/stats - Get processing statistics
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get page stats by processing status
    const pageStats = await prisma.knowledgePage.groupBy({
      by: ['processingStatus'],
      _count: true,
    });

    // Get source stats
    const sources = await prisma.knowledgeSource.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        totalPages: true,
        totalChunks: true,
      },
    });

    // Total chunks
    const totalChunks = await prisma.knowledgeChunk.count();

    // Recent processing activity (last 10 pages)
    const recentActivity = await prisma.knowledgePage.findMany({
      where: {
        lastProcessedAt: { not: null },
      },
      select: {
        id: true,
        url: true,
        pageTitle: true,
        processingStatus: true,
        lastProcessedAt: true,
        errorMessage: true,
        source: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        lastProcessedAt: 'desc',
      },
      take: 10,
    });

    // Build stats object
    const stats = {
      pages: {
        pending: pageStats.find(s => s.processingStatus === 'pending')?._count || 0,
        processing: pageStats.find(s => s.processingStatus === 'processing')?._count || 0,
        completed: pageStats.find(s => s.processingStatus === 'completed')?._count || 0,
        failed: pageStats.find(s => s.processingStatus === 'failed')?._count || 0,
        total: pageStats.reduce((sum, s) => sum + s._count, 0),
      },
      chunks: {
        total: totalChunks,
      },
      sources: sources.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        totalPages: s.totalPages,
        totalChunks: s.totalChunks,
      })),
      recentActivity,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
}

export default authMiddleware(handler);
