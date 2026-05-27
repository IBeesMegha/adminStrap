# Single Type i18n - UI Guide

This guide shows you how to use the internationalization features in the Single Type editor.

## UI Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Home Page                                    🌐 🇺🇸 English ▼  │
│  Welcome to our website                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Editing English version                                     │
│  Changes will only affect the English content                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Title                                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Welcome                                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Description                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Welcome to our website                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                          [Save]                 │
└─────────────────────────────────────────────────────────────────┘
```

## Language Selector Dropdown

When you click the language selector (🌐 🇺🇸 English ▼), you see:

```
┌─────────────────────────────────────────────────────┐
│  SELECT LANGUAGE                                    │
├─────────────────────────────────────────────────────┤
│  🇺🇸 English (English)          Default ✓           │
│  🇫🇷 French (Français)                         [+]  │
│  🇩🇪 German (Deutsch)                          [+]  │
│  🇪🇸 Spanish (Español)          Missing        [+]  │
│  🇮🇹 Italian (Italiano)         Missing        [+]  │
│  🇵🇹 Portuguese (Português)     Missing        [+]  │
│  🇷🇺 Russian (Русский)          ✓                   │
│  🇯🇵 Japanese (日本語)          Missing        [+]  │
└─────────────────────────────────────────────────────┘
```

### Legend:
- **✓** = Translation exists (click to switch to it)
- **Missing** = Translation doesn't exist yet
- **[+]** = Click to create this translation
- **Default** = This is the default language
- **Blue highlight** = Currently selected language

## Step-by-Step: Creating a Translation

### Step 1: Open Single Type
Navigate to any single type (e.g., Home, About, Contact)

### Step 2: Click Language Selector
Click the language dropdown in the top-right corner

```
┌──────────────────────┐
│ 🌐 🇺🇸 English ▼    │  ← Click here
└──────────────────────┘
```

### Step 3: Create Translation
Click the **[+]** button next to the language you want to create

```
🇫🇷 French (Français)    Missing    [+]  ← Click the + button
```

### Step 4: Translation Created
The system creates a new entry with:
- Same page name (e.g., "home")
- Same field structure
- Empty content (ready for translation)
- Selected language code

You'll see a success message:
```
✅ FR translation created!
```

### Step 5: Edit Translation
The page automatically switches to the new language. You can now:
- Fill in the translated content
- Save your changes
- Switch to other languages anytime

## Language Info Banner

When editing a translation, you'll see a blue banner:

```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Editing French version                                   │
│    Changes will only affect the French content              │
└─────────────────────────────────────────────────────────────┘
```

This reminds you which language you're editing.

## Switching Between Languages

### To Switch to an Existing Translation:
1. Click the language dropdown
2. Click on a language with a ✓ checkmark
3. The page reloads with that language's content

### To Switch to a Missing Translation:
1. Click the language dropdown
2. Click the **[+]** button next to the missing language
3. The translation is created and you're switched to it

## Example: Creating a Multi-Language Home Page

### 1. Start with English (Default)
```
┌─────────────────────────────────────────────────────────────┐
│  Home Page                              🌐 🇺🇸 English ▼    │
├─────────────────────────────────────────────────────────────┤
│  🌐 Editing English version                                 │
├─────────────────────────────────────────────────────────────┤
│  Title: Welcome                                             │
│  Description: Welcome to our website                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Create French Translation
Click dropdown → Click [+] next to French

```
┌─────────────────────────────────────────────────────────────┐
│  Home Page                              🌐 🇫🇷 French ▼     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Editing French version                                  │
├─────────────────────────────────────────────────────────────┤
│  Title: [Empty - ready for translation]                    │
│  Description: [Empty - ready for translation]              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Fill in French Content
```
┌─────────────────────────────────────────────────────────────┐
│  Home Page                              🌐 🇫🇷 French ▼     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Editing French version                                  │
├─────────────────────────────────────────────────────────────┤
│  Title: Bienvenue                                           │
│  Description: Bienvenue sur notre site                      │
└─────────────────────────────────────────────────────────────┘
```

### 4. Create Spanish Translation
Click dropdown → Click [+] next to Spanish

```
┌─────────────────────────────────────────────────────────────┐
│  Home Page                              🌐 🇪🇸 Spanish ▼    │
├─────────────────────────────────────────────────────────────┤
│  🌐 Editing Spanish version                                 │
├─────────────────────────────────────────────────────────────┤
│  Title: Bienvenido                                          │
│  Description: Bienvenido a nuestro sitio web               │
└─────────────────────────────────────────────────────────────┘
```

### 5. View All Translations
Click dropdown to see all available translations:

```
┌─────────────────────────────────────────────────────────────┐
│  SELECT LANGUAGE                                            │
├─────────────────────────────────────────────────────────────┤
│  🇺🇸 English (English)          Default ✓                   │
│  🇫🇷 French (Français)          ✓                           │
│  🇪🇸 Spanish (Español)          ✓                           │
│  🇩🇪 German (Deutsch)           Missing        [+]          │
│  🇮🇹 Italian (Italiano)         Missing        [+]          │
└─────────────────────────────────────────────────────────────┘
```

## Error States

### Translation Not Found
If you try to access a language that doesn't exist:

```
┌─────────────────────────────────────────────────────────────┐
│  ❌ Single type not found                                   │
├─────────────────────────────────────────────────────────────┤
│  The single type "home" could not be found for language     │
│  "de". Please check:                                        │
│                                                             │
│  • The single type exists in the database                   │
│  • The name is spelled correctly                            │
│  • A translation exists for the selected language           │
│  • The API is running properly                              │
│                                                             │
│  [Back to Single Types]  [Try Default Language]            │
└─────────────────────────────────────────────────────────────┘
```

### Translation Already Exists
If you try to create a translation that already exists:

```
❌ Translation for fr already exists
```

## Tips & Best Practices

### ✅ DO:
- Create the default language first
- Keep field structures consistent across languages
- Use the language selector to switch between translations
- Save your work before switching languages

### ❌ DON'T:
- Don't modify field definitions in one language (affects all)
- Don't delete the default language translation
- Don't manually edit translationGroupId
- Don't create translations for inactive languages

## Keyboard Shortcuts

Currently, there are no keyboard shortcuts for language switching, but you can:
- Use Tab to navigate to the language dropdown
- Use Enter to open the dropdown
- Use Arrow keys to navigate languages
- Use Enter to select a language

## Mobile View

On mobile devices:
- Language selector is still in top-right
- Dropdown is touch-friendly
- All features work the same way
- Scrollable language list

## Comparison with Collections

| Feature | Collections | Single Types |
|---------|------------|--------------|
| Language selector location | Top-right | Top-right |
| Create translation | "Create New Entry" button | "+" in dropdown |
| Language filter | Filters list | Switches content |
| Multiple entries | Yes (many blogs) | No (one home page) |
| Translation indicator | Same UI | Same UI |

## Troubleshooting

### "Language dropdown is empty"
- Check that languages are seeded in the database
- Run: `npx prisma db seed`

### "Can't create translation"
- Ensure the language is active
- Check that translation doesn't already exist
- Verify you have permission to create content

### "Changes not saving"
- Check browser console for errors
- Verify API is running
- Ensure you clicked "Save" button

### "Wrong language showing"
- Check the language selector
- Verify the URL has correct `?lang=` parameter
- Try refreshing the page

## Future Enhancements

Planned improvements:
- 📊 Translation progress indicator
- 📋 Copy content from another language
- 🔄 Bulk create all translations
- 🌐 Language fallback chain
- 📝 Draft/Published per language
- 🔍 Search across all languages

## Need Help?

- 📖 Read the full guide: `docs/SINGLE-TYPE-I18N.md`
- 📝 Check the changelog: `docs/CHANGELOG-SINGLE-TYPE-I18N.md`
- 🐛 Report issues on GitHub
- 💬 Ask in community forums
