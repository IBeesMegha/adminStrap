import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/types';
import { getDefaultLanguage, generateTranslationGroupId } from '@/lib/i18n-helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === 'GET') {
      // Get all single types - return unique names with their default language version
      const lang = typeof req.query.lang === 'string' ? req.query.lang : await getDefaultLanguage();
      
      const singleTypes = await prisma.singleType.findMany({
        where: { lang },
        orderBy: { createdAt: 'desc' },
      });
      
      return res.status(200).json({ data: singleTypes });
    }

    if (req.method === 'POST') {
      // Create new single type
      const { name, displayName, description, fields, lang } = req.body;

      if (!name || !displayName || !fields) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const entryLang = lang || await getDefaultLanguage();
      const translationGroupId = generateTranslationGroupId();

      const singleType = await prisma.singleType.create({
        data: {
          name: name.toLowerCase().replace(/\s+/g, '-'),
          displayName,
          description,
          fields,
          translationGroupId,
          lang: entryLang,
          localeStatus: 'published',
        },
      });

      return res.status(201).json({ data: singleType });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Single Types API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
