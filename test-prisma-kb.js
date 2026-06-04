// Test Prisma Knowledge Base Models
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  console.log('Testing Prisma Knowledge Base models...\n');
  
  try {
    // Test if knowledgeSource model exists
    console.log('✓ knowledgeSource model:', typeof prisma.knowledgeSource);
    console.log('✓ knowledgePage model:', typeof prisma.knowledgePage);
    
    // Try to count records
    const sourceCount = await prisma.knowledgeSource.count();
    const pageCount = await prisma.knowledgePage.count();
    
    console.log(`\n✅ Success!`);
    console.log(`   Knowledge Sources: ${sourceCount}`);
    console.log(`   Knowledge Pages: ${pageCount}`);
    console.log('\nPrisma client is working correctly! ✨');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
