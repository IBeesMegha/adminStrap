# Next.js CMS - Strapi-like Content Management System

A full-stack, Strapi-like CMS built with Next.js, PostgreSQL, Prisma, and TypeScript. Features a dynamic Content-Type Builder, Collection Types, Single Types, and reusable Components.

## 🚀 Features

### Content Types
- **Collection Types**: Multiple entries with full CRUD operations and listing
- **Single Types**: Single record per type (e.g., Homepage, Settings)
- **Components**: Reusable content blocks (SEO, Hero, Image blocks)

### Dynamic Content-Type Builder
- Create content types dynamically through the UI
- Define custom fields with validation
- Support for multiple field types:
  - String, Text, Rich Text
  - Number, Boolean, Date
  - Email, JSON
  - Component references

### Admin Panel
- Modern, responsive UI built with Tailwind CSS
- Sidebar navigation with all content types
- Dynamic form generation based on field definitions
- Publish/Draft status for collection entries
- Full CRUD operations

### Technical Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Rich Text**: React Quill

## 📁 Project Structure

```
nextjs-cms/
├── components/
│   └── admin/
│       ├── DynamicForm.tsx       # Dynamic form generator
│       ├── FormField.tsx         # Individual field components
│       ├── Layout.tsx            # Admin layout wrapper
│       └── Sidebar.tsx           # Navigation sidebar
├── lib/
│   ├── prisma.ts                 # Prisma client instance
│   └── types.ts                  # TypeScript types & validation
├── pages/
│   ├── admin/
│   │   ├── index.tsx             # Dashboard
│   │   ├── content-type-builder.tsx  # Content-Type Builder UI
│   │   ├── collections/
│   │   │   └── [name]/
│   │   │       ├── index.tsx     # Collection listing
│   │   │       ├── new.tsx       # Create entry
│   │   │       └── [id].tsx      # Edit entry
│   │   ├── singles/
│   │   │   └── [name].tsx        # Edit single type
│   │   └── components/
│   │       └── index.tsx         # Components list
│   ├── api/
│   │   ├── collection-types/
│   │   │   ├── index.ts          # List/Create collection types
│   │   │   └── [name].ts         # Get/Update/Delete collection type
│   │   ├── single-types/
│   │   │   ├── index.ts          # List/Create single types
│   │   │   └── [name].ts         # Get/Update/Delete single type
│   │   ├── components/
│   │   │   ├── index.ts          # List/Create components
│   │   │   └── [name].ts         # Get/Update/Delete component
│   │   └── collections/
│   │       └── [name]/
│   │           ├── index.ts      # List/Create entries
│   │           └── [id].ts       # Get/Update/Delete entry
│   └── _app.tsx
├── prisma/
│   └── schema.prisma             # Database schema
├── styles/
│   └── globals.css               # Global styles
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── postcss.config.js
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup Steps

1. **Clone and install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_cms?schema=public"
```

3. **Initialize database**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Run development server**
```bash
npm run dev
```

5. **Access the admin panel**
Open [http://localhost:3000/admin](http://localhost:3000/admin)

## 📖 Usage Guide

### Creating a Collection Type

1. Navigate to **Content-Type Builder** in the sidebar
2. Click **Create Collection Type**
3. Fill in:
   - **Name**: API identifier (e.g., `blog-post`)
   - **Display Name**: Human-readable name (e.g., `Blog Post`)
   - **Description**: Optional description
4. Add fields:
   - Field Name: `title`
   - Display Name: `Title`
   - Type: `string`
   - Required: ✓
5. Click **Add Field** and repeat for other fields
6. Click **Create Content Type**

### Creating Entries

1. Click on your collection type in the sidebar
2. Click **Create New Entry**
3. Fill in the dynamic form
4. Click **Create Entry**
5. Use **Publish** button to make it live

### Creating a Single Type

1. Go to **Content-Type Builder**
2. Add `?type=single` to URL or select Single Type
3. Define fields (same as collection)
4. Edit directly from sidebar (no listing page)

### Creating Components

1. Go to **Content-Type Builder**
2. Add `?type=component` to URL
3. Define reusable fields (e.g., SEO component with title, description, keywords)
4. Use components in Collection/Single types by adding a `component` field type

## 🗄️ Database Schema

### Dynamic Schema Architecture

This CMS uses a **metadata-driven dynamic schema** approach:

- **Core tables** (CollectionType, SingleType, Component, Media) are always present
- **Dynamic tables** (e.g., Blogs, Products) are generated automatically when you create collection types
- Tables are **NOT hardcoded** in the schema - they're created from metadata stored in the `CollectionType` table

#### Fresh Clone Behavior
When you clone this project with a fresh database:
- ✅ Core metadata tables are created
- ✅ `CollectionType` table is empty
- ✅ **No dynamic tables exist yet** (Blogs, News, etc.)
- ✅ Clean starting point with no orphaned tables

Dynamic tables are created **only when** you define collection types through the admin UI or API.

📖 **For detailed information**, see [DYNAMIC_SCHEMA_GUIDE.md](./DYNAMIC_SCHEMA_GUIDE.md)

### Core Prisma Models

**CollectionType**: Stores collection type definitions
- `id`, `name`, `displayName`, `description`
- `fields`: JSON schema for fields
- Drives dynamic table generation

**SingleType**: Stores single type definitions
- `id`, `name`, `displayName`, `description`
- `fields`: JSON schema for fields
- `data`: The actual single entry data (JSON)

**Component**: Stores reusable component definitions
- `id`, `name`, `displayName`, `category`
- `fields`: JSON schema for fields

**Media**: Media library files
- `id`, `name`, `url`, `mime`, `size`
- `alternativeText`, `caption`
- `width`, `height`, `ext`

### Dynamic Models (Generated)

Dynamic models are created automatically when you define collection types. For example, creating a "Blog" collection type generates:

```prisma
model Blogs {
  id        String   @id @default(cuid())
  title     String
  content   String?
  // ... your custom fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("blogs")
}
```

## 🔌 API Routes

### Collection Types
- `GET /api/collection-types` - List all collection types
- `POST /api/collection-types` - Create collection type
- `GET /api/collection-types/[name]` - Get specific collection type
- `PUT /api/collection-types/[name]` - Update collection type
- `DELETE /api/collection-types/[name]` - Delete collection type

### Collection Entries
- `GET /api/collections/[name]` - List entries
- `POST /api/collections/[name]` - Create entry
- `GET /api/collections/[name]/[id]` - Get entry
- `PUT /api/collections/[name]/[id]` - Update entry
- `DELETE /api/collections/[name]/[id]` - Delete entry

### Single Types
- `GET /api/single-types` - List all single types
- `POST /api/single-types` - Create single type
- `GET /api/single-types/[name]` - Get single type
- `PUT /api/single-types/[name]` - Update single type (structure or data)
- `DELETE /api/single-types/[name]` - Delete single type

### Components
- `GET /api/components` - List all components
- `POST /api/components` - Create component
- `GET /api/components/[name]` - Get component
- `PUT /api/components/[name]` - Update component
- `DELETE /api/components/[name]` - Delete component

## 🎨 Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| `string` | Short text | Titles, names |
| `text` | Long text | Descriptions, paragraphs |
| `richtext` | WYSIWYG editor | Blog content, articles |
| `number` | Numeric values | Prices, quantities |
| `boolean` | True/false | Featured, published flags |
| `date` | Date picker | Publication dates |
| `email` | Email validation | Contact emails |
| `json` | Raw JSON | Custom data structures |
| `component` | Component reference | Reusable blocks |

## 🔐 Validation

Forms are validated using Zod schemas generated from field definitions:
- Required fields
- Min/max length for strings
- Min/max values for numbers
- Email format validation
- Custom validation rules

## 🚧 Future Enhancements

- [ ] Media library for image/file uploads
- [ ] User authentication and roles
- [ ] API token generation for frontend consumption
- [ ] Drag-and-drop field ordering
- [ ] Relation fields between content types
- [ ] Internationalization (i18n)
- [ ] Content versioning
- [ ] Webhooks
- [ ] GraphQL API
- [ ] Search and filtering

## 📝 Example: Creating a Blog

1. **Create Collection Type "Blog Post"**
   - Fields: title (string), slug (string), content (richtext), published_date (date), featured (boolean)

2. **Create Component "SEO"**
   - Fields: meta_title (string), meta_description (text), keywords (text)

3. **Create Single Type "Blog Settings"**
   - Fields: posts_per_page (number), enable_comments (boolean)

4. **Create Entries**
   - Add blog posts through the admin panel
   - Edit blog settings
   - Publish/unpublish posts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

Inspired by [Strapi](https://strapi.io/) - the leading open-source headless CMS.
