import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch conditions
      const settings = await prisma.workflowSettings.findFirst({
        where: { type: 'conditions' },
      });

      return res.status(200).json({
        success: true,
        data: settings
          ? JSON.parse(settings.settings)
          : [
              {
                id: '1',
                name: 'Check Order Number',
                variableId: '4',
                operator: 'is_empty',
                value: '',
                action: 'Ask for Order Number',
                enabled: true,
              },
            ],
      });
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save conditions
      const conditions = req.body;

      const settings = await prisma.workflowSettings.upsert({
        where: {
          type: 'conditions',
        },
        update: {
          settings: JSON.stringify(conditions),
          updatedAt: new Date(),
        },
        create: {
          type: 'conditions',
          settings: JSON.stringify(conditions),
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(settings.settings) });
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conditions API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default authMiddleware(handler);
