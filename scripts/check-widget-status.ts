/**
 * Script to check widget configuration status
 * Run with: npx ts-node scripts/check-widget-status.ts
 */

import { prisma } from '../lib/prisma';

async function checkWidgetStatus() {
  console.log('🔍 Checking Widget Configuration...\n');

  try {
    const settings = await prisma.widgetSettings.findFirst();

    if (!settings) {
      console.log('❌ No widget settings found in database');
      console.log('💡 Tip: Visit /admin/widget and save settings to create them\n');
      return;
    }

    console.log('✅ Widget settings found!');
    console.log('─────────────────────────────────────');
    console.log(`Widget Active: ${settings.embedActive ? '✅ YES' : '❌ NO'}`);
    console.log(`Title: ${settings.title}`);
    console.log(`Welcome Text: ${settings.welcomeText}`);
    console.log(`Position: ${settings.position}`);
    console.log(`Primary Color: ${settings.primaryColor}`);
    console.log('─────────────────────────────────────\n');

    if (!settings.embedActive) {
      console.log('⚠️  WARNING: Widget is DISABLED!');
      console.log('To enable:');
      console.log('1. Go to http://localhost:3000/admin/widget');
      console.log('2. Toggle "Widget Active" to ON');
      console.log('3. Click Save\n');
    } else {
      console.log('✅ Widget is ENABLED and ready to use!');
      console.log('Test it at: http://localhost:3000/test-widget\n');
    }

  } catch (error) {
    console.error('❌ Error checking widget status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWidgetStatus();
