import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge-base/documents - Get all documents (pages) with chunk info
 * GET /api/knowledge-base/documents?sourceId=xxx - Filter by source
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sourceId } = req.query;

    // Build where clause
    const whereClause: any = {};
    if (sourceId && typeof sourceId === 'string') {
      whereClause.sourceId = sourceId;
    }

    // Fetch documents
    const documents = await prisma.knowledgePage.findMany({
      where: whereClause,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: {
        lastCrawledAt: 'desc',
      },
    });

    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      sourceId: doc.sourceId,
      sourceName: doc.source.name,
      sourceUrl: doc.source.websiteUrl,
      url: doc.url,
      pageTitle: doc.pageTitle,
      contentLength: doc.contentLength,
      totalChunks: doc._count.chunks,
      crawlStatus: doc.crawlStatus,
      processingStatus: doc.processingStatus,
      errorMessage: doc.errorMessage,
      lastCrawledAt: doc.lastCrawledAt,
      lastProcessedAt: doc.lastProcessedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: formattedDocuments,
      total: formattedDocuments.length,
    });

  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
    });
  }
}

export default authMiddleware(handler);
