import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlogFields() {
  try {
    const blogCollection = await prisma.collectionType.findUnique({
      where: { name: 'blog' }
    });

    if (!blogCollection) {
      console.log('Blog collection not found');
      return;
    }

    console.log('Blog Collection:', blogCollection.name);
    console.log('Display Name:', blogCollection.displayName);
    console.log('\nFields:');
    
    const fields = (blogCollection.fields as any)?.fields || [];
    fields.forEach((field: any) => {
      console.log(`\n- ${field.name} (${field.displayName})`);
      console.log(`  Type: ${field.type}`);
      console.log(`  Required: ${field.required || false}`);
      console.log(`  Unique: ${field.unique || false}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogFields();
