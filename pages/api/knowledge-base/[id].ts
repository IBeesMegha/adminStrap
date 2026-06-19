import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge-base/:id - Get knowledge source details
 * PUT /api/knowledge-base/:id - Update knowledge source
 * DELETE /api/knowledge-base/:id - Delete knowledge source
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
      });
    }

    const source = await prisma.knowledgeSource.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            url: true,
            pageTitle: true,
            contentLength: true,
            crawlStatus: true,
            lastCrawledAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error('Error fetching knowledge source:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge source',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { name } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const source = await prisma.knowledgeSource.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({
      success: true,
      data: source,
      message: 'Knowledge source updated successfully',
    });
  } catch (error) {
    console.error('Error updating knowledge source:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update knowledge source',
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
      });
    }

    await prisma.knowledgeSource.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Knowledge source deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting knowledge source:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge source',
    });
  }
}

export default authMiddleware(handler);
