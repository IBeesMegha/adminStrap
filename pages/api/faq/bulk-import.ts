import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/faq/bulk-import - Bulk import FAQs from CSV or JSON
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { faqs } = req.body;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'FAQs array is required and must not be empty',
      });
    }

    // Validate each FAQ
    const validFaqs = [];
    const errors = [];

    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];
      
      if (!faq.question || !faq.answer) {
        errors.push(`Row ${i + 1}: Question and answer are required`);
        continue;
      }

      validFaqs.push({
        question: faq.question,
        answer: faq.answer,
        status: faq.status || 'active',
        keywords: Array.isArray(faq.keywords) ? faq.keywords : [],
        category: faq.category || null,
        priority: parseInt(faq.priority) || 0,
      });
    }

    if (validFaqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid FAQs to import',
        errors,
      });
    }

    // Bulk create FAQs
    const result = await prisma.fAQ.createMany({
      data: validFaqs,
      skipDuplicates: true,
    });

    return res.status(201).json({
      success: true,
      data: {
        imported: result.count,
        total: faqs.length,
        errors,
      },
      message: `Successfully imported ${result.count} out of ${faqs.length} FAQs`,
    });
  } catch (error) {
    console.error('Error bulk importing FAQs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to bulk import FAQs',
    });
  }
}

export default authMiddleware(handler);
