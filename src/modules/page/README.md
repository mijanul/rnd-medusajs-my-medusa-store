# Pages Module

A custom module for managing simple content pages like "About Us", "Contact Us", "Privacy Policy", etc.

## Features

- ✅ Custom database table for pages
- ✅ Store API endpoints (public)
- ✅ Admin API endpoints (CRUD operations)
- ✅ SEO-friendly with meta tags
- ✅ Publish/unpublish functionality
- ✅ Unique slug validation

## Database Schema

The `page` table includes:

- `id` - Primary key
- `title` - Page title
- `slug` - Unique URL-friendly identifier
- `content` - HTML content
- `meta_title` - SEO meta title
- `meta_description` - SEO meta description
- `is_published` - Published status (boolean)
- `published_at` - Publication timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## API Endpoints

### Store Endpoints (Public)

#### Get All Published Pages

```http
GET /store/pages
```

**Response:**

```json
{
  "pages": [
    {
      "id": "page_123",
      "title": "About Us",
      "slug": "about-us",
      "meta_title": "About Us - Learn More",
      "meta_description": "Learn more about our company",
      "published_at": "2025-10-13T00:00:00.000Z"
    }
  ]
}
```

#### Get Single Page by Slug

```http
GET /store/pages/:slug
```

**Example:** `GET /store/pages/about-us`

**Response:**

```json
{
  "page": {
    "id": "page_123",
    "title": "About Us",
    "slug": "about-us",
    "content": "<h1>About Us</h1><p>...</p>",
    "meta_title": "About Us - Learn More",
    "meta_description": "Learn more about our company",
    "published_at": "2025-10-13T00:00:00.000Z"
  }
}
```

### Admin Endpoints (Protected)

#### Get All Pages

```http
GET /admin/pages
```

Returns all pages including unpublished ones.

#### Create New Page

```http
POST /admin/pages
```

**Request Body:**

```json
{
  "title": "About Us",
  "slug": "about-us",
  "content": "<h1>About Us</h1><p>Welcome to our store!</p>",
  "meta_title": "About Us - Learn More",
  "meta_description": "Learn more about our company",
  "is_published": true
}
```

**Required fields:** `title`, `slug`, `content`

#### Get Single Page

```http
GET /admin/pages/:id
```

#### Update Page

```http
POST /admin/pages/:id
```

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Title",
  "slug": "updated-slug",
  "content": "<h1>Updated Content</h1>",
  "meta_title": "Updated Meta Title",
  "meta_description": "Updated meta description",
  "is_published": false
}
```

#### Delete Page

```http
DELETE /admin/pages/:id
```

## Setup Instructions

### 1. Build and Run Migrations

After creating the module, build your project and run migrations:

```bash
# Build the project
yarn build

# Generate and run migrations
npx medusa db:migrate

# Or if using the Medusa CLI
medusa db:migrate
```

### 2. Seed Sample Pages

Run the seed script to create sample pages:

```bash
# Execute the seed script
npx medusa exec ./src/scripts/seed-pages.ts
```

This will create 5 sample pages:

- About Us
- Contact Us
- Privacy Policy
- Terms of Service
- Shipping Policy

### 3. Start Your Server

```bash
yarn dev
```

## Frontend Integration Examples

### React/Next.js Example

#### Fetch Single Page

```typescript
// app/pages/[slug]/page.tsx
async function getPage(slug: string) {
  const response = await fetch(`http://localhost:9000/store/pages/${slug}`);
  const data = await response.json();
  return data.page;
}

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);

  return (
    <div>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
```

#### Fetch All Pages

```typescript
async function getAllPages() {
  const response = await fetch("http://localhost:9000/store/pages");
  const data = await response.json();
  return data.pages;
}

export default async function PagesIndex() {
  const pages = await getAllPages();

  return (
    <ul>
      {pages.map((page) => (
        <li key={page.id}>
          <a href={`/pages/${page.slug}`}>{page.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### Using Medusa JS SDK

```typescript
import Medusa from "@medusajs/medusa-js";

const medusa = new Medusa({ baseUrl: "http://localhost:9000" });

// Get all pages
const pages = await medusa.client.request("GET", "/store/pages");

// Get single page
const page = await medusa.client.request("GET", "/store/pages/about-us");
```

## Admin Management

You can manage pages through the Admin API using tools like:

- Postman
- cURL
- Custom admin panel
- Medusa Admin (custom integration)

### cURL Examples

**Create a page:**

```bash
curl -X POST http://localhost:9000/admin/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "FAQ",
    "slug": "faq",
    "content": "<h1>Frequently Asked Questions</h1>",
    "is_published": true
  }'
```

**Update a page:**

```bash
curl -X POST http://localhost:9000/admin/pages/PAGE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Updated FAQ"
  }'
```

## Customization

### Adding More Fields

To add more fields to the page model, edit `src/modules/page/models/page.ts`:

```typescript
const Page = model.define("page", {
  // ... existing fields
  author: model.text().nullable(),
  featured_image: model.text().nullable(),
  // Add more fields as needed
});
```

Don't forget to rebuild and run migrations after changes!

### Content Formats

The `content` field stores HTML by default. You can:

- Store plain text
- Store Markdown (parse in frontend)
- Store JSON (structured content)

## Troubleshooting

**Issue: Module not found**

- Make sure you've added the module to `medusa-config.ts`
- Rebuild the project: `yarn build`

**Issue: Table doesn't exist**

- Run migrations: `npx medusa db:migrate`

**Issue: TypeScript errors**

- Rebuild: `yarn build`
- Check that all imports are correct

## Notes

- Pages are cached by Medusa's query layer for better performance
- Use `is_published` to control visibility on the storefront
- Slugs must be unique across all pages
- The `published_at` timestamp is automatically set when a page is published
