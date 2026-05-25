import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { active } = req.query;

      const where = active === 'true' ? { isActive: true } : {};

      const languages = await prisma.language.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' },
        ],
      });

      return res.status(200).json({ data: languages });
    } catch (error: any) {
      console.error('[Languages API] Error fetching languages:', error);
      return res.status(500).json({ error: 'Failed to fetch languages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { code, name, nativeName, flag, isDefault, isActive } = req.body;

      if (!code || !name) {
        return res.status(400).json({ error: 'Code and name are required' });
      }

      // Check if language with this code already exists
      const existing = await prisma.language.findUnique({
        where: { code },
      });

      if (existing) {
        return res.status(400).json({ error: 'Language with this code already exists' });
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await prisma.language.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const language = await prisma.language.create({
        data: {
          code,
          name,
          nativeName,
          flag,
          isDefault: isDefault || false,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return res.status(201).json({ data: language });
    } catch (error: any) {
      console.error('[Languages API] Error creating language:', error);
      return res.status(500).json({ error: 'Failed to create language' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default authMiddleware(handler);
