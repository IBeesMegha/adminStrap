import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid language ID' });
  }

  if (req.method === 'GET') {
    try {
      const language = await prisma.language.findUnique({
        where: { id },
      });

      if (!language) {
        return res.status(404).json({ error: 'Language not found' });
      }

      return res.status(200).json({ data: language });
    } catch (error: any) {
      console.error('[Languages API] Error fetching language:', error);
      return res.status(500).json({ error: 'Failed to fetch language' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { code, name, nativeName, flag, isDefault, isActive } = req.body;

      // Check if language exists
      const existing = await prisma.language.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      // If code is being changed, check for conflicts
      if (code && code !== existing.code) {
        const codeExists = await prisma.language.findUnique({
          where: { code },
        });

        if (codeExists) {
          return res.status(400).json({ error: 'Language with this code already exists' });
        }
      }

      // If this is set as default, unset other defaults
      if (isDefault && !existing.isDefault) {
        await prisma.language.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const language = await prisma.language.update({
        where: { id },
        data: {
          ...(code && { code }),
          ...(name && { name }),
          ...(nativeName !== undefined && { nativeName }),
          ...(flag !== undefined && { flag }),
          ...(isDefault !== undefined && { isDefault }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.status(200).json({ data: language });
    } catch (error: any) {
      console.error('[Languages API] Error updating language:', error);
      return res.status(500).json({ error: 'Failed to update language' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if language exists
      const existing = await prisma.language.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      // Prevent deleting the default language
      if (existing.isDefault) {
        return res.status(400).json({ error: 'Cannot delete the default language' });
      }

      await prisma.language.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Language deleted successfully' });
    } catch (error: any) {
      console.error('[Languages API] Error deleting language:', error);
      return res.status(500).json({ error: 'Failed to delete language' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
