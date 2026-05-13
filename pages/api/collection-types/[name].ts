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
  const { name } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid collection type name' });
  }

  try {
    if (req.method === 'GET') {
      // Get specific collection type
      const collectionType = await prisma.collectionType.findUnique({
        where: { name },
      });

      if (!collectionType) {
        return res.status(404).json({ error: 'Collection type not found' });
      }

      return res.status(200).json({ data: collectionType });
    }

    if (req.method === 'PUT') {
      // Update collection type with automatic relation synchronization
      const { displayName, description, fields } = req.body;

      if (!fields || !fields.fields || fields.fields.length === 0) {
        return res.status(400).json({ error: 'At least one field is required' });
      }

      // Store original state for rollback
      let originalCollectionType;
      
      try {
        console.log(`\n=== Updating collection: ${name} ===`);
        
        // Get original state before update
        originalCollectionType = await prisma.collectionType.findUnique({
          where: { name },
        });
        
        // 1. Update the collection metadata in database
        console.log('Step 1: Updating collection metadata...');
        const collectionType = await prisma.collectionType.update({
          where: { name },
          data: {
            displayName,
            description,
            fields,
          },
        });
        console.log('✓ Metadata updated');

        // 2. Synchronize relations (add opposite fields to target collections)
        console.log('Step 2: Synchronizing relations...');
        await synchronizeRelations(name, fields.fields);
        console.log('✓ Relations synchronized');

        // 3. Regenerate complete Prisma schema from metadata
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

        // 5. Push schema to database (NO CLIENT GENERATION - avoids Windows EPERM)
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

        console.log(`\n✓ Collection ${name} updated successfully!\n`);
        console.log('⚠️  IMPORTANT: Please restart your dev server to use the updated Prisma Client');
        console.log('   Press Ctrl+C in terminal, then run: npm run dev\n');
        
        return res.status(200).json({ 
          data: collectionType,
          message: 'Schema updated successfully. Please restart your development server to use the updated Prisma Client.',
          requiresRestart: true
        });
        
      } catch (error: any) {
        console.error('\n✗ Update failed:', error.message);
        
        // Attempt rollback to original state
        if (originalCollectionType) {
          try {
            console.log('Attempting rollback to original state...');
            
            // Restore original metadata
            await prisma.collectionType.update({
              where: { name },
              data: {
                displayName: originalCollectionType.displayName,
                description: originalCollectionType.description,
                fields: originalCollectionType.fields as any,
              },
            });
            
            // Regenerate schema from original state
            await regenerateSchema();
            
            // Try to push original schema back
            try {
              await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
                windowsHide: true,
                timeout: 120000,
              });
              console.log('✓ Rollback completed successfully');
            } catch (rollbackPushError) {
              console.error('⚠ Rollback push failed, but metadata restored');
            }
            
          } catch (rollbackError) {
            console.error('✗ Rollback error:', rollbackError);
          }
        }
        
        return res.status(500).json({ 
          error: `Failed to update schema: ${error.message}` 
        });
      }
    }

    if (req.method === 'DELETE') {
      // Delete collection type
      try {
        await prisma.collectionType.delete({
          where: { name },
        });

        // Regenerate schema without this collection
        await regenerateSchema();
        
        // Push updated schema
        await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
          windowsHide: true,
          timeout: 120000,
        });

        return res.status(200).json({ 
          message: 'Collection type deleted. Please restart your dev server.',
          requiresRestart: true
        });
      } catch (error: any) {
        return res.status(500).json({ 
          error: `Failed to delete collection: ${error.message}` 
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Collection Type API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
