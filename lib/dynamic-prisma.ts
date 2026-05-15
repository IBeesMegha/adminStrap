import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Generate a CUID-like ID
 */
function generateCuid(): string {
  return 'c' + randomBytes(12).toString('base64').replace(/[^a-z0-9]/gi, '').substring(0, 24);
}

/**
 * Execute raw SQL query
 */
export async function executeRawQuery(query: string, params: any[] = []) {
  return await prisma.$queryRawUnsafe(query, ...params);
}

/**
 * Get all records from a dynamic table
 */
export async function findManyDynamic(tableName: string, options?: { where?: Record<string, any> }) {
  if (options?.where) {
    const whereKeys = Object.keys(options.where);
    const whereValues = Object.values(options.where);
    const whereClause = whereKeys.map((key, i) => `"${key}" = $${i + 1}`).join(' AND ');
    const query = `SELECT * FROM "${tableName}" WHERE ${whereClause} ORDER BY "createdAt" DESC`;
    return await executeRawQuery(query, whereValues);
  }
  
  const query = `SELECT * FROM "${tableName}" ORDER BY "createdAt" DESC`;
  return await executeRawQuery(query);
}

/**
 * Get single record from a dynamic table
 */
export async function findUniqueDynamic(tableName: string, id: string) {
  const query = `SELECT * FROM "${tableName}" WHERE id = $1`;
  return await executeRawQuery(query, [id]);
}

/**
 * Filter out virtual relation fields that don't exist as physical database columns
 * This prevents trying to insert/update fields like "products" which are virtual Prisma relations
 */
async function filterVirtualRelationFields(
  tableName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  // Get actual database columns
  const columnsInfo: any = await getTableColumns(tableName);
  const actualColumns = new Set(
    columnsInfo.map((col: any) => col.column_name)
  );

  // Filter out fields that don't exist as physical columns
  const filteredData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (actualColumns.has(key)) {
      filteredData[key] = value;
    } else {
      console.log(`[Dynamic CRUD] Skipping virtual relation field: ${key} (not a physical column in ${tableName})`);
    }
  }

  return filteredData;
}

/**
 * Create record in a dynamic table
 */
export async function createDynamic(
  tableName: string,
  data: Record<string, any>
) {
  // First, get column types to know which are JSONB
  const columnsInfo: any = await getTableColumns(tableName);
  const jsonbColumns = new Set(
    columnsInfo
      .filter((col: any) => col.data_type === 'jsonb')
      .map((col: any) => col.column_name)
  );

  // Add default values for required fields
  const dataWithDefaults = {
    id: data.id || generateCuid(),
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
  
  // CRITICAL: Filter out virtual relation fields before processing
  // This prevents errors like: column "products" of relation "product_category" does not exist
  const filteredData = await filterVirtualRelationFields(tableName, dataWithDefaults);
  
  // Convert date strings to Date objects and handle JSON fields
  const processedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(filteredData)) {
    if (value === null || value === undefined) {
      processedData[key] = value;
    } else if (value instanceof Date) {
      // Keep Date objects as is - they'll be properly handled by Prisma
      processedData[key] = value;
    } else if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Convert YYYY-MM-DD string to Date object
      processedData[key] = new Date(value);
    } else if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
      // Parse JSON strings to objects for JSONB columns
      try {
        const parsed = JSON.parse(value);
        processedData[key] = parsed;
      } catch (e) {
        console.error(`Failed to parse JSON for key ${key}:`, e);
        processedData[key] = value;
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Already an object, keep as is (will be handled by PostgreSQL)
      processedData[key] = value;
    } else if (Array.isArray(value)) {
      // Already an array, keep as is
      processedData[key] = value;
    } else {
      processedData[key] = value;
    }
  }
  
  const columns = Object.keys(processedData);
  const values = Object.values(processedData).map((value, i) => {
    const colName = columns[i];
    // Convert objects/arrays to JSON strings for JSONB columns
    if (jsonbColumns.has(colName) && (typeof value === 'object' && value !== null && !(value instanceof Date))) {
      return JSON.stringify(value);
    }
    return value;
  });
  
  // Build placeholders with JSONB casting for JSONB columns
  const placeholders = values.map((_, i) => {
    const colName = columns[i];
    if (jsonbColumns.has(colName)) {
      return `$${i + 1}::jsonb`;
    }
    return `$${i + 1}`;
  }).join(', ');
  
  const query = `
    INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  console.log(`[Dynamic CRUD] Creating record in ${tableName} with columns:`, columns);
  console.log(`[Dynamic CRUD] Query:`, query);
  console.log(`[Dynamic CRUD] Values:`, values);
  
  const result: any = await executeRawQuery(query, values);
  return result[0];
}

/**
 * Update record in a dynamic table
 */
export async function updateDynamic(
  tableName: string,
  id: string,
  data: Record<string, any>
) {
  // First, get column types to know which are JSONB
  const columnsInfo: any = await getTableColumns(tableName);
  const jsonbColumns = new Set(
    columnsInfo
      .filter((col: any) => col.data_type === 'jsonb')
      .map((col: any) => col.column_name)
  );

  // CRITICAL: Filter out virtual relation fields before processing
  // This prevents errors like: column "products" of relation "product_category" does not exist
  const filteredData = await filterVirtualRelationFields(tableName, data);

  // Remove updatedAt from data if it exists (we'll add it manually in the query)
  const { updatedAt, ...dataWithoutUpdatedAt } = filteredData;

  // Convert date strings to Date objects and handle JSON fields
  const processedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(dataWithoutUpdatedAt)) {
    if (value === null || value === undefined) {
      processedData[key] = value;
    } else if (value instanceof Date) {
      // Keep Date objects as is - they'll be properly handled by Prisma
      processedData[key] = value;
    } else if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Convert YYYY-MM-DD string to Date object
      processedData[key] = new Date(value);
    } else if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
      // Parse JSON strings to objects for JSONB columns
      try {
        const parsed = JSON.parse(value);
        processedData[key] = parsed;
      } catch (e) {
        console.error(`Failed to parse JSON for key ${key}:`, e);
        processedData[key] = value;
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Already an object, keep as is
      processedData[key] = value;
    } else if (Array.isArray(value)) {
      // Already an array, keep as is
      processedData[key] = value;
    } else {
      processedData[key] = value;
    }
  }
  
  const columns = Object.keys(processedData);
  const values = Object.values(processedData).map((value, i) => {
    const colName = columns[i];
    // Convert objects/arrays to JSON strings for JSONB columns
    if (jsonbColumns.has(colName) && (typeof value === 'object' && value !== null && !(value instanceof Date))) {
      return JSON.stringify(value);
    }
    return value;
  });
  
  // Build SET clause with JSONB casting for JSONB columns
  const setClause = columns.map((col, i) => {
    if (jsonbColumns.has(col)) {
      return `"${col}" = $${i + 1}::jsonb`;
    }
    return `"${col}" = $${i + 1}`;
  }).join(', ');
  
  const query = `
    UPDATE "${tableName}"
    SET ${setClause}, "updatedAt" = NOW()
    WHERE id = $${values.length + 1}
    RETURNING *
  `;
  
  console.log(`[Dynamic CRUD] Updating record in ${tableName} with columns:`, columns);
  console.log(`[Dynamic CRUD] Query:`, query);
  console.log(`[Dynamic CRUD] Values:`, values);
  
  const result: any = await executeRawQuery(query, [...values, id]);
  return result[0];
}

/**
 * Delete record from a dynamic table
 */
export async function deleteDynamic(tableName: string, id: string) {
  const query = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING *`;
  const result: any = await executeRawQuery(query, [id]);
  return result[0];
}

/**
 * Check if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `;
  
  const result: any = await executeRawQuery(query, [tableName]);
  return result[0]?.exists || false;
}

/**
 * Get table columns
 */
export async function getTableColumns(tableName: string) {
  const query = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `;
  
  return await executeRawQuery(query, [tableName]);
}
