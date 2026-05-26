import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { findManyDynamic, createDynamic } from '@/lib/dynamic-prisma';
import { ApiResponse, Field } from '@/lib/types';
import { filterVirtualRelationFields } from '@/lib/relation-engine';
import { populateMultipleEntries, createComponentEntry } from '@/lib/component-populate';
import { resolveMultipleRelations } from '@/lib/relation-resolver';
import { getDefaultLanguage, generateTranslationGroupId, validateLanguage } from '@/lib/i18n-helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { name, populate } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid collection name' });
  }

  // Get lang parameter for filtering
  const lang = typeof req.query.lang === 'string' ? req.query.lang : await getDefaultLanguage();

  try {
    // Get collection type metadata
    const collectionType = await prisma.collectionType.findUnique({
      where: { name },
    });

    if (!collectionType) {
      return res.status(404).json({ error: 'Collection type not found' });
    }

    const fields = (collectionType.fields as any)?.fields || [];

    if (req.method === 'GET') {
      // Get all entries from dynamic table, filtered by language
      let entries: any = await findManyDynamic(name, {
        where: { lang }
      });

      // Convert field names from database format back to collection type format
      // Use exact field names - no conversion
      const convertedEntries = entries.map((entry: any) => {
        return { ...entry };
      });

      // ALWAYS resolve relations automatically using new relation resolver
      let finalEntries = await resolveMultipleRelations(convertedEntries, name, fields);

      // Populate components if requested
      if (populate === 'true') {
        finalEntries = await populateMultipleEntries(finalEntries, fields);
      }

      return res.status(200).json({ data: finalEntries });
    }

    if (req.method === 'POST') {
      // Create new entry in dynamic table
      const { data: entryData, lang: requestLang, translationGroupId } = req.body;

      console.log('[API POST] Received data:', entryData);
      console.log('[API POST] Language:', requestLang);
      console.log('[API POST] Translation Group ID:', translationGroupId);

      if (!entryData || Object.keys(entryData).length === 0) {
        return res.status(400).json({ error: 'Missing entry data' });
      }

      // Determine language - use provided lang or default
      const entryLang = requestLang || await getDefaultLanguage();
      
      // Validate language if provided
      if (requestLang && !(await validateLanguage(requestLang))) {
        return res.status(400).json({ error: 'Invalid or inactive language' });
      }

      // Generate or use provided translation group ID
      const groupId = translationGroupId || generateTranslationGroupId();

      console.log('[API POST] Using language:', entryLang);
      console.log('[API POST] Using translation group ID:', groupId);

      console.log('[API POST] Collection fields:', fields.map((f: any) => ({ name: f.name, type: f.type })));

      // Use exact field names - no conversion
      const convertedData: Record<string, any> = {};
      Object.keys(entryData).forEach(key => {
        convertedData[key] = entryData[key];
        console.log(`[API POST] Field: ${key}`);
      });

      console.log('[API POST] Data to insert:', convertedData);

      // Check for unique field violations
      for (const field of fields) {
        if (field.unique && convertedData[field.name] !== undefined && convertedData[field.name] !== null && convertedData[field.name] !== '') {
          const fieldName = field.name; // Use exact field name

          console.log(`[API POST] Checking uniqueness for field: ${fieldName}, value: ${convertedData[fieldName]}`);

          const existingEntry = await findManyDynamic(name, {
            where: {
              [fieldName]: convertedData[fieldName]
            }
          }) as any[];

          console.log(`[API POST] Found ${existingEntry.length} existing entries with same value`);

          if (existingEntry && existingEntry.length > 0) {
            console.log(`[API POST] Duplicate found: entry ${existingEntry[0].id} has same ${field.displayName}`);
            return res.status(400).json({ 
              error: `This ${field.displayName} already exists. The field "${field.displayName}" must be unique.` 
            });
          }
        }
      }

      // Process component fields - create component entries if needed
      const processedData = await processComponentFields(convertedData, fields);

      // Filter out virtual relation fields (like "blogs" in Category)
      // Only keep physical columns (like "categoryId" in Blog)
      const filteredData = filterVirtualRelationFields(fields, processedData);

      console.log('[API POST] Filtered data:', filteredData);

      // Prepare data for insertion with i18n fields
      const dataToInsert = {
        ...filteredData,
        translationGroupId: groupId,
        lang: entryLang,
        localeStatus: 'published',
      };

      const entry = await createDynamic(name, dataToInsert);
      return res.status(201).json({ data: entry });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Collection Entries API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Process component fields in entry data
 * Creates component entries for inline component data
 */
async function processComponentFields(
  data: Record<string, any>,
  fields: Field[]
): Promise<Record<string, any>> {
  const processed = { ...data };

  for (const field of fields) {
    if (field.type !== 'component') continue;

    const value = data[field.name];
    if (!value) continue;

    try {
      if (field.multiple) {
        // Repeatable component
        if (Array.isArray(value)) {
          processed[field.name] = await Promise.all(
            value.map(item => processComponentValue(item, field.componentRef!))
          );
        }
      } else {
        // Single component
        processed[field.name] = await processComponentValue(value, field.componentRef!);
      }
    } catch (error) {
      console.error(`[Process Components] Error processing field ${field.name}:`, error);
      // Keep original value on error
    }
  }

  return processed;
}

/**
 * Process a single component value
 * If it's an object without ID, create a new component entry
 */
async function processComponentValue(value: any, componentName: string): Promise<string> {
  // Already a reference (string ID)
  if (typeof value === 'string') {
    return value;
  }

  // Object with ID (reference object)
  if (typeof value === 'object' && value.id) {
    return value.id;
  }

  // Object without ID - create new component entry
  if (typeof value === 'object' && !value.id) {
    const entry = await createComponentEntry(componentName, value);
    return entry.id;
  }

  throw new Error(`Invalid component value: ${JSON.stringify(value)}`);
}
