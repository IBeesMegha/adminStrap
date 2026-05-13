# Edit Schema Guide - How It Should Work

## Current Setup

When you click the **gear icon (⚙️)** on a single type, it should:

1. **Navigate to:** `/admin/content-type-builder?type=single&edit=home`
2. **Load the schema editor** with all the fields
3. **Allow you to:**
   - Add new fields
   - Remove existing fields
   - Edit field properties
   - Save changes

## Expected Behavior

### Step 1: Click Gear Icon
- Location: `/admin/content-type-builder/single-types`
- Action: Click the gear icon (⚙️) next to "home"
- Expected URL: `/admin/content-type-builder?type=single&edit=home`

### Step 2: Schema Editor Loads
You should see:
- **Page Title:** "home" (the single type name)
- **"Add new field" button** at the top right
- **List of existing fields:**
  - sections (Dynamic Zone)
  - heading (Text)
  - content (Text)
- **Save button** at the bottom

### Step 3: Edit Fields
- Click "Add new field" to add more fields
- Click trash icon to remove fields
- Click "Save" to update the schema

## Troubleshooting

### Issue: Page doesn't load or shows error

**Check the browser console (F12):**
Look for logs like:
```
[ContentTypeBuilder] Loading: { itemName: 'home', itemType: 'single' }
[ContentTypeBuilder] Fetching from: /api/single-types/home
[ContentTypeBuilder] Response: { data: {...} }
```

### Issue: Wrong URL

**Expected URL:**
```
http://localhost:3000/admin/content-type-builder?type=single&edit=home
```

**If you see a different URL, please let me know what it is!**

### Issue: Page is blank

This could mean:
1. The API is not returning data
2. The page is not handling the `edit` parameter
3. There's a JavaScript error

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check the Network tab for the API call to `/api/single-types/home`

## Manual Test

You can manually test by visiting this URL directly:
```
http://localhost:3000/admin/content-type-builder?type=single&edit=home
```

You should see the schema editor with your fields.

## What the Gear Icon Does

The gear icon link is:
```tsx
<Link href={`/admin/content-type-builder?type=single&edit=${st.name}`}>
```

For "home", this becomes:
```
/admin/content-type-builder?type=single&edit=home
```

## Comparison with Collection Types

**Collection Types:**
- Button text: "Edit Schema"
- URL: `/admin/content-type-builder/edit/[name]`
- Example: `/admin/content-type-builder/edit/products`

**Single Types:**
- Button: Gear icon (⚙️)
- URL: `/admin/content-type-builder?type=single&edit=[name]`
- Example: `/admin/content-type-builder?type=single&edit=home`

Both should open the schema editor!

## Debug Steps

1. **Click the gear icon on "home"**
2. **Note the URL in the address bar**
3. **Open browser console (F12)**
4. **Look for any errors or logs**
5. **Check the Network tab** for API calls

Please share:
- The URL you see
- Any console errors
- What the page shows

This will help me identify the exact issue!
