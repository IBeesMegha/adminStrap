/**
 * Helper script to add opposite relation field to a collection
 * 
 * Usage:
 * npx ts-node scripts/add-opposite-relation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addOppositeRelation() {
  try {
    // Get the Category collection
    const categoryCollection = await prisma.collectionType.findUnique({
      where: { name: 'cate' }
    });

    if (!categoryCollection) {
      console.error('Category collection not found');
      return;
    }

    const fields = (categoryCollection.fields as any).fields || [];

    // Check if blogs field already exists
    const blogsFieldExists = fields.some((f: any) => f.name === 'blogs');

    if (blogsFieldExists) {
      console.log('✓ Blogs field already exists in Category');
      return;
    }

    // Add the opposite relation field
    const newField = {
      name: 'blogs',
      type: 'relation',
      displayName: 'Blogs',
      required: false,
      relation: {
        type: 'oneToMany',
        targetCollection: 'blog',
        targetCollectionDisplay: 'Blog',
        targetField: 'cate', // The field in Blog that points to Category
        relationName: 'BlogToCategory'
      }
    };

    fields.push(newField);

    // Update the collection
    await prisma.collectionType.update({
      where: { name: 'cate' },
      data: {
        fields: {
          fields: fields
        }
      }
    });

    console.log('✓ Added blogs field to Category collection');
    console.log('✓ Refresh your admin panel to see the changes');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOppositeRelation();
