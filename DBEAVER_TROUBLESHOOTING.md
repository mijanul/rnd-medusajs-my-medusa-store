# 🔍 Why Can't I See Product Data in DBeaver?

## Quick Answer: The Data IS There!

Your database **DOES have data**:

```
prod_01K7E7DZHFRAEFAWABXARCGYSR | Medusa T-Shirt
prod_01K7E7DZHFW5JN7S5Q2VW04S2W | Medusa Sweatshirt
prod_01K7E7DZHF5NX3N0Z9PYGP05FW | Medusa Sweatpants
prod_01K7E7DZHFEDY8MWF2G8S65VEE | Medusa Shorts
```

## Common Reasons You Can't See Data in DBeaver

### 1. ❌ **Wrong Database/Schema Selected**

**Problem:** You might be looking at the wrong database or schema.

**Solution:**

- In DBeaver, make sure you're connected to: `medusa-my-medusa-store`
- Schema should be: `public`
- Full path: `medusa-my-medusa-store` → `Schemas` → `public` → `Tables` → `product`

---

### 2. ❌ **Table View Not Refreshed**

**Problem:** DBeaver caches table metadata.

**Solution:**

- Right-click on `product` table
- Select **"Refresh"** or press `F5`
- Or right-click on `Tables` and select **"Refresh"**

---

### 3. ❌ **Row Limit is Set Too Low**

**Problem:** DBeaver limits rows by default (often 200 rows).

**Solution:**

- Open table data view
- Check bottom of the window for "Limit: X rows"
- Increase the limit or remove it
- Click the refresh button

---

### 4. ❌ **Filters Applied**

**Problem:** You might have accidental filters applied.

**Solution:**

- Look for filter icon in DBeaver toolbar
- Click **"Clear Filters"** button
- Or check SQL in bottom panel for WHERE clauses

---

### 5. ❌ **Looking for Wrong Column Names**

**Problem:** Expecting different column names than what exists.

**Solution:** Here are the ACTUAL columns in the `product` table:

```sql
-- Core fields
id              -- Primary key (e.g., 'prod_01K7E7DZHFRAEFAWABXARCGYSR')
title           -- Product name
handle          -- URL slug
status          -- 'draft', 'proposed', 'published', 'rejected'

-- Descriptive fields
subtitle
description
thumbnail       -- Image URL

-- Properties
is_giftcard     -- boolean
discountable    -- boolean
weight
length
height
width
origin_country
hs_code
mid_code
material

-- Relations (foreign keys)
collection_id   -- Links to product_collection table
type_id         -- Links to product_type table

-- System fields
external_id
created_at
updated_at
deleted_at      -- Soft delete timestamp
metadata        -- JSONB field
```

---

### 6. ❌ **Expecting Joined Data in One Table**

**Problem:** Looking for variant/price data in the `product` table.

**The Truth:** Medusa v2 uses a **modular architecture**. Data is split across tables:

```
product                          ← Base product info
  ↓
product_variant                  ← Variant details (SKU, barcode, etc.)
  ↓
product_variant_price_set        ← Link table
  ↓
price_set                        ← Price set container
  ↓
price                            ← Actual prices (money_amount data)
```

**What You See in `product` table:**

- ✅ id, title, handle, status, thumbnail
- ✅ collection_id, type_id
- ❌ No variant data
- ❌ No price data
- ❌ No inventory data

---

## 📊 How to View Complete Product Data in DBeaver

### Method 1: Query with JOINs (Recommended)

```sql
-- Complete product view with all relations
SELECT
    p.id,
    p.title,
    p.handle,
    p.status,
    p.thumbnail,
    pc.title as collection_name,
    pt.value as product_type,
    COUNT(DISTINCT pv.id) as variant_count,
    COUNT(DISTINCT img.id) as image_count
FROM product p
LEFT JOIN product_collection pc ON p.collection_id = pc.id
LEFT JOIN product_type pt ON p.type_id = pt.id
LEFT JOIN product_variant pv ON pv.product_id = p.id
LEFT JOIN image img ON img.product_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.handle, p.status, p.thumbnail, pc.title, pt.value;
```

### Method 2: View Products with Variants

```sql
SELECT
    p.id as product_id,
    p.title as product_title,
    p.status,
    pv.id as variant_id,
    pv.title as variant_title,
    pv.sku,
    pv.barcode
FROM product p
LEFT JOIN product_variant pv ON p.id = pv.product_id
WHERE p.deleted_at IS NULL
ORDER BY p.title;
```

### Method 3: View Products with Prices

```sql
SELECT
    p.id as product_id,
    p.title,
    pv.id as variant_id,
    pv.sku,
    pr.amount,
    pr.currency_code
FROM product p
LEFT JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
LEFT JOIN price_set ps ON pvps.price_set_id = ps.id
LEFT JOIN price pr ON pr.price_set_id = ps.id
WHERE p.deleted_at IS NULL
ORDER BY p.title, pv.title, pr.currency_code;
```

### Method 4: View Products with Sales Channels

```sql
SELECT
    p.id,
    p.title,
    p.status,
    sc.name as sales_channel
FROM product p
LEFT JOIN product_sales_channel psc ON p.id = psc.product_id
LEFT JOIN sales_channel sc ON psc.sales_channel_id = sc.id
WHERE p.deleted_at IS NULL;
```

### Method 5: View Products with Images

```sql
SELECT
    p.id,
    p.title,
    p.thumbnail,
    img.url as image_url,
    img.rank as image_order
FROM product p
LEFT JOIN image img ON img.product_id = p.id
WHERE p.deleted_at IS NULL
ORDER BY p.title, img.rank;
```

---

## 🗄️ Complete Database Schema for Products

### Tables Involved (with relationships):

```
product (MAIN TABLE)
├── id (PK)
├── collection_id → product_collection.id
└── type_id → product_type.id

product_variant
├── id (PK)
├── product_id → product.id (FK)
└── Related to prices via variant_price_set

product_variant_price_set (LINK TABLE)
├── variant_id → product_variant.id
└── price_set_id → price_set.id

price_set
├── id (PK)
└── Container for prices

price (formerly money_amount)
├── id (PK)
├── price_set_id → price_set.id
├── amount (price value)
└── currency_code

image
├── id (PK)
├── product_id → product.id (FK)
└── url

product_sales_channel (LINK TABLE - many-to-many)
├── product_id → product.id
└── sales_channel_id → sales_channel.id

product_tags (LINK TABLE - many-to-many)
├── product_id → product.id
└── product_tag_id → product_tag.id

product_category_product (LINK TABLE - many-to-many)
├── product_id → product.id
└── product_category_id → product_category.id

product_option
├── id (PK)
├── product_id → product.id (FK)
└── title (e.g., "Size", "Color")

product_option_value
├── id (PK)
├── option_id → product_option.id
└── value (e.g., "Small", "Red")

product_variant_option (LINK TABLE)
├── variant_id → product_variant.id
└── option_value_id → product_option_value.id

inventory_item
├── id (PK)
└── sku

product_variant_inventory_item (LINK TABLE)
├── variant_id → product_variant.id
└── inventory_item_id → inventory_item.id

inventory_level
├── id (PK)
├── inventory_item_id → inventory_item.id
├── location_id → stock_location.id
└── stocked_quantity (actual inventory count)
```

---

## 🎯 DBeaver Setup Guide

### Step 1: Connect to Your Database

1. Open DBeaver
2. Click **"New Database Connection"** (or use existing)
3. Select **PostgreSQL**
4. Enter connection details:
   ```
   Host: localhost
   Port: 5432
   Database: medusa-my-medusa-store
   Username: mijanul
   Password: qa@123
   ```
5. Click **"Test Connection"**
6. Click **"Finish"**

### Step 2: Navigate to Product Table

```
Connections
└── medusa-my-medusa-store
    └── Databases
        └── medusa-my-medusa-store
            └── Schemas
                └── public
                    └── Tables
                        └── product  ← Double-click here
```

### Step 3: View Data

- **Method A:** Double-click on `product` table → Opens data view
- **Method B:** Right-click → "View Data" → Choose first/all rows
- **Method C:** Open SQL Editor (F4) and run queries

### Step 4: Run Custom Queries

1. Click **SQL Editor** button (or press `Ctrl+]` / `Cmd+]`)
2. Paste one of the queries from above
3. Press `Ctrl+Enter` / `Cmd+Enter` to execute
4. View results in bottom panel

---

## 🔍 Troubleshooting Checklist

### ✅ Verify Data Exists

Run this simple query:

```sql
SELECT COUNT(*) as total_products FROM product;
SELECT COUNT(*) as published FROM product WHERE status = 'published';
SELECT COUNT(*) as with_variants FROM product p
  INNER JOIN product_variant pv ON p.id = pv.product_id;
```

Expected results:

- `total_products`: 4 or more
- `published`: 4 (all seed products are published)
- `with_variants`: Should match or exceed total_products

### ✅ Check Soft Deletes

Products might be soft-deleted:

```sql
-- Show all products including deleted
SELECT id, title, status, deleted_at
FROM product;

-- Show only active (not deleted)
SELECT id, title, status
FROM product
WHERE deleted_at IS NULL;
```

### ✅ Check DBeaver Filters

1. Open product table data view
2. Look for filter icon in toolbar (funnel icon)
3. Check if any filters are applied
4. Click "Clear All Filters"

### ✅ Refresh DBeaver Cache

1. Right-click on database connection
2. Select **"Invalidate/Reconnect"**
3. Or restart DBeaver

---

## 💡 Pro Tips for DBeaver

### 1. **Create Custom Views**

Save your complex queries as views:

```sql
CREATE VIEW v_products_complete AS
SELECT
    p.id,
    p.title,
    p.handle,
    p.status,
    pc.title as collection,
    COUNT(DISTINCT pv.id) as variants,
    COUNT(DISTINCT img.id) as images
FROM product p
LEFT JOIN product_collection pc ON p.collection_id = pc.id
LEFT JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN image img ON img.product_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.handle, p.status, pc.title;
```

Then just: `SELECT * FROM v_products_complete;`

### 2. **Use ER Diagram**

1. Right-click on `public` schema
2. Select **"View Diagram"**
3. This shows all tables and their relationships visually

### 3. **Export Data**

1. Open table or query results
2. Right-click on results
3. Select **"Export Data"**
4. Choose format (CSV, JSON, SQL, etc.)

### 4. **Bookmark Queries**

1. Write your query in SQL Editor
2. Click **"Save Script"**
3. Access from **"SQL Scripts"** panel

---

## 📝 Quick Reference: Common Queries

### Get All Products (Simple)

```sql
SELECT * FROM product WHERE deleted_at IS NULL;
```

### Get Product Count by Status

```sql
SELECT status, COUNT(*) as count
FROM product
WHERE deleted_at IS NULL
GROUP BY status;
```

### Get Products with Low Inventory

```sql
SELECT
    p.title,
    pv.sku,
    il.stocked_quantity
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id
WHERE il.stocked_quantity < 10;
```

### Get Products Without Images

```sql
SELECT p.id, p.title
FROM product p
LEFT JOIN image img ON p.id = img.product_id
WHERE img.id IS NULL AND p.deleted_at IS NULL;
```

### Get Products by Collection

```sql
SELECT
    pc.title as collection,
    p.title as product
FROM product p
JOIN product_collection pc ON p.collection_id = pc.id
WHERE p.deleted_at IS NULL
ORDER BY pc.title, p.title;
```

---

## 🎯 Summary

**The data IS in your database!** If you can't see it in DBeaver:

1. ✅ **Check you're in the right database:** `medusa-my-medusa-store`
2. ✅ **Check you're in the right schema:** `public`
3. ✅ **Refresh the table view:** F5 or right-click → Refresh
4. ✅ **Clear any filters:** Click clear filters button
5. ✅ **Look at the right table:** `product` (not `products`)
6. ✅ **Use JOINs to see related data:** Variants, prices, images are in separate tables

**Remember:** Medusa v2 is **modular**. One product's complete data is spread across multiple tables. Use SQL JOINs to see everything together!

---

## 🆘 Still Can't See Data?

Run these diagnostic queries:

```sql
-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'product'
);

-- 2. Check row count
SELECT COUNT(*) FROM product;

-- 3. Show first 3 products
SELECT id, title, status FROM product LIMIT 3;

-- 4. Check your current database
SELECT current_database();
```

If all these work, your data is there! The issue is with DBeaver's display settings.
