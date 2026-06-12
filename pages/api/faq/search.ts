import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/faq/search - Search FAQs for chatbot (public endpoint)
 * This endpoint is used by the chatbot to find relevant FAQs
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Search for FAQs
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter((w: string) => w.length > 2);

    const faqs = await prisma.fAQ.findMany({
      where: {
        status: 'active',
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: keywords } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { usageCount: 'desc' },
      ],
      take: parseInt(limit as string),
    });

    // Calculate relevance scores
    const results = faqs.map(faq => {
      let score = 0;
      
      // Question exact match
      if (faq.question.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Answer match
      if (faq.answer.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      
      // Keyword matches
      const matchedKeywords = keywords.filter((k: string) => 
        faq.keywords.some((faqK: string) => faqK.toLowerCase().includes(k))
      );
      score += matchedKeywords.length * 3;
      
      // Priority bonus
      score += faq.priority;
      
      return {
        ...faq,
        relevanceScore: score,
      };
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Increment usage count for matched FAQs (async, don't await)
    if (results.length > 0) {
      const topFaqId = results[0].id;
      prisma.fAQ.update({
        where: { id: topFaqId },
        data: { usageCount: { increment: 1 } },
      }).catch(err => console.error('Error updating usage count:', err));
    }

    return res.status(200).json({
      success: true,
      data: results,
      matched: results.length > 0,
    });
  } catch (error) {
    console.error('Error searching FAQs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search FAQs',
    });
  }
}

export default handler; // No auth middleware for chatbot endpoint
