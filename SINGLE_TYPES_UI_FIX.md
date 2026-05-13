# Single Types UI Fix

## Issues Fixed

### 1. ✅ Edit Button Now Goes to Content-Type Builder
**Before:** Clicking edit took you to `/admin/singles/new-test-single` (wrong URL)
**After:** Now there are two separate buttons:
- **Edit Content** (blue) - Goes to `/admin/singles/[name]` to edit the actual content
- **Edit Schema** (gray, gear icon) - Goes to `/admin/content-type-builder?type=single&edit=[name]` to edit the structure

### 2. ✅ Removed "fields" Column
**Before:** Showed "2 fields" or "3 fields" 
**After:** Shows "Single Type" label instead

## Updated UI

### Single Types List Page

Each single type card now shows:

```
┌─────────────────────────────────────┐
│ 📄 new test single                  │
│    new-test-single                  │
│                                     │
│ Description (if any)                │
│                                     │
│ Single Type        5/12/2026       │
│                                     │
│ [Edit Content] [⚙️] [🗑️]           │
└─────────────────────────────────────┘
```

**Buttons:**
- **Edit Content** (Blue button) - Opens the content editor at `/admin/singles/[name]`
- **⚙️ Settings icon** (Gray button) - Opens the schema editor at `/admin/content-type-builder?type=single&edit=[name]`
- **🗑️ Trash icon** (Red button) - Deletes the single type

## How to Use

### To Edit Content (Add/Edit Data):
1. Go to `/admin/content-type-builder/single-types`
2. Find your single type (e.g., "home")
3. Click **"Edit Content"** (blue button)
4. You'll be taken to `/admin/singles/home`
5. Fill in the form fields and save

### To Edit Schema (Add/Remove Fields):
1. Go to `/admin/content-type-builder/single-types`
2. Find your single type (e.g., "home")
3. Click the **⚙️ gear icon** (gray button)
4. You'll be taken to the content-type builder
5. Add/remove/edit fields
6. Click "Save" to update the schema

## Consistency with Collection Types

The Single Types page now matches the Collection Types page:
- Collection Types: "Edit Schema" button
- Single Types: Gear icon (same functionality)

Both pages now have clear separation between:
- **Editing the structure** (schema/fields)
- **Editing the content** (data)

## Testing

1. **Test Edit Content:**
   - Go to `/admin/content-type-builder/single-types`
   - Click "Edit Content" on "home"
   - Should go to `/admin/singles/home`
   - Should see the form with fields

2. **Test Edit Schema:**
   - Go to `/admin/content-type-builder/single-types`
   - Click the gear icon on "home"
   - Should go to `/admin/content-type-builder?type=single&edit=home`
   - Should see the field builder

## Summary

✅ Edit Content button now correctly goes to content editor
✅ New gear icon button goes to schema editor  
✅ Removed confusing "fields" count
✅ Cleaner, more intuitive UI
✅ Consistent with Collection Types page
