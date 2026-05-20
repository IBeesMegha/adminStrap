import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/types';
import { 
  dropDynamicTable, 
  syncTableSchema, 
  tableExists 
} from '@/lib/dynamic-table-service';

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
      // Update collection type with automatic schema synchronization
      const { displayName, description, fields } = req.body;

      if (!fields || !fields.fields || fields.fields.length === 0) {
        return res.status(400).json({ error: 'At least one field is required' });
      }

      try {
        console.log(`\n=== Updating collection: ${name} ===`);
        
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

        // 2. Sync table schema with new fields (add/remove columns as needed)
        console.log('Step 2: Synchronizing table schema...');
        await syncTableSchema(name, fields.fields);
        console.log('✓ Table schema synchronized');

        console.log(`\n✓ Collection ${name} updated successfully!`);
        console.log('✓ No server restart needed - changes are live\n');
        
        return res.status(200).json({ 
          data: collectionType,
          message: 'Collection updated successfully. Changes are live.',
          requiresRestart: false
        });
        
      } catch (error: any) {
        console.error('\n✗ Update failed:', error.message);
        
        return res.status(500).json({ 
          error: `Failed to update collection: ${error.message}` 
        });
      }
    }

    if (req.method === 'DELETE') {
      // Delete collection type and drop its table
      try {
        console.log(`\n=== Deleting collection: ${name} ===`);
        
        // 1. Delete collection type metadata
        console.log('Step 1: Deleting collection metadata...');
        await prisma.collectionType.delete({
          where: { name },
        });
        console.log('✓ Metadata deleted');

        // 2. Drop the dynamic table
        console.log('Step 2: Dropping dynamic table...');
        await dropDynamicTable(name);
        console.log('✓ Table dropped');

        console.log(`\n✓ Collection ${name} deleted successfully!\n`);

        return res.status(200).json({ 
          message: 'Collection deleted successfully.',
          requiresRestart: false
        });
      } catch (error: any) {
        console.error('\n✗ Deletion failed:', error.message);
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
