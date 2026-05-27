import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/types';
import { getDefaultLanguage, generateTranslationGroupId, validateLanguage } from '@/lib/i18n-helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { name } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid single type name' });
  }

  // Get lang parameter for filtering
  const lang = typeof req.query.lang === 'string' ? req.query.lang : await getDefaultLanguage();

  try {
    if (req.method === 'GET') {
      // Get specific single type by name and language
      const singleType = await prisma.singleType.findUnique({
        where: { 
          name_lang: {
            name: name,
            lang: lang
          }
        },
      });

      if (!singleType) {
        return res.status(404).json({ error: 'Single type not found for this language' });
      }

      console.log(`[Single Type API GET] Found single type: ${singleType.name} (${singleType.lang})`);

      // Return the full single type object including schema fields
      const response: any = {
        id: singleType.id,
        name: singleType.name,
        displayName: singleType.displayName,
        description: singleType.description,
        data: singleType.data,
        translationGroupId: singleType.translationGroupId,
        lang: singleType.lang,
        localeStatus: singleType.localeStatus,
        createdAt: singleType.createdAt,
        updatedAt: singleType.updatedAt,
      };

      // Always include fields for admin UI
      response.fields = singleType.fields;

      return res.status(200).json({ data: response });
    }

    if (req.method === 'PUT') {
      // Update single type (structure or data)
      const { displayName, description, fields, data } = req.body;

      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (description !== undefined) updateData.description = description;
      if (fields !== undefined) updateData.fields = fields;
      if (data !== undefined) updateData.data = data;

      const singleType = await prisma.singleType.update({
        where: { 
          name_lang: {
            name: name,
            lang: lang
          }
        },
        data: updateData,
      });

      return res.status(200).json({ data: singleType });
    }

    if (req.method === 'DELETE') {
      // Delete single type for specific language
      await prisma.singleType.delete({
        where: { 
          name_lang: {
            name: name,
            lang: lang
          }
        },
      });

      return res.status(200).json({ message: 'Single type deleted' });
    }

    if (req.method === 'POST') {
      // Create a new translation for existing single type
      const { displayName, description, fields, data, lang: requestLang, translationGroupId } = req.body;

      if (!requestLang) {
        return res.status(400).json({ error: 'Language is required for creating translation' });
      }

      if (!translationGroupId) {
        return res.status(400).json({ error: 'Translation group ID is required' });
      }

      // Validate language
      if (!(await validateLanguage(requestLang))) {
        return res.status(400).json({ error: 'Invalid or inactive language' });
      }

      // Check if translation already exists
      const existing = await prisma.singleType.findUnique({
        where: {
          name_lang: {
            name: name,
            lang: requestLang
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: `Translation for ${requestLang} already exists` });
      }

      // Create new translation
      const newTranslation = await prisma.singleType.create({
        data: {
          name,
          displayName: displayName || name,
          description,
          fields,
          data,
          translationGroupId,
          lang: requestLang,
          localeStatus: 'published',
        },
      });

      return res.status(201).json({ data: newTranslation });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Single Type API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
