import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Placeholder for FAQs - update when you have a FAQ model
    const faqs = [
      {
        id: '1',
        question: 'How do I reset my password?',
        answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page.',
        category: 'Account',
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: '2',
        question: 'What are your business hours?',
        answer: 'We are available Monday through Friday, 9 AM to 5 PM EST.',
        category: 'General',
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: '3',
        question: 'How can I contact support?',
        answer: 'You can reach our support team at support@example.com or call 1-800-123-4567.',
        category: 'Support',
        status: 'active',
        createdAt: new Date(),
      },
    ];

    return res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQs',
    });
  }
}

export default authMiddleware(handler);
