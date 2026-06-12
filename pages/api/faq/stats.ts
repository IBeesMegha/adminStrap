import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/faq/stats - Get FAQ statistics
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get overall stats
    const [totalFaqs, activeFaqs, inactiveFaqs, totalUsage] = await Promise.all([
      prisma.fAQ.count(),
      prisma.fAQ.count({ where: { status: 'active' } }),
      prisma.fAQ.count({ where: { status: 'inactive' } }),
      prisma.fAQ.aggregate({
        _sum: { usageCount: true },
      }),
    ]);

    // Get top 10 most used FAQs
    const topFaqs = await prisma.fAQ.findMany({
      where: { status: 'active' },
      orderBy: { usageCount: 'desc' },
      take: 10,
      select: {
        id: true,
        question: true,
        usageCount: true,
      },
    });

    // Get FAQs by category
    const faqsByCategory = await prisma.fAQ.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
    });

    // Get recent FAQs
    const recentFaqs = await prisma.fAQ.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        question: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalFaqs,
          activeFaqs,
          inactiveFaqs,
          totalUsage: totalUsage._sum.usageCount || 0,
        },
        topFaqs,
        faqsByCategory: faqsByCategory.map(item => ({
          category: item.category,
          count: item._count.id,
        })),
        recentFaqs,
      },
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQ statistics',
    });
  }
}

export default authMiddleware(handler);
