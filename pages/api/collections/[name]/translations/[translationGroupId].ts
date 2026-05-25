import { NextApiRequest, NextApiResponse } from 'next';
import { getTranslations, getAvailableTranslations } from '@/lib/i18n-helpers';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, translationGroupId } = req.query;

  if (typeof name !== 'string' || typeof translationGroupId !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  if (req.method === 'GET') {
    try {
      const translations = await getTranslations(name, translationGroupId);
      const availableLanguages = await getAvailableTranslations(name, translationGroupId);

      return res.status(200).json({
        data: {
          translations,
          availableLanguages,
        },
      });
    } catch (error: any) {
      console.error('[Translations API] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch translations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
