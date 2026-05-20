# Quick Reference - Dynamic CMS

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Static Tables** | Managed by Prisma (CollectionType, SingleType, Component, ComponentEntry, Media) |
| **Dynamic Tables** | Created at runtime via raw SQL (blog, news, product, etc.) |
| **No Schema Edits** | `schema.prisma` never changes for dynamic tables |
| **No Restarts** | Changes are live immediately |

## Common Commands

### Create Collection
```typescript
POST /api/collection-types
{
  "name": "blog",
  "displayName": "Blog",
  "fields": {
    "fields": [
      { "name": "title", "type": "string", "required": true }
    ]
  }
}
```

### Update Collection
```typescript
PUT /api/collection-types/blog
{
  "fields": {
    "fields": [
      { "name": "title", "type": "string", "required": true },
      { "name": "author", "type": "string" } // NEW FIELD
    ]
  }
}
```

### Delete Collection
```typescript
DELETE /api/collection-types/blog
```

## CRUD Operations

```typescript
import {
  findManyDynamic,
  findUniqueDynamic,
  createDynamic,
  updateDynamic,
  deleteDynamic
} from '@/lib/dynamic-prisma';

// CREATE
const post = await createDynamic('blog', {
  title: 'Hello World',
  content: '<p>My first post</p>'
});

// READ ALL
const posts = await findManyDynamic('blog');

// READ ONE
const post = await findUniqueDynamic('blog', id);

// UPDATE
const updated = await updateDynamic('blog', id, {
  title: 'Updated Title'
});

// DELETE
await deleteDynamic('blog', id);
```

## Table Management

```typescript
import {
  createDynamicTable,
  dropDynamicTable,
  addColumn,
  removeColumn,
  syncTableSchema,
  tableExists
} from '@/lib/dynamic-table-service';

// Create table
await createDynamicTable('blog', fields);

// Drop table
await dropDynamicTable('blog');

// Add column
await addColumn('blog', {
  name: 'author',
  type: 'string',
  displayName: 'Author'
});

// Remove column
await removeColumn('blog', 'author');

// Sync schema
await syncTableSchema('blog', updatedFields);

// Check existence
if (await tableExists('blog')) {
  console.log('Table exists');
}
```

## Field Types

| Type | PostgreSQL Type | Example |
|------|----------------|---------|
| `string` | TEXT | `"Hello"` |
| `text` | TEXT | `"Long text..."` |
| `richtext` | TEXT | `"<p>HTML</p>"` |
| `richtext-ckeditor` | TEXT | `"<p>HTML</p>"` |
| `number` | DOUBLE PRECISION | `42.5` |
| `boolean` | BOOLEAN | `true` |
| `date` | TIMESTAMP(3) | `"2024-01-01"` |
| `email` | TEXT | `"user@example.com"` |
| `json` | JSONB | `{"key": "value"}` |
| `media` (single) | TEXT | `"https://..."` |
| `media` (multiple) | JSONB | `["url1", "url2"]` |
| `component` | JSONB | `{"field": "value"}` |
| `dynamiczone` | JSONB | `[{...}, {...}]` |
| `relation` | TEXT (FK) | `"clx123..."` |

## Relation Types

| Type | Description | FK Location |
|------|-------------|-------------|
| `oneToOne` | 1:1 relationship | Owner side |
| `manyToOne` | N:1 relationship | Many side |
| `oneToMany` | 1:N relationship | Many side |
| `manyToMany` | N:N relationship | Join table (implicit) |

### Example: Product → Category (Many-to-One)

```typescript
// Category table
await createDynamicTable('category', [
  { name: 'name', type: 'string', displayName: 'Name' }
]);

// Product table with FK
await createDynamicTable('product', [
  { name: 'name', type: 'string', displayName: 'Name' },
  {
    name: 'category',
    type: 'relation',
    displayName: 'Category',
    relation: {
      type: 'manyToOne',
      targetCollection: 'category',
      targetCollectionDisplay: 'Category',
      targetField: 'products'
    }
  }
]);

// Result: product table has "categoryId" column
```

## Raw SQL Queries

```typescript
import { prisma } from '@/lib/prisma';

// SELECT
const posts = await prisma.$queryRawUnsafe(
  'SELECT * FROM "blog" WHERE published = $1 ORDER BY "createdAt" DESC',
  true
);

// INSERT
await prisma.$executeRawUnsafe(
  'INSERT INTO "blog" (id, title, content) VALUES ($1, $2, $3)',
  'clx123',
  'Title',
  'Content'
);

// UPDATE
await prisma.$executeRawUnsafe(
  'UPDATE "blog" SET title = $1 WHERE id = $2',
  'New Title',
  'clx123'
);

// DELETE
await prisma.$executeRawUnsafe(
  'DELETE FROM "blog" WHERE id = $1',
  'clx123'
);

// COUNT
const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
  'SELECT COUNT(*) FROM "blog"'
);
console.log(Number(count[0].count));
```

## Security

### SQL Injection Prevention

```typescript
// ✅ SAFE - Parameterized query
await prisma.$queryRawUnsafe(
  'SELECT * FROM "blog" WHERE id = $1',
  userId
);

// ❌ UNSAFE - String concatenation
await prisma.$queryRawUnsafe(
  `SELECT * FROM "blog" WHERE id = '${userId}'`
);

// ✅ SAFE - Validated identifier
import { validateSqlIdentifier } from '@/lib/dynamic-table-service';

if (validateSqlIdentifier(tableName)) {
  await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
}
```

### Valid Identifiers

```typescript
validateSqlIdentifier('blog')        // ✅ true
validateSqlIdentifier('blog_posts')  // ✅ true
validateSqlIdentifier('BlogPosts')   // ✅ true
validateSqlIdentifier('blog-posts')  // ❌ false
validateSqlIdentifier('blog; DROP')  // ❌ false
```

## Naming Conventions

| Input | Output | Type |
|-------|--------|------|
| `blog-posts` | `blog_posts` | Table name |
| `Blog Posts` | `blog_posts` | Table name |
| `profile-image` | `profile_image` | Column name |
| `Profile Image` | `profile_image` | Column name |

## Troubleshooting

### Table Already Exists
```typescript
// Check before creating
if (await tableExists('blog')) {
  console.log('Table already exists');
} else {
  await createDynamicTable('blog', fields);
}
```

### Column Does Not Exist
```typescript
// Sync schema to add missing columns
await syncTableSchema('blog', fields);
```

### Invalid Table Name
```typescript
// Validate before using
if (!validateSqlIdentifier(tableName)) {
  throw new Error('Invalid table name');
}
```

### Data Type Mismatch
```typescript
// Check column types
const columns = await getTableColumns('blog');
console.log(columns);
```

## Migration Cleanup

```bash
# Development
rm -rf prisma/migrations
npx prisma migrate dev --name init

# Production
# No action needed - dynamic tables continue to work
```

## Testing

```typescript
// Unit test
describe('Dynamic Tables', () => {
  it('should create table', async () => {
    await createDynamicTable('test', fields);
    expect(await tableExists('test')).toBe(true);
  });
  
  afterAll(async () => {
    await dropDynamicTable('test');
  });
});

// Integration test
describe('API', () => {
  it('should create collection', async () => {
    const res = await fetch('/api/collection-types', {
      method: 'POST',
      body: JSON.stringify({ name: 'test', ... })
    });
    expect(res.status).toBe(201);
  });
});
```

## Performance Tips

```typescript
// ✅ Add indexes
await prisma.$executeRawUnsafe(
  'CREATE INDEX "blog_title_idx" ON "blog" ("title")'
);

// ✅ Use LIMIT
await prisma.$queryRawUnsafe(
  'SELECT * FROM "blog" LIMIT $1',
  10
);

// ✅ Select specific columns
await prisma.$queryRawUnsafe(
  'SELECT id, title FROM "blog"'
);

// ❌ Avoid SELECT *
await prisma.$queryRawUnsafe(
  'SELECT * FROM "blog"'
);
```

## Useful Queries

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Get table size
SELECT pg_size_pretty(pg_total_relation_size('blog'));

-- Get column info
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog';

-- Get row count
SELECT COUNT(*) FROM "blog";

-- Get table indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'blog';
```

## Environment Setup

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Install dependencies
npm install

# Run migrations (core tables only)
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start server
npm run dev
```

## Documentation

- **ARCHITECTURE.md** - Full architecture explanation
- **MIGRATION_CLEANUP.md** - Migration guide
- **EXAMPLES.md** - Detailed examples
- **REFACTOR_SUMMARY.md** - What changed
- **QUICK_REFERENCE.md** - This file

## Key Takeaways

1. ✅ `schema.prisma` stays static
2. ✅ Dynamic tables created via raw SQL
3. ✅ No server restarts needed
4. ✅ No migration conflicts
5. ✅ Use parameterized queries
6. ✅ Validate all identifiers
7. ✅ Test in development first
