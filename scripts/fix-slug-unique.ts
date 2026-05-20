import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSlugUnique() {
  try {
    console.log('Fixing slug field to be unique...');
    
    const blogCollection = await prisma.collectionType.findUnique({
      where: { name: 'blog' }
    });

    if (!blogCollection) {
      console.log('Blog collection not found');
      return;
    }

    const fields = (blogCollection.fields as any)?.fields || [];
    
    // Find and update the slug field
    const updatedFields = fields.map((field: any) => {
      if (field.name === 'slug' && field.type === 'uid') {
        console.log(`Updating slug field: unique ${field.unique} -> true`);
        return {
          ...field,
          unique: true
        };
      }
      return field;
    });

    // Update the collection
    await prisma.collectionType.update({
      where: { id: blogCollection.id },
      data: {
        fields: {
          fields: updatedFields
        }
      }
    });

    console.log('✅ Slug field updated successfully!');
    
    // Verify the update
    const updated = await prisma.collectionType.findUnique({
      where: { name: 'blog' }
    });
    
    const updatedSlugField = ((updated?.fields as any)?.fields || []).find((f: any) => f.name === 'slug');
    console.log('\nVerification:');
    console.log(`Slug field unique: ${updatedSlugField?.unique}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSlugUnique();
