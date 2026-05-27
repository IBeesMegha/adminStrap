# Changelog: Single Type Internationalization

## Summary

Added full internationalization (i18n) support to Single Types, allowing you to create and manage multiple language versions of pages like Home, About, Contact, etc. This brings Single Types to feature parity with Collections in terms of i18n capabilities.

## Changes Made

### 1. Database Schema Updates

**File**: `prisma/schema.prisma`

- Updated `SingleType` model to include i18n fields:
  - `translationGroupId`: Groups translations of the same page
  - `lang`: Language code (e.g., "en", "fr", "es")
  - `localeStatus`: Publication status ("published" or "draft")
- Changed unique constraint from `name` to `@@unique([name, lang])`
- Added indexes on `translationGroupId` and `lang` for performance

**Migration**: `20260527125209_add_i18n_to_single_types`

### 2. API Updates

#### `pages/api/single-types/index.ts`
- Added language filtering to GET endpoint
- Added `translationGroupId` and `lang` to POST endpoint
- Imports i18n helper functions

#### `pages/api/single-types/[name].ts`
- Updated GET to use `name_lang` composite unique key
- Updated PUT to use `name_lang` composite unique key
- Updated DELETE to use `name_lang` composite unique key
- Added POST method for creating translations
- Added language parameter support
- Added translation validation

#### `pages/api/single-types/[name]/translations/[translationGroupId].ts` (NEW)
- New endpoint to fetch all translations for a single type
- Returns list of translations and available languages
- Protected with auth middleware

### 3. UI Updates

#### `pages/admin/singles/[name].tsx`
- Added language selector dropdown (similar to collections)
- Added language state management
- Added translation fetching logic
- Added "Create Translation" functionality
- Added language info banner
- Added translation status indicators (✓, Missing, Default)
- Updated error handling for missing translations
- Added language-aware data fetching and saving

### 4. Helper Functions

#### `lib/i18n-helpers.ts`
- Added `getSingleTypeTranslations()`: Get all translations for a single type
- Added `singleTypeTranslationExists()`: Check if translation exists
- Added `getSingleTypeAvailableTranslations()`: Get list of available language codes

### 5. Migration Script

#### `scripts/migrate-single-types-i18n.ts` (NEW)
- Migrates existing single types to new i18n structure
- Assigns `translationGroupId` to existing entries
- Sets `lang` to default language
- Sets `localeStatus` to "published"
- Provides detailed migration summary

### 6. Documentation

#### `docs/SINGLE-TYPE-I18N.md` (NEW)
- Comprehensive guide to Single Type i18n
- Explains key concepts (translation groups, language codes, locale status)
- Documents database schema
- Provides API endpoint documentation
- Includes example flows and best practices
- Troubleshooting guide

#### `docs/CHANGELOG-SINGLE-TYPE-I18N.md` (NEW)
- This file - documents all changes made

## How It Works

### For Users

1. **Create a Single Type**: Automatically created in default language
2. **View Single Type**: Select language from dropdown
3. **Create Translation**: Click "+" next to missing language
4. **Edit Translation**: Select language and edit content
5. **Switch Languages**: Use dropdown to switch between translations

### For Developers

1. **Fetch Single Type**: Include `?lang=en` parameter
2. **Create Translation**: POST to `/api/single-types/{name}` with `lang` and `translationGroupId`
3. **Update Translation**: PUT to `/api/single-types/{name}?lang=en`
4. **List Translations**: GET `/api/single-types/{name}/translations/{groupId}`

## Breaking Changes

⚠️ **Important**: This is a breaking change for existing single types.

### Before Migration
```typescript
// Old schema
model SingleType {
  name String @unique  // Single unique constraint
  // ... other fields
}

// Old API
GET /api/single-types/home  // Returns single entry
```

### After Migration
```typescript
// New schema
model SingleType {
  name String
  lang String
  translationGroupId String
  @@unique([name, lang])  // Composite unique constraint
}

// New API
GET /api/single-types/home?lang=en  // Returns language-specific entry
```

### Migration Path

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev
   ```

2. **Run Data Migration** (if you have existing single types):
   ```bash
   npx ts-node scripts/migrate-single-types-i18n.ts
   ```

3. **Update API Calls** (if you have custom frontend):
   - Add `?lang={code}` to all single type GET requests
   - Add `lang` parameter to POST/PUT requests

## Testing Checklist

- [x] Create new single type (auto-assigns default language)
- [x] View single type in default language
- [x] Create translation for another language
- [x] Edit translation content
- [x] Switch between languages
- [x] Delete translation
- [x] Language dropdown shows correct status
- [x] Missing translations show "+" button
- [x] Existing translations show "✓"
- [x] Default language shows "Default" badge
- [x] Language info banner displays correctly
- [x] API returns correct data for each language
- [x] Migration script works for existing data

## Comparison: Collections vs Single Types

Both now have identical i18n capabilities:

| Feature | Collections | Single Types |
|---------|------------|--------------|
| Language selector | ✓ | ✓ |
| Translation groups | ✓ | ✓ |
| Create translation | ✓ | ✓ |
| Language filtering | ✓ | ✓ |
| Translation status | ✓ | ✓ |
| API language param | ✓ | ✓ |

**Key Difference**: Collections have multiple entries per language (e.g., many blog posts), while Single Types have one entry per language (e.g., one home page).

## Future Enhancements

Potential improvements:

1. **Draft/Published Workflow**: Use `localeStatus` field
2. **Translation Progress**: Show completion percentage
3. **Copy Translation**: Duplicate content between languages
4. **Bulk Operations**: Create all translations at once
5. **Language Fallback**: Auto-fallback to default language
6. **Translation Service Integration**: Auto-translate content

## Files Changed

### Modified
- `prisma/schema.prisma`
- `pages/api/single-types/index.ts`
- `pages/api/single-types/[name].ts`
- `pages/admin/singles/[name].tsx`
- `lib/i18n-helpers.ts`

### Created
- `pages/api/single-types/[name]/translations/[translationGroupId].ts`
- `scripts/migrate-single-types-i18n.ts`
- `docs/SINGLE-TYPE-I18N.md`
- `docs/CHANGELOG-SINGLE-TYPE-I18N.md`

### Database
- Migration: `20260527125209_add_i18n_to_single_types`

## Rollback Instructions

If you need to rollback:

1. **Revert Prisma Schema**:
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   ```

2. **Rollback Migration**:
   ```bash
   npx prisma migrate resolve --rolled-back 20260527125209_add_i18n_to_single_types
   ```

3. **Revert Code Changes**:
   ```bash
   git checkout HEAD~1 pages/api/single-types/
   git checkout HEAD~1 pages/admin/singles/
   git checkout HEAD~1 lib/i18n-helpers.ts
   ```

⚠️ **Warning**: Rolling back will lose all translation data!

## Support

For questions or issues:
1. Check `docs/SINGLE-TYPE-I18N.md` for detailed documentation
2. Review the migration script output for data migration issues
3. Check browser console for API errors
4. Verify language codes in `/api/languages`

## Credits

Implemented: May 27, 2026
Feature parity with Collections i18n system
