import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching widget settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch widget settings' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const allowedFields = [
      'title', 'welcomeText', 'primaryColor', 'secondaryColor', 'textColor', 'bgColor',
      'position', 'marginX', 'marginY', 'width', 'height', 'borderRadius',
      'showLogo', 'logoUrl', 'logoWidth', 'showAvatar', 'avatarUrl', 'avatarStyle',
      'bubbleStyle', 'fontSize', 'headerBgColor', 'headerTextColor',
      'userMsgBgColor', 'userMsgTextColor', 'botMsgBgColor', 'botMsgTextColor',
      'inputBgColor', 'inputBorderColor', 'sendButtonColor', 'sendIconColor',
      'customCss', 'embedActive',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    let settings = await prisma.widgetSettings.findFirst();

    if (settings) {
      settings = await prisma.widgetSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.widgetSettings.create({
        data: {
          ...updateData,
          title: updateData.title || 'AI Chat Assistant',
          welcomeText: updateData.welcomeText || 'Hi! How can I help you today?',
        },
      });
    }

    return res.status(200).json({ success: true, data: settings, message: 'Widget settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating widget settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to update widget settings' });
  }
}

async function getOrCreateSettings() {
  let settings = await prisma.widgetSettings.findFirst();
  if (!settings) {
    settings = await prisma.widgetSettings.create({ data: {} });
  }
  return settings;
}

export default authMiddleware(handler);
