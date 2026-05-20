/**
 * Fix Category-Blogs Bidirectional Relation
 * 
 * This script adds the missing inverse relation field to Category
 * so that Category.blogs shows the list of blogs.
 * 
 * Usage: npx ts-node scripts/fix-category-blogs-relation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCategoryBlogsRelation() {
  try {
    console.log('\n=== Fixing Category-Blogs Relation ===\n');

    // 1. Get Blog collection
    const blogCollection = await prisma.collectionType.findUnique({
      where: { name: 'blog' }
    });

    if (!blogCollection) {
      console.error('❌ Blog collection not found');
      return;
    }

    const blogFields = (blogCollection.fields as any).fields || [];
    console.log('✓ Found Blog collection');

    // 2. Find the category relation field in Blog
    const categoryField = blogFields.find((f: any) => 
      f.type === 'relation' && 
      f.relation?.targetCollection === 'cate'
    );

    if (!categoryField) {
      console.error('❌ No category relation found in Blog');
      console.log('Available fields:', blogFields.map((f: any) => f.name));
      return;
    }

    console.log(`✓ Found relation field: ${categoryField.name}`);
    console.log(`  Type: ${categoryField.relation.type}`);
    console.log(`  Target: ${categoryField.relation.targetCollection}`);

    // 3. Get Category collection
    const categoryCollection = await prisma.collectionType.findUnique({
      where: { name: 'cate' }
    });

    if (!categoryCollection) {
      console.error('❌ Category collection not found');
      return;
    }

    const categoryFields = (categoryCollection.fields as any).fields || [];
    console.log('✓ Found Category collection');

    // 4. Check if blogs field already exists
    const blogsFieldExists = categoryFields.some((f: any) => 
      f.name === 'blogs' || f.name === 'blog'
    );

    if (blogsFieldExists) {
      console.log('⚠️  Blogs field already exists in Category');
      
      // Update it to ensure it's properly configured
      const existingIndex = categoryFields.findIndex((f: any) => 
        f.name === 'blogs' || f.name === 'blog'
      );

      categoryFields[existingIndex] = {
        name: 'blogs',
        type: 'relation',
        displayName: 'Blogs',
        required: false,
        relation: {
          type: 'oneToMany',
          targetCollection: 'blog',
          targetCollectionDisplay: 'Blog',
          targetField: categoryField.name,
          relationName: 'BlogToCategory',
          isOwner: false,
          isVirtual: true
        }
      };

      console.log('✓ Updated existing blogs field');
    } else {
      // 5. Add the inverse relation field
      const blogsField = {
        name: 'blogs',
        type: 'relation',
        displayName: 'Blogs',
        required: false,
        relation: {
          type: 'oneToMany',
          targetCollection: 'blog',
          targetCollectionDisplay: 'Blog',
          targetField: categoryField.name,
          relationName: 'BlogToCategory',
          isOwner: false,
          isVirtual: true
        }
      };

      categoryFields.push(blogsField);
      console.log('✓ Added blogs field to Category');
    }

    // 6. Update Category collection metadata
    await prisma.collectionType.update({
      where: { name: 'cate' },
      data: {
        fields: {
          fields: categoryFields
        }
      }
    });

    console.log('✓ Updated Category collection metadata');

    // 7. Update Blog's category field to ensure it has proper metadata
    const categoryFieldIndex = blogFields.findIndex((f: any) => f.name === categoryField.name);
    blogFields[categoryFieldIndex] = {
      ...categoryField,
      relation: {
        ...categoryField.relation,
        targetField: 'blogs',
        relationName: 'BlogToCategory',
        isOwner: true,
        isVirtual: false
      }
    };

    await prisma.collectionType.update({
      where: { name: 'blog' },
      data: {
        fields: {
          fields: blogFields
        }
      }
    });

    console.log('✓ Updated Blog collection metadata');

    console.log('\n=== ✅ Relation Fixed Successfully! ===\n');
    console.log('Next steps:');
    console.log('1. Refresh your admin panel');
    console.log('2. Go to a Category entry');
    console.log('3. You should now see the list of blogs');
    console.log('4. Check the console logs for [Relation Resolver] messages\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryBlogsRelation();
