import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, translationGroupId } = req.query;

  if (typeof name !== 'string' || typeof translationGroupId !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  if (req.method === 'GET') {
    try {
      // Get all translations for this single type
      const translations = await prisma.singleType.findMany({
        where: {
          name,
          translationGroupId,
        },
        orderBy: {
          lang: 'asc',
        },
      });

      // Get available languages (languages that have translations)
      const availableLanguages = translations.map(t => t.lang);

      return res.status(200).json({
        data: {
          translations,
          availableLanguages,
        },
      });
    } catch (error: any) {
      console.error('[Single Type Translations API] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch translations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
