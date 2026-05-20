# Relation Pre-selection Fix

## Problem
When editing a blog entry that has a category selected, the category dropdown was not pre-selecting the saved category. The category ID was correctly saved in the database (`cateId` column), but when reopening the blog for editing, the dropdown showed "Select cate" instead of the selected category.

## Root Cause

### Data Flow Issue

1. **When saving a blog:**
   - Form sends: `{ cateId: "category-id-123" }`
   - Database stores: `cateId = "category-id-123"` ✓

2. **When fetching the blog for editing:**
   - API returns populated relation: `{ cate: { id: "category-id-123", name: "Technology" } }`
   - Form expects: `{ cateId: "category-id-123" }`
   - **Mismatch!** The form field is registered as `cateId` but the data has `cate` (populated object)

### Why This Happened

The API automatically populates relations (converts IDs to full objects), which is great for display but causes issues for form initialization:

```typescript
// What the API returns (populated):
{
  id: "blog-123",
  heading: "My Blog",
  cate: {                    // ← Populated relation object
    id: "cat-456",
    name: "Technology"
  }
}

// What the form needs:
{
  id: "blog-123",
  heading: "My Blog",
  cateId: "cat-456"          // ← FK field for dropdown
}
```

## Solution

Modified the edit page (`pages/admin/collections/[name]/[id].tsx`) to extract IDs from populated relation objects and set them to the correct FK field names that the form expects.

### Code Changes

```typescript
// In fetchData function, added relation field processing:

if (field && field.type === 'relation' && field.relation) {
  if (field.relation.type === 'manyToOne' || field.relation.type === 'oneToOne') {
    // Extract ID from populated object
    if (typeof value === 'object' && value !== null && value.id) {
      // Calculate FK field name (e.g., "cate" → "cateId")
      const sanitizedFieldName = sanitizeFieldName(key);
      const fkFieldName = `${sanitizedFieldName}Id`;
      
      // Set the FK field with the ID
      formattedEntry[fkFieldName] = value.id;
      
      // Keep the populated object for display (oneToMany fields)
      formattedEntry[key] = value;
    }
  }
}
```

### Field Name Sanitization

The code properly handles field name conversion to match the database column format:

```typescript
const sanitizeFieldName = (name: string): string => {
  return name
    .replace(/[\s-]+/g, '_')           // Replace spaces/hyphens with underscore
    .replace(/[^a-zA-Z0-9_]/g, '')     // Remove special characters
    .split('_')
    .filter(part => part.length > 0)
    .map((part, index) => 
      index === 0 
        ? part.toLowerCase()                                    // First part lowercase
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()  // Rest PascalCase
    )
    .join('');
};

// Examples:
// "cate" → "cate" → "cateId"
// "blog-category" → "blogCategory" → "blogCategoryId"
// "prod_category" → "prodCategory" → "prodCategoryId"
```

## How It Works Now

### 1. Fetching Blog for Edit

```typescript
// API returns:
{
  id: "blog-123",
  heading: "My Blog Post",
  cate: {
    id: "cat-456",
    name: "Technology",
    slug: "technology"
  }
}

// Edit page processes it to:
{
  id: "blog-123",
  heading: "My Blog Post",
  cate: {                    // Kept for oneToMany display
    id: "cat-456",
    name: "Technology",
    slug: "technology"
  },
  cateId: "cat-456"          // ← Added for form dropdown
}
```

### 2. Form Initialization

```typescript
// DynamicForm receives defaultValues:
{
  cateId: "cat-456"  // ← Dropdown pre-selects this value
}

// FormField renders:
<select name="cateId" value="cat-456">
  <option value="">Select cate</option>
  <option value="cat-456" selected>Technology</option>  ← Pre-selected!
  <option value="cat-789">Science</option>
</select>
```

### 3. Saving Changes

```typescript
// Form submits:
{
  heading: "My Blog Post",
  cateId: "cat-456"  // ← FK field
}

// API saves to database:
UPDATE blogs SET cateId = 'cat-456' WHERE id = 'blog-123'
```

## Relation Types Handled

| Relation Type | Form Field | Data Processing |
|--------------|------------|-----------------|
| `manyToOne` | `{fieldName}Id` (dropdown) | Extract ID from populated object |
| `oneToOne` | `{fieldName}Id` (dropdown) | Extract ID from populated object |
| `oneToMany` | `{fieldName}` (read-only list) | Keep populated array as-is |
| `manyToMany` | `{fieldName}` (multi-select) | Keep populated array as-is |

## Testing

### Test Case 1: Edit Blog with Category
1. ✓ Create a blog and select a category
2. ✓ Save the blog
3. ✓ Reopen the blog for editing
4. ✓ Category dropdown should show the selected category
5. ✓ Change category and save
6. ✓ Reopen - new category should be pre-selected

### Test Case 2: Edit Blog without Category
1. ✓ Create a blog without selecting a category
2. ✓ Save the blog
3. ✓ Reopen the blog for editing
4. ✓ Category dropdown should show "Select cate"
5. ✓ Select a category and save
6. ✓ Reopen - category should be pre-selected

### Test Case 3: Edit Category (oneToMany)
1. ✓ Create a category
2. ✓ Create blogs linked to this category
3. ✓ Edit the category
4. ✓ Should see list of linked blogs (read-only)
5. ✓ Blogs list should show correct items

## Console Logs for Debugging

The fix includes detailed console logs to help debug any issues:

```typescript
console.log('[Edit Page] Raw entry data:', entryData.data);
console.log('[Edit Page] Fields:', fields);
console.log('[Edit Page] Processing relation field:', key, value);
console.log('[Edit Page] Set FK field', fkFieldName, '=', value.id);
console.log('[Edit Page] Formatted entry for form:', formattedEntry);
```

Check the browser console when editing an entry to see the data transformation.

## Benefits

1. **Correct Pre-selection**: Dropdowns now show the saved value
2. **Maintains Population**: oneToMany fields still show full related objects
3. **Consistent Behavior**: Works for all relation types
4. **Proper Field Naming**: Handles various field name formats
5. **Backward Compatible**: Doesn't break existing functionality

## Edge Cases Handled

1. **Already an ID (not populated)**: If the API returns just an ID string, it's handled correctly
2. **Null/undefined relations**: Empty relations don't cause errors
3. **Multiple relation fields**: Each field is processed independently
4. **Complex field names**: Sanitization handles spaces, hyphens, underscores
5. **oneToMany relations**: Kept as arrays for display, not converted to IDs

## Future Improvements

Potential enhancements:

1. **Selective Population**: Add a query parameter to control which relations to populate
2. **Caching**: Cache populated relation data to reduce API calls
3. **Optimistic Updates**: Update UI immediately before API response
4. **Validation**: Validate that selected relation IDs still exist
5. **Bulk Operations**: Handle multiple relation updates efficiently
