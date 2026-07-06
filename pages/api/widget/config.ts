import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let settings = await prisma.widgetSettings.findFirst();

    if (!settings || !settings.embedActive) {
      return res.status(200).json({ success: true, data: null });
    }

    const config = {
      title: settings.title,
      welcomeText: settings.welcomeText,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      textColor: settings.textColor,
      bgColor: settings.bgColor,
      position: settings.position,
      marginX: settings.marginX,
      marginY: settings.marginY,
      width: settings.width,
      height: settings.height,
      borderRadius: settings.borderRadius,
      showLogo: settings.showLogo,
      logoUrl: settings.logoUrl,
      logoWidth: settings.logoWidth,
      showAvatar: settings.showAvatar,
      avatarUrl: settings.avatarUrl,
      avatarStyle: settings.avatarStyle,
      bubbleStyle: settings.bubbleStyle,
      fontSize: settings.fontSize,
      headerBgColor: settings.headerBgColor,
      headerTextColor: settings.headerTextColor,
      userMsgBgColor: settings.userMsgBgColor,
      userMsgTextColor: settings.userMsgTextColor,
      botMsgBgColor: settings.botMsgBgColor,
      botMsgTextColor: settings.botMsgTextColor,
      inputBgColor: settings.inputBgColor,
      inputBorderColor: settings.inputBorderColor,
      sendButtonColor: settings.sendButtonColor,
      sendIconColor: settings.sendIconColor,
      customCss: settings.customCss,
      embedActive: settings.embedActive,
    };

    return res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    console.error('Error fetching widget config:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch widget config' });
  }
}
