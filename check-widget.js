/**
 * Simple script to check and enable the widget
 * Run: node check-widget.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking widget status...\n');

  try {
    // Check if settings exist
    let settings = await prisma.widgetSettings.findFirst();

    if (!settings) {
      console.log('❌ No widget settings found. Creating default settings...');
      
      settings = await prisma.widgetSettings.create({
        data: {
          title: 'AI Assistant',
          welcomeText: 'Hi! How can I help you today?',
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          textColor: '#1f2937',
          bgColor: '#ffffff',
          position: 'bottom-right',
          marginX: 20,
          marginY: 20,
          width: 380,
          height: 600,
          borderRadius: 16,
          showLogo: false,
          logoUrl: '',
          logoWidth: 40,
          showAvatar: true,
          avatarUrl: '',
          avatarStyle: 'rounded',
          bubbleStyle: 'rounded',
          fontSize: '14px',
          headerBgColor: '#2563eb',
          headerTextColor: '#ffffff',
          userMsgBgColor: '#2563eb',
          userMsgTextColor: '#ffffff',
          botMsgBgColor: '#f3f4f6',
          botMsgTextColor: '#1f2937',
          inputBgColor: '#ffffff',
          inputBorderColor: '#e5e7eb',
          sendButtonColor: '#2563eb',
          sendIconColor: '#ffffff',
          customCss: '',
          embedActive: true,
        },
      });
      
      console.log('✅ Widget settings created!\n');
    }

    // Check if enabled
    if (!settings.embedActive) {
      console.log('⚠️  Widget is DISABLED. Enabling...');
      
      settings = await prisma.widgetSettings.update({
        where: { id: settings.id },
        data: { embedActive: true },
      });
      
      console.log('✅ Widget ENABLED!\n');
    } else {
      console.log('✅ Widget is already ENABLED!\n');
    }

    // Display status
    console.log('📊 Widget Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Title:        ${settings.title}`);
    console.log(`Welcome:      ${settings.welcomeText}`);
    console.log(`Active:       ${settings.embedActive ? '✅ YES' : '❌ NO'}`);
    console.log(`Position:     ${settings.position}`);
    console.log(`Color:        ${settings.primaryColor}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test URLs
    console.log('🔗 Test URLs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Widget Status:  http://localhost:3000/api/widget/status');
    console.log('Widget Config:  http://localhost:3000/api/widget/config');
    console.log('Widget Script:  http://localhost:3000/api/widget/embed.js');
    console.log('Test Page:      file:///c:/Users/ibees/OneDrive%20-%20Interactive%20Bees%20Pvt%20Ltd/Desktop/aiStrap/test-widget.html');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 Next Step:');
    console.log('Add this to your Indorama project:');
    console.log('<script src="http://localhost:3000/api/widget/embed.js"></script>\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Database is running');
    console.error('   2. .env file has correct DATABASE_URL');
    console.error('   3. Prisma schema is up to date (npm run prisma:generate)\n');
  } finally {
    await prisma.$disconnect();
  }
}

main();
