import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';

// Common languages with their native names and flags
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isDefault: true, isActive: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isDefault: false, isActive: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isDefault: false, isActive: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isDefault: false, isActive: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isDefault: false, isActive: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isDefault: false, isActive: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', isDefault: false, isActive: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isDefault: false, isActive: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isDefault: false, isActive: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isDefault: false, isActive: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isDefault: false, isActive: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isDefault: false, isActive: false },
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if languages already exist
    const existingCount = await prisma.language.count();

    if (existingCount > 0) {
      return res.status(400).json({ error: 'Languages already seeded' });
    }

    // Create all default languages
    const languages = await prisma.language.createMany({
      data: DEFAULT_LANGUAGES,
      skipDuplicates: true,
    });

    return res.status(201).json({
      message: 'Languages seeded successfully',
      count: languages.count,
    });
  } catch (error: any) {
    console.error('[Languages API] Error seeding languages:', error);
    return res.status(500).json({ error: 'Failed to seed languages' });
  }
}

export default authMiddleware(handler);
