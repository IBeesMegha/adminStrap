# Single Type Internationalization (i18n)

This document explains how internationalization works for Single Types in the CMS.

## Overview

Single Types now support multiple languages, allowing you to create different versions of pages like "Home", "About", "Contact" etc. in different languages. Each language version is stored as a separate entry with the same `translationGroupId`.

## Key Concepts

### Translation Group ID
- A unique identifier that groups all translations of the same page together
- Example: Home page in English, French, and Spanish all share the same `translationGroupId`
- Automatically generated when creating a new single type

### Language Code
- Each single type entry has a `lang` field (e.g., "en", "fr", "es")
- Determines which language version is being displayed/edited
- Must match an active language in the system

### Locale Status
- Indicates the publication status of a translation
- Values: `"published"` or `"draft"`
- Currently defaults to `"published"`

## Database Schema

```prisma
model SingleType {
  id                 String   @id @default(cuid())
  name               String   // e.g., "home", "about"
  displayName        String
  description        String?
  fields             Json
  data               Json?
  translationGroupId String   // Groups translations together
  lang               String   // Language code
  localeStatus       String   @default("published")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@unique([name, lang]) // Each page can have one entry per language
  @@index([translationGroupId])
  @@index([lang])
}
```

## How It Works

### 1. Creating a Single Type

When you create a new single type (e.g., "Home"):
- A `translationGroupId` is automatically generated
- The entry is created in the default language (usually "en")
- The `localeStatus` is set to "published"

```typescript
// API: POST /api/single-types
{
  "name": "home",
  "displayName": "Home Page",
  "fields": { /* field definitions */ }
}
```

### 2. Viewing Single Types

When viewing a single type, you can:
- Select a language from the dropdown
- See which translations exist (marked with ✓)
- See which translations are missing (marked as "Missing")

```typescript
// API: GET /api/single-types/home?lang=en
```

### 3. Creating Translations

To create a translation for an existing single type:
1. Click the language dropdown
2. Click the "+" button next to a missing language
3. The system creates a new entry with:
   - Same `name` and `translationGroupId`
   - Different `lang` code
   - Empty `data` (ready for translation)

```typescript
// API: POST /api/single-types/home
{
  "displayName": "Home Page",
  "fields": { /* same field definitions */ },
  "data": {},
  "lang": "fr",
  "translationGroupId": "existing-group-id"
}
```

### 4. Editing Translations

- Each language version is edited independently
- Changes to one language don't affect others
- The language selector shows which version you're editing

```typescript
// API: PUT /api/single-types/home?lang=fr
{
  "data": { /* translated content */ }
}
```

## UI Features

### Language Selector
- Located in the top-right corner of the single type edit page
- Shows current language with flag emoji
- Dropdown lists all active languages
- Indicates which translations exist

### Translation Status Indicators
- **✓ (Checkmark)**: Translation exists for this language
- **"Missing" badge**: Translation doesn't exist yet
- **"Default" badge**: This is the default language
- **"+" button**: Create a new translation

### Language Info Banner
- Shows which language version you're currently editing
- Reminds you that changes only affect the current language

## API Endpoints

### Get Single Type (with language)
```
GET /api/single-types/{name}?lang={langCode}
```

### Create Single Type
```
POST /api/single-types
Body: { name, displayName, description, fields, lang? }
```

### Update Single Type
```
PUT /api/single-types/{name}?lang={langCode}
Body: { data, displayName?, description?, fields? }
```

### Create Translation
```
POST /api/single-types/{name}
Body: { displayName, fields, data, lang, translationGroupId }
```

### Get Translations
```
GET /api/single-types/{name}/translations/{translationGroupId}
```

### Delete Translation
```
DELETE /api/single-types/{name}?lang={langCode}
```

## Migration

If you have existing single types created before i18n support:

1. Run the migration script:
```bash
npx ts-node scripts/migrate-single-types-i18n.ts
```

2. The script will:
   - Assign a `translationGroupId` to each single type
   - Set `lang` to the default language
   - Set `localeStatus` to "published"

## Example Flow

### Creating a Multi-Language Home Page

1. **Create the home page** (automatically in default language):
   ```
   POST /api/single-types
   {
     "name": "home",
     "displayName": "Home Page",
     "fields": { /* fields */ }
   }
   ```

2. **Edit English content**:
   ```
   PUT /api/single-types/home?lang=en
   {
     "data": {
       "title": "Welcome",
       "description": "Welcome to our website"
     }
   }
   ```

3. **Create French translation**:
   ```
   POST /api/single-types/home
   {
     "lang": "fr",
     "translationGroupId": "clx...",
     "displayName": "Home Page",
     "fields": { /* same fields */ },
     "data": {}
   }
   ```

4. **Edit French content**:
   ```
   PUT /api/single-types/home?lang=fr
   {
     "data": {
       "title": "Bienvenue",
       "description": "Bienvenue sur notre site"
     }
   }
   ```

5. **Create Spanish translation**:
   ```
   POST /api/single-types/home
   {
     "lang": "es",
     "translationGroupId": "clx...",
     "displayName": "Home Page",
     "fields": { /* same fields */ },
     "data": {}
   }
   ```

6. **Edit Spanish content**:
   ```
   PUT /api/single-types/home?lang=es
   {
     "data": {
       "title": "Bienvenido",
       "description": "Bienvenido a nuestro sitio web"
     }
   }
   ```

## Best Practices

1. **Always create the default language first**
   - This ensures a fallback exists

2. **Keep field definitions consistent**
   - All translations should use the same field structure
   - Only the `data` content should differ

3. **Use meaningful translation group IDs**
   - Let the system generate them automatically
   - Don't modify them manually

4. **Handle missing translations gracefully**
   - Check if a translation exists before displaying
   - Fall back to default language if needed

5. **Validate language codes**
   - Ensure the language is active in the system
   - Use the `/api/languages` endpoint to get valid codes

## Comparison with Collections

| Feature | Collections | Single Types |
|---------|------------|--------------|
| Multiple entries | ✓ Yes | ✗ No (one per language) |
| Translation grouping | By `translationGroupId` | By `translationGroupId` |
| Language filtering | In list view | In edit view |
| Create translation | Via "Create New Entry" | Via "+" button in dropdown |
| Unique constraint | None | `@@unique([name, lang])` |

## Troubleshooting

### "Single type not found for this language"
- The translation doesn't exist yet
- Click "+" to create it, or switch to a language that exists

### "Translation already exists"
- You're trying to create a translation that already exists
- Switch to that language to edit it instead

### "Invalid or inactive language"
- The language code doesn't exist or is inactive
- Check `/api/languages` for valid codes

### Migration issues
- Ensure you've run the latest Prisma migration
- Check that the `translationGroupId`, `lang`, and `localeStatus` columns exist
- Run the migration script if you have existing data

## Future Enhancements

Potential improvements for the future:

1. **Locale Status Management**
   - Draft/Published workflow per translation
   - Schedule publication dates

2. **Translation Progress**
   - Show completion percentage
   - Highlight untranslated fields

3. **Copy from Another Language**
   - Duplicate content from one language to another
   - Useful as a starting point for translation

4. **Bulk Translation**
   - Create all missing translations at once
   - Integrate with translation services

5. **Language Fallback Chain**
   - Define fallback languages (e.g., fr-CA → fr → en)
   - Automatically use fallback if translation missing
