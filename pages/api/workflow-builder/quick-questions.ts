import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch quick questions
      const settings = await prisma.workflowSettings.findFirst({
        where: { type: 'quick_questions' },
      });

      return res.status(200).json({
        success: true,
        data: settings
          ? JSON.parse(settings.settings)
          : [
              { id: '1', text: 'Track My Order', enabled: true, order: 1 },
              { id: '2', text: 'Return Product', enabled: true, order: 2 },
              { id: '3', text: 'Contact Support', enabled: true, order: 3 },
              { id: '4', text: 'Talk to AI', enabled: true, order: 4 },
            ],
      });
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save quick questions
      const questions = req.body;

      const settings = await prisma.workflowSettings.upsert({
        where: {
          type: 'quick_questions',
        },
        update: {
          settings: JSON.stringify(questions),
          updatedAt: new Date(),
        },
        create: {
          type: 'quick_questions',
          settings: JSON.stringify(questions),
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(settings.settings) });
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Quick questions API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default authMiddleware(handler);
