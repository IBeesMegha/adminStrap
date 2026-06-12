import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/faq - List all FAQs with search and filtering
 * POST /api/faq - Create a new FAQ
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      search, 
      status, 
      category,
      page = '1', 
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { question: { contains: search as string, mode: 'insensitive' } },
        { answer: { contains: search as string, mode: 'insensitive' } },
        { keywords: { hasSome: (search as string).split(' ') } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Get total count
    const total = await prisma.fAQ.count({ where });

    // Get FAQs
    const faqs = await prisma.fAQ.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    });

    // Get stats
    const stats = await prisma.fAQ.aggregate({
      _count: { id: true },
      _sum: { usageCount: true },
      where: { status: 'active' },
    });

    // Get categories
    const categories = await prisma.fAQ.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return res.status(200).json({
      success: true,
      data: faqs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        totalFaqs: stats._count.id,
        totalUsage: stats._sum.usageCount || 0,
      },
      categories: categories.map(c => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQs',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { question, answer, status, keywords, category, priority } = req.body;

    // Validation
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Question and answer are required',
      });
    }

    // Create FAQ
    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        status: status || 'active',
        keywords: keywords || [],
        category: category || null,
        priority: priority || 0,
      },
    });

    return res.status(201).json({
      success: true,
      data: faq,
      message: 'FAQ created successfully',
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create FAQ',
    });
  }
}

export default authMiddleware(handler);
