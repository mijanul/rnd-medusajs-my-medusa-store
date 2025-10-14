# Custom Pages System - Complete Guide

A full-featured content management system for simple pages (About Us, Contact, Privacy Policy, etc.) with both Admin UI and Storefront components.

## 🎉 What's Included

### Backend (✅ Complete)

- ✅ Custom database table (`page`)
- ✅ Public API endpoints (`GET /pages`, `GET /pages/:slug`)
- ✅ Admin API endpoints (full CRUD)
- ✅ Sample data (5 pages seeded)

### Admin UI (✅ Complete)

- ✅ Pages list view with search and filters
- ✅ Create new page form
- ✅ Edit page form
- ✅ Delete functionality
- ✅ Dashboard widget showing page statistics
- ✅ Publish/Draft toggle

### Storefront Components (✅ Complete)

- ✅ PageDisplay component (single page view)
- ✅ PagesList component (navigation/footer links)
- ✅ Footer example with integrated pages
- ✅ Full TypeScript support
- ✅ Loading states and error handling

---

## 📁 Project Structure

```
my-medusa-store/
├── src/
│   ├── modules/page/           # Backend module
│   │   ├── models/page.ts      # Database model
│   │   ├── service.ts          # Service layer
│   │   ├── index.ts            # Module registration
│   │   └── README.md           # Module documentation
│   │
│   ├── api/
│   │   ├── pages/              # Public API (GET /pages)
│   │   │   ├── route.ts        # List all pages
│   │   │   └── [slug]/route.ts # Get page by slug
│   │   │
│   │   └── admin/pages/        # Admin API
│   │       ├── route.ts        # List & Create
│   │       └── [id]/route.ts   # Get, Update, Delete
│   │
│   ├── admin/                  # Admin UI
│   │   ├── routes/pages/       # Admin pages
│   │   │   ├── page.tsx        # List view
│   │   │   ├── create/page.tsx # Create form
│   │   │   └── [id]/page.tsx   # Edit form
│   │   │
│   │   └── widgets/
│   │       └── pages-widget.tsx # Dashboard widget
│   │
│   ├── storefront-components/  # Frontend components
│   │   ├── PageDisplay.tsx     # Single page view
│   │   ├── PagesList.tsx       # Pages list
│   │   ├── FooterExample.tsx   # Footer example
│   │   └── README.md           # Usage guide
│   │
│   └── scripts/
│       └── seed-pages.ts       # Seed sample data
```

---

## 🚀 Quick Start

### 1. Server is Already Running

The development server should be running at `http://localhost:9000`

### 2. Access Admin Panel

1. Open: `http://localhost:9000/app`
2. Log in with your admin credentials
3. Click on "Pages" in the sidebar

### 3. Test Public API

```bash
# Get all pages
curl http://localhost:9000/pages

# Get specific page
curl http://localhost:9000/pages/about-us
curl http://localhost:9000/pages/contact-us
```

---

## 📱 Admin UI Features

### Pages List (`/app/pages`)

- View all pages (published and drafts)
- See status badges (Published/Draft)
- Quick edit and delete actions
- Create new page button

### Create Page (`/app/pages/create`)

- Title field (auto-generates slug)
- Slug field (URL-friendly identifier)
- Content field (supports HTML)
- Meta title & description (SEO)
- Publish toggle
- Form validation

### Edit Page (`/app/pages/:id`)

- Update all fields
- Toggle publish status
- Delete page
- Save changes

### Dashboard Widget

- Shows total pages count
- Published vs Draft statistics
- Quick link to pages list

---

## 🎨 Storefront Integration

### Option 1: Next.js App Router

```tsx
// app/pages/[slug]/page.tsx
import { PageDisplay } from "@/components/pages/PageDisplay";

export default async function Page({ params }: { params: { slug: string } }) {
  return <PageDisplay slug={params.slug} apiUrl="http://localhost:9000" />;
}

// Generate static params for all pages
export async function generateStaticParams() {
  const res = await fetch("http://localhost:9000/pages");
  const data = await res.json();

  return data.pages.map((page: any) => ({
    slug: page.slug,
  }));
}
```

### Option 2: Next.js Pages Router

```tsx
// pages/[slug].tsx
import { PageDisplay } from "@/components/pages/PageDisplay";
import { GetServerSideProps } from "next";

export default function Page({ slug }: { slug: string }) {
  return <PageDisplay slug={slug} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      slug: context.params?.slug as string,
    },
  };
};
```

### Option 3: React SPA (React Router)

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageDisplay } from "./components/pages/PageDisplay";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pages/:slug" element={<PageRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

function PageRoute() {
  const { slug } = useParams();
  return <PageDisplay slug={slug} />;
}
```

### Footer Links

```tsx
import { PagesList } from "@/components/pages/PagesList";

export function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="container mx-auto">
        <h3 className="text-white font-bold mb-4">Quick Links</h3>
        <PagesList
          linkClassName="text-gray-300 hover:text-white"
          apiUrl="http://localhost:9000"
        />
      </div>
    </footer>
  );
}
```

---

## 🔌 API Reference

### Public Endpoints

#### `GET /pages`

Fetch all published pages

**Response:**

```json
{
  "pages": [
    {
      "id": "page_01HXXX",
      "title": "About Us",
      "slug": "about-us",
      "meta_title": "About Us - Learn More",
      "meta_description": "...",
      "published_at": "2025-10-13T..."
    }
  ]
}
```

#### `GET /pages/:slug`

Fetch a single page by slug

**Response:**

```json
{
  "page": {
    "id": "page_01HXXX",
    "title": "About Us",
    "slug": "about-us",
    "content": "<h1>About Us</h1><p>...</p>",
    "meta_title": "About Us - Learn More",
    "meta_description": "...",
    "published_at": "2025-10-13T..."
  }
}
```

### Admin Endpoints (Require Authentication)

#### `GET /admin/pages`

List all pages (including unpublished)

#### `POST /admin/pages`

Create a new page

**Body:**

```json
{
  "title": "New Page",
  "slug": "new-page",
  "content": "<p>Content here</p>",
  "meta_title": "Optional meta title",
  "meta_description": "Optional meta description",
  "is_published": true
}
```

#### `GET /admin/pages/:id`

Get single page by ID

#### `POST /admin/pages/:id`

Update a page

#### `DELETE /admin/pages/:id`

Delete a page

---

## 🎯 Sample Pages

5 pages are already seeded:

1. **About Us** (`/pages/about-us`)
2. **Contact Us** (`/pages/contact-us`)
3. **Privacy Policy** (`/pages/privacy-policy`)
4. **Terms of Service** (`/pages/terms-of-service`)
5. **Shipping Policy** (`/pages/shipping-policy`)

---

## 🛠️ Customization

### Adding More Fields

Edit `src/modules/page/models/page.ts`:

```typescript
const Page = model.define("page", {
  // ... existing fields
  author: model.text().nullable(),
  featured_image: model.text().nullable(),
  category: model.text().nullable(),
});
```

Then run:

```bash
npx medusa db:generate page
npx medusa db:migrate
yarn build
```

### Styling the Storefront Components

The components use Tailwind CSS classes. Customize by:

1. Modifying the className props
2. Creating your own wrapper components
3. Using CSS modules or styled-components

---

## 📝 Usage Tips

### SEO Best Practices

- Always fill in `meta_title` and `meta_description`
- Use descriptive, keyword-rich content
- Keep meta descriptions under 160 characters

### Content Guidelines

- Use HTML for rich formatting
- Keep slugs short and descriptive
- Use lowercase and hyphens in slugs
- Test on mobile devices

### Admin Workflow

1. Create page as draft
2. Review content
3. Add meta information
4. Publish when ready
5. Update as needed

---

## 🐛 Troubleshooting

### Pages not showing in admin?

```bash
# Rebuild and restart
yarn build
yarn dev
```

### Database table missing?

```bash
npx medusa db:generate page
npx medusa db:migrate
```

### Storefront component errors?

- Check API URL is correct
- Ensure CORS is configured
- Verify the page slug exists

---

## 📚 Next Steps

### Recommended Enhancements

1. **Rich Text Editor**: Integrate TinyMCE or Draft.js
2. **Image Uploads**: Add featured images
3. **Categories**: Organize pages by category
4. **Search**: Add search functionality
5. **Versioning**: Track content changes
6. **Preview**: Preview unpublished changes

### Production Checklist

- [ ] Update API URLs in storefront components
- [ ] Configure CORS for your domain
- [ ] Set up proper authentication
- [ ] Add rate limiting
- [ ] Enable caching
- [ ] Set up monitoring

---

## 🎓 Learn More

- [Medusa Documentation](https://docs.medusajs.com)
- [Admin SDK Guide](https://docs.medusajs.com/learn/fundamentals/admin)
- [Module Development](https://docs.medusajs.com/learn/fundamentals/modules)

---

## 🤝 Support

Need help? Check the documentation in:

- `src/modules/page/README.md` - Backend module docs
- `src/storefront-components/README.md` - Frontend integration guide

---

**Built with ❤️ using Medusa v2**
