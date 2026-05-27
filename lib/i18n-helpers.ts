import { prisma } from './prisma';
import { createId } from '@paralleldrive/cuid2';

/**
 * Get the default language code
 */
export async function getDefaultLanguage(): Promise<string> {
  const defaultLang = await prisma.language.findFirst({
    where: { isDefault: true },
  });

  return defaultLang?.code || 'en';
}

/**
 * Get all active language codes
 */
export async function getActiveLanguages(): Promise<string[]> {
  const languages = await prisma.language.findMany({
    where: { isActive: true },
    select: { code: true },
  });

  return languages.map(lang => lang.code);
}

/**
 * Generate a new translation group ID
 */
export function generateTranslationGroupId(): string {
  return createId();
}

/**
 * Get all translations for a translation group
 */
export async function getTranslations(
  tableName: string,
  translationGroupId: string
): Promise<any[]> {
  const sanitizedTable = tableName.toLowerCase().replace(/-/g, '_');
  
  const translations = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "${sanitizedTable}" WHERE "translationGroupId" = $1`,
    translationGroupId
  );

  return translations;
}

/**
 * Check if a translation exists for a specific language
 */
export async function translationExists(
  tableName: string,
  translationGroupId: string,
  lang: string
): Promise<boolean> {
  const sanitizedTable = tableName.toLowerCase().replace(/-/g, '_');
  
  const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM "${sanitizedTable}" 
      WHERE "translationGroupId" = $1 AND lang = $2
    )`,
    translationGroupId,
    lang
  );

  return result[0]?.exists || false;
}

/**
 * Get available translation languages for a translation group
 */
export async function getAvailableTranslations(
  tableName: string,
  translationGroupId: string
): Promise<string[]> {
  const sanitizedTable = tableName.toLowerCase().replace(/-/g, '_');
  
  const result = await prisma.$queryRawUnsafe<Array<{ lang: string }>>(
    `SELECT DISTINCT lang FROM "${sanitizedTable}" WHERE "translationGroupId" = $1`,
    translationGroupId
  );

  return result.map(r => r.lang);
}

/**
 * Get entry by slug and language with fallback
 */
export async function getEntryBySlugWithFallback(
  tableName: string,
  slug: string,
  lang: string
): Promise<any | null> {
  const sanitizedTable = tableName.toLowerCase().replace(/-/g, '_');
  const defaultLang = await getDefaultLanguage();

  // Try to get entry in requested language
  let result = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "${sanitizedTable}" WHERE slug = $1 AND lang = $2 LIMIT 1`,
    slug,
    lang
  );

  // If not found and requested language is not default, try default language
  if (result.length === 0 && lang !== defaultLang) {
    result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "${sanitizedTable}" WHERE slug = $1 AND lang = $2 LIMIT 1`,
      slug,
      defaultLang
    );
  }

  return result[0] || null;
}

/**
 * Validate language code is active
 */
export async function validateLanguage(code: string): Promise<boolean> {
  const language = await prisma.language.findFirst({
    where: {
      code,
      isActive: true,
    },
  });

  return !!language;
}

/**
 * Get all translations for a single type by translation group
 */
export async function getSingleTypeTranslations(
  name: string,
  translationGroupId: string
): Promise<any[]> {
  const translations = await prisma.singleType.findMany({
    where: {
      name,
      translationGroupId,
    },
    orderBy: {
      lang: 'asc',
    },
  });

  return translations;
}

/**
 * Check if a single type translation exists for a specific language
 */
export async function singleTypeTranslationExists(
  name: string,
  translationGroupId: string,
  lang: string
): Promise<boolean> {
  const result = await prisma.singleType.findUnique({
    where: {
      name_lang: {
        name,
        lang,
      },
    },
  });

  return !!result;
}

/**
 * Get available translation languages for a single type
 */
export async function getSingleTypeAvailableTranslations(
  name: string,
  translationGroupId: string
): Promise<string[]> {
  const translations = await prisma.singleType.findMany({
    where: {
      name,
      translationGroupId,
    },
    select: {
      lang: true,
    },
  });

  return translations.map(t => t.lang);
}
