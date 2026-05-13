import { z } from 'zod';

// Field Types
export type FieldType = 
  | 'string' 
  | 'text' 
  | 'richtext' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'email'
  | 'json'
  | 'media'
  | 'component'
  | 'dynamiczone'
  | 'relation';

export interface RelationMetadata {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  targetCollection: string;
  targetCollectionDisplay: string;
  targetField: string;
  // Metadata for tracking bidirectional relations
  relationName?: string; // e.g., "ProductToCategory"
  isOwner?: boolean; // Which side owns the foreign key
}

export interface Field {
  name: string;
  type: FieldType;
  displayName: string;
  required?: boolean;
  unique?: boolean;
  default?: any;
  componentRef?: string; // For component type
  multiple?: boolean; // For component arrays and media fields (true = array, false/undefined = single)
  relation?: RelationMetadata;
  validations?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface ContentTypeFields {
  fields: Field[];
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  requiresRestart?: boolean; // Indicates if dev server restart is needed
}

// Content Type Builder Types
export interface CollectionTypeData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fields: ContentTypeFields;
  createdAt: Date;
  updatedAt: Date;
}

export interface SingleTypeData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  fields: ContentTypeFields;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentData {
  id: string;
  name: string;
  displayName: string;
  category: string;
  fields: ContentTypeFields;
  createdAt: Date;
  updatedAt: Date;
}

// Form validation helpers
export const createFieldSchema = (field: Field): z.ZodTypeAny => {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case 'string':
    case 'text':
    case 'email':
      schema = z.string();
      if (field.validations?.minLength) {
        schema = (schema as z.ZodString).min(field.validations.minLength);
      }
      if (field.validations?.maxLength) {
        schema = (schema as z.ZodString).max(field.validations.maxLength);
      }
      if (field.type === 'email') {
        schema = (schema as z.ZodString).email();
      }
      break;
    case 'richtext':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      if (field.validations?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(field.validations.min);
      }
      if (field.validations?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(field.validations.max);
      }
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'date':
      schema = z.string().or(z.date());
      break;
    case 'media':
      // Handle media fields based on multiple property
      if (field.multiple) {
        // Multiple media - can be array or comma-separated string
        schema = z.string().or(z.array(z.string())).optional();
      } else {
        // Single media - single URL string
        schema = z.string().optional();
      }
      break;
    case 'relation':
      // Handle relation fields - store as ID or array of IDs
      if (field.relation?.type === 'oneToMany' || field.relation?.type === 'manyToMany') {
        schema = z.array(z.string()).or(z.string());
      } else {
        schema = z.string();
      }
      break;
    case 'json':
    case 'component':
    case 'dynamiczone':
      schema = z.any();
      break;
    default:
      schema = z.any();
  }

  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
};

export const createValidationSchema = (fields: Field[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach(field => {
    // For manyToOne and oneToOne relations, we need to validate the FK field (fieldNameId)
    if (field.type === 'relation' && field.relation) {
      if (field.relation.type === 'manyToOne' || field.relation.type === 'oneToOne') {
        // Sanitize field name and add 'Id' suffix for FK column
        const sanitizeFieldName = (name: string): string => {
          return name
            .replace(/[-_]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
            .replace(/^(.)/, (char) => char.toLowerCase());
        };
        const fkFieldName = `${sanitizeFieldName(field.name)}Id`;
        schemaObject[fkFieldName] = createFieldSchema(field);
        console.log(`[Validation Schema] Added FK field: ${fkFieldName} for relation: ${field.name}`);
      } else {
        // For oneToMany and manyToMany, use the original field name (will be filtered out by backend)
        schemaObject[field.name] = createFieldSchema(field);
      }
    } else {
      schemaObject[field.name] = createFieldSchema(field);
    }
  });

  console.log('[Validation Schema] Schema fields:', Object.keys(schemaObject));
  
  return z.object(schemaObject);
};
