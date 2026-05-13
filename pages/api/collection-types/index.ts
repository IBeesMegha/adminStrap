import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/types';
import { synchronizeRelations } from '@/lib/relation-engine';
import { regenerateSchema } from '@/lib/schema-sync';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === 'GET') {
      // Get all collection types
      const collectionTypes = await prisma.collectionType.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ data: collectionTypes });
    }

    if (req.method === 'POST') {
      // Create new collection type
      const { name, displayName, description, fields } = req.body;

      if (!name || !displayName || !fields) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let collectionType;

      try {
        console.log(`\n=== Creating collection: ${name} ===`);
        
        // 1. Create collection type metadata
        console.log('Step 1: Creating collection metadata...');
        collectionType = await prisma.collectionType.create({
          data: {
            name: name.toLowerCase().replace(/\s+/g, '-'),
            displayName,
            description,
            fields,
          },
        });
        console.log('✓ Metadata created');

        // 2. Synchronize relations (add opposite fields to target collections)
        console.log('Step 2: Synchronizing relations...');
        await synchronizeRelations(collectionType.name, fields.fields);
        console.log('✓ Relations synchronized');

        // 3. Regenerate complete Prisma schema
        console.log('Step 3: Regenerating Prisma schema...');
        await regenerateSchema();
        console.log('✓ Schema regenerated');

        // 4. Format schema (optional, don't fail if it errors)
        console.log('Step 4: Formatting schema...');
        try {
          await execAsync('npx prisma format', {
            windowsHide: true,
            timeout: 30000,
          });
          console.log('✓ Schema formatted');
        } catch (formatError) {
          console.warn('⚠ Schema formatting skipped (non-critical)');
        }

        // 5. Push schema to database (NO CLIENT GENERATION)
        console.log('Step 5: Pushing schema to database...');
        try {
          const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
            windowsHide: true,
            timeout: 120000,
          });
          
          if (stderr && !stderr.includes('warnings')) {
            console.warn('⚠ Push warnings:', stderr);
          }
          
          console.log('✓ Schema pushed to database');
        } catch (pushError: any) {
          console.error('✗ Push error:', pushError.message);
          throw new Error(`Failed to push schema to database: ${pushError.message}`);
        }

        console.log(`\n✓ Collection ${name} created successfully!\n`);
        console.log('⚠️  IMPORTANT: Please restart your dev server to use the updated Prisma Client');
        console.log('   Press Ctrl+C in terminal, then run: npm run dev\n');
        
        return res.status(201).json({ 
          data: collectionType,
          message: 'Collection created successfully. Please restart your development server to use the new Prisma Client.',
          requiresRestart: true
        });
        
      } catch (error: any) {
        console.error('\n✗ Creation failed:', error.message);
        
        // Rollback: delete the collection type if it was created
        if (collectionType) {
          try {
            console.log('Rolling back: Deleting collection metadata...');
            await prisma.collectionType.delete({
              where: { id: collectionType.id },
            });
            console.log('✓ Rollback completed');
          } catch (rollbackError) {
            console.error('✗ Rollback error:', rollbackError);
          }
        }
        
        return res.status(500).json({ 
          error: `Failed to create collection: ${error.message}` 
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Collection Types API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
