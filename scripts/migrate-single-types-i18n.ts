/**
 * Migration script to add i18n support to existing single types
 * 
 * This script:
 * 1. Finds all existing single types without translationGroupId
 * 2. Assigns them a translationGroupId
 * 3. Sets their lang to the default language
 * 4. Sets localeStatus to 'published'
 * 
 * Run with: npx ts-node scripts/migrate-single-types-i18n.ts
 */

import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Single Types i18n Migration...\n');

  try {
    // Get default language
    const defaultLang = await prisma.language.findFirst({
      where: { isDefault: true },
    });

    if (!defaultLang) {
      console.error('❌ No default language found. Please seed languages first.');
      process.exit(1);
    }

    console.log(`✓ Default language: ${defaultLang.name} (${defaultLang.code})\n`);

    // Find all single types
    const singleTypes = await prisma.singleType.findMany();

    if (singleTypes.length === 0) {
      console.log('✓ No single types found. Nothing to migrate.');
      return;
    }

    console.log(`Found ${singleTypes.length} single type(s) to check:\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const singleType of singleTypes) {
      // Check if already has i18n fields
      if (singleType.translationGroupId && singleType.lang) {
        console.log(`⏭️  Skipping "${singleType.name}" - already has i18n fields`);
        skippedCount++;
        continue;
      }

      // Generate translation group ID
      const translationGroupId = createId();

      // Update the single type
      await prisma.singleType.update({
        where: { id: singleType.id },
        data: {
          translationGroupId,
          lang: defaultLang.code,
          localeStatus: 'published',
        },
      });

      console.log(`✓ Migrated "${singleType.name}" (${singleType.displayName})`);
      console.log(`  - Translation Group ID: ${translationGroupId}`);
      console.log(`  - Language: ${defaultLang.code}`);
      console.log(`  - Status: published\n`);

      migratedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✓ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  📝 Total: ${singleTypes.length}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
