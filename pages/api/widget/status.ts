import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = await prisma.widgetSettings.findFirst();

    if (!settings) {
      return res.status(200).json({
        success: true,
        configured: false,
        message: 'Widget settings not found. Please configure in /admin/widget',
      });
    }

    return res.status(200).json({
      success: true,
      configured: true,
      embedActive: settings.embedActive,
      title: settings.title,
      welcomeText: settings.welcomeText,
      position: settings.position,
      primaryColor: settings.primaryColor,
      message: settings.embedActive 
        ? 'Widget is ACTIVE and should appear on non-admin pages' 
        : 'Widget is DISABLED. Enable it in /admin/widget',
    });
  } catch (error: any) {
    console.error('Error fetching widget status:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch widget status' });
  }
}
