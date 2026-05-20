                          /**
 * Script to clean up hardcoded tables (Blog, BlogCate)
 * These should only exist if they have entries in CollectionType table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of hardcoded tables...\n');

  try {
    // Check if Blog and BlogCate exist in CollectionType
    const blogCollection = await prisma.collectionType.findUnique({
      where: { name: 'blog' },
    });

    const blogCateCollection = await prisma.collectionType.findUnique({
      where: { name: 'blog-cate' },
    });

    console.log('CollectionType entries:');
    console.log('- blog:', blogCollection ? '✓ EXISTS' : '✗ NOT FOUND');
    console.log('- blog-cate:', blogCateCollection ? '✓ EXISTS' : '✗ NOT FOUND');
    console.log('');

    // Check if tables exist in database
    const blogTableExists = await checkTableExists('blog');
    const blogCateTableExists = await checkTableExists('blog_cate');

    console.log('Database tables:');
    console.log('- blog:', blogTableExists ? '✓ EXISTS' : '✗ NOT FOUND');
    console.log('- blog_cate:', blogCateTableExists ? '✓ EXISTS' : '✗ NOT FOUND');
    console.log('');

    // Determine what needs to be done
    if (!blogCollection && blogTableExists) {
      console.log('⚠️  WARNING: blog table exists but no CollectionType entry');
      console.log('   This table should be removed or a CollectionType entry should be created');
    }

    if (!blogCateCollection && blogCateTableExists) {
      console.log('⚠️  WARNING: blog_cate table exists but no CollectionType entry');
      console.log('   This table should be removed or a CollectionType entry should be created');
    }

    if (blogCollection && !blogTableExists) {
      console.log('⚠️  WARNING: CollectionType entry exists for blog but table does not');
      console.log('   Run schema regeneration to create the table');
    }

    if (blogCateCollection && !blogCateTableExists) {
      console.log('⚠️  WARNING: CollectionType entry exists for blog-cate but table does not');
      console.log('   Run schema regeneration to create the table');
    }

    console.log('\n✓ Cleanup check complete');
    console.log('\nNext steps:');
    console.log('1. If you want to keep Blog and BlogCate tables:');
    console.log('   - Create CollectionType entries for them via the admin UI');
    console.log('   - Or run the schema regeneration API: POST /api/schema/regenerate');
    console.log('');
    console.log('2. If you want to remove Blog and BlogCate tables:');
    console.log('   - Delete any CollectionType entries for them');
    console.log('   - Run: npx prisma migrate dev --name remove_hardcoded_tables');
    console.log('   - The tables will be dropped automatically');

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result: any = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      )
    `);
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
