import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/faq/:id - Get FAQ by ID
 * PUT /api/faq/:id - Update FAQ
 * DELETE /api/faq/:id - Delete FAQ
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid FAQ ID' });
  }

  if (req.method === 'GET') {
    return handleGet(id, req, res);
  } else if (req.method === 'PUT') {
    return handlePut(id, req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(id, req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQ',
    });
  }
}

async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { question, answer, status, keywords, category, priority } = req.body;

    // Check if FAQ exists
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found',
      });
    }

    // Update FAQ
    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        question: question !== undefined ? question : undefined,
        answer: answer !== undefined ? answer : undefined,
        status: status !== undefined ? status : undefined,
        keywords: keywords !== undefined ? keywords : undefined,
        category: category !== undefined ? category : undefined,
        priority: priority !== undefined ? priority : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      data: faq,
      message: 'FAQ updated successfully',
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update FAQ',
    });
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if FAQ exists
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found',
      });
    }

    // Delete FAQ
    await prisma.fAQ.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete FAQ',
    });
  }
}

export default authMiddleware(handler);
