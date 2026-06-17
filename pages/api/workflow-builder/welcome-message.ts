import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch welcome message settings
      const settings = await prisma.workflowSettings.findFirst({
        where: { type: 'welcome_message' },
      });

      return res.status(200).json({
        success: true,
        data: settings
          ? JSON.parse(settings.settings)
          : { enabled: true, message: 'Hello! How can I help you today?' },
      });
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save welcome message settings
      const { enabled, message } = req.body;

      const settings = await prisma.workflowSettings.upsert({
        where: {
          type: 'welcome_message',
        },
        update: {
          settings: JSON.stringify({ enabled, message }),
          updatedAt: new Date(),
        },
        create: {
          type: 'welcome_message',
          settings: JSON.stringify({ enabled, message }),
        },
      });

      return res.status(200).json({ success: true, data: JSON.parse(settings.settings) });
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Welcome message API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default authMiddleware(handler);
