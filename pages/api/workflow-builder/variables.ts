import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch variables
      const settings = await prisma.workflowSettings.findFirst({
        where: { type: 'variables' },
      });

      return res.status(200).json({
        success: true,
        data: settings
          ? JSON.parse(settings.settings)
          : [
              { id: '1', name: 'name', type: 'text', required: true },
              { id: '2', name: 'email', type: 'email', required: true },
              { id: '3', name: 'phone_number', type: 'phone', required: false },
              { id: '4', name: 'order_number', type: 'text', required: false },
            ],
      });
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save variables
      const variables = req.body;

      const settings = await prisma.workflowSettings.upsert({
        where: {
          type: 'variables',
        },
        update: {
          settings: JSON.stringify(variables),
          updatedAt: new Date(),
        },
        create: {
          type: 'variables',
          settings: JSON.stringify(variables),
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(settings.settings) });
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Variables API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default authMiddleware(handler);
