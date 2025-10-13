# 📊 Medusa v2 Database Schema - Product Tables

## Complete Visual Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCT ECOSYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│       product (MAIN)         │
├──────────────────────────────┤
│ PK: id                       │
│     title                    │
│     handle                   │
│     status                   │
│     description              │
│     thumbnail                │
│     is_giftcard              │
│     discountable             │
│     weight, length, height   │
│ FK: collection_id ────────┐  │
│ FK: type_id ──────────┐   │  │
│     created_at        │   │  │
│     updated_at        │   │  │
│     deleted_at        │   │  │
│     metadata          │   │  │
└───────────┬───────────┘   │  │
            │               │  │
            │               │  │
            │          ┌────▼──▼───────────┐
            │          │ product_type      │
            │          ├───────────────────┤
            │          │ PK: id            │
            │          │     value         │
            │          │     metadata      │
            │          └───────────────────┘
            │
            │          ┌───────────────────────┐
            │          │ product_collection    │
            │          ├───────────────────────┤
            │          │ PK: id                │
            │          │     title             │
            │          │     handle            │
            │          │     metadata          │
            │          └───────────────────────┘
            │
            ├──────────┐
            │          │
            │          ▼
            │    ┌──────────────────────────┐
            │    │ product_variant          │
            │    ├──────────────────────────┤
            │    │ PK: id                   │
            │    │ FK: product_id           │
            │    │     title                │
            │    │     sku                  │
            │    │     barcode              │
            │    │     ean, upc             │
            │    │     allow_backorder      │
            │    │     manage_inventory     │
            │    │     weight, length, ...  │
            │    │     variant_rank         │
            │    │     created_at           │
            │    │     updated_at           │
            │    │     deleted_at           │
            │    │     metadata             │
            │    └────────┬─────────────────┘
            │             │
            │             ├──────────────────────────────────┐
            │             │                                  │
            │             ▼                                  │
            │    ┌────────────────────────────┐             │
            │    │product_variant_price_set   │             │
            │    │(LINK TABLE)                │             │
            │    ├────────────────────────────┤             │
            │    │ FK: variant_id             │             │
            │    │ FK: price_set_id ────────┐ │             │
            │    └──────────────────────────┘ │             │
            │                                 │             │
            │                            ┌────▼─────────┐   │
            │                            │  price_set   │   │
            │                            ├──────────────┤   │
            │                            │ PK: id       │   │
            │                            │  created_at  │   │
            │                            │  updated_at  │   │
            │                            │  deleted_at  │   │
            │                            └────┬─────────┘   │
            │                                 │             │
            │                            ┌────▼─────────────────┐
            │                            │    price             │
            │                            │ (money_amount data)  │
            │                            ├──────────────────────┤
            │                            │ PK: id               │
            │                            │ FK: price_set_id     │
            │                            │     amount           │
            │                            │     currency_code    │
            │                            │     min_quantity     │
            │                            │     max_quantity     │
            │                            │     created_at       │
            │                            │     updated_at       │
            │                            │     deleted_at       │
            │                            └──────────────────────┘
            │             │
            │             │
            │             ├──────────────────────────────────┐
            │             │                                  │
            │             ▼                                  │
            │    ┌─────────────────────────────┐            │
            │    │product_variant_inventory    │            │
            │    │_item (LINK TABLE)           │            │
            │    ├─────────────────────────────┤            │
            │    │ FK: variant_id              │            │
            │    │ FK: inventory_item_id ────┐ │            │
            │    └───────────────────────────┘ │            │
            │                                  │            │
            │                           ┌──────▼──────────┐ │
            │                           │ inventory_item  │ │
            │                           ├─────────────────┤ │
            │                           │ PK: id          │ │
            │                           │     sku         │ │
            │                           │     title       │ │
            │                           │     metadata    │ │
            │                           └────┬────────────┘ │
            │                                │              │
            │                           ┌────▼──────────────▼────┐
            │                           │ inventory_level        │
            │                           ├────────────────────────┤
            │                           │ PK: id                 │
            │                           │ FK: inventory_item_id  │
            │                           │ FK: location_id        │
            │                           │     stocked_quantity   │
            │                           │     incoming_quantity  │
            │                           │     metadata           │
            │                           └────────────────────────┘
            │             │
            │             │
            │             └────────────────────────────┐
            │                                          │
            │                                          ▼
            │                               ┌──────────────────────┐
            │                               │product_variant_option│
            │                               │(LINK TABLE)          │
            │                               ├──────────────────────┤
            │                               │ FK: variant_id       │
            │                               │ FK: option_value_id ─┐
            │                               └──────────────────────┘│
            │                                                       │
            ├────────────────────────────┐                         │
            │                            │                         │
            ▼                            ▼                         │
    ┌───────────────────┐      ┌──────────────────┐              │
    │  product_option   │      │ product_option_  │              │
    │                   │      │     value        │◄─────────────┘
    ├───────────────────┤      ├──────────────────┤
    │ PK: id            │      │ PK: id           │
    │ FK: product_id    │      │ FK: option_id    │
    │     title         │      │     value        │
    │     metadata      │      │     metadata     │
    └───────────────────┘      └──────────────────┘
            │
            │
            ├────────────────────────────┐
            │                            │
            ▼                            ▼
    ┌──────────────────┐      ┌─────────────────────┐
    │     image        │      │ product_sales_      │
    ├──────────────────┤      │    channel          │
    │ PK: id           │      │ (LINK TABLE)        │
    │ FK: product_id   │      ├─────────────────────┤
    │     url          │      │ FK: product_id      │
    │     rank         │      │ FK: sales_channel_id│
    │     metadata     │      └──────────┬──────────┘
    └──────────────────┘                 │
            │                            │
            │                            ▼
            │                   ┌─────────────────┐
            │                   │ sales_channel   │
            │                   ├─────────────────┤
            │                   │ PK: id          │
            │                   │     name        │
            │                   │     description │
            │                   │     is_disabled │
            │                   │     metadata    │
            │                   └─────────────────┘
            │
            ├────────────────────────────┐
            │                            │
            ▼                            ▼
    ┌──────────────────┐      ┌─────────────────────┐
    │  product_tags    │      │product_category_    │
    │  (LINK TABLE)    │      │   product           │
    ├──────────────────┤      │ (LINK TABLE)        │
    │ FK: product_id   │      ├─────────────────────┤
    │ FK: tag_id ────┐ │      │ FK: product_id      │
    └────────────────┘ │      │ FK: category_id ──┐ │
                       │      └───────────────────┘ │
                       │                            │
                       ▼                            ▼
              ┌─────────────┐          ┌────────────────────┐
              │product_tag  │          │product_category    │
              ├─────────────┤          ├────────────────────┤
              │ PK: id      │          │ PK: id             │
              │     value   │          │     name           │
              │     metadata│          │     handle         │
              └─────────────┘          │     description    │
                                       │     is_active      │
                                       │     is_internal    │
                                       │ FK: parent_id      │
                                       │     rank           │
                                       │     metadata       │
                                       └────────────────────┘
```

---

## Key Relationships Explained

### 1. **Product → Variant → Price** (1:N:N)

```
product (1)
  ↓ has many
product_variant (N)
  ↓ has one
product_variant_price_set (1:1 link)
  ↓ links to
price_set (1)
  ↓ has many
price (N)
```

**Why this structure?**

- Medusa v2 separates pricing into a dedicated module
- Allows flexible pricing rules (regions, customer groups, etc.)
- `price_set` acts as a container for multiple prices

### 2. **Product → Variant → Inventory** (1:N:N)

```
product (1)
  ↓ has many
product_variant (N)
  ↓ via link table
product_variant_inventory_item (N:N)
  ↓ links to
inventory_item (1)
  ↓ has many locations
inventory_level (N) -- one per location
```

**Why this structure?**

- Same variant can have inventory in multiple locations
- `inventory_level` tracks stock per location
- Supports multi-warehouse setups

### 3. **Product ↔ Sales Channel** (N:N)

```
product (N)
  ↔ via link table
product_sales_channel (N:N)
  ↔ links to
sales_channel (N)
```

**Why many-to-many?**

- One product can be sold in multiple channels (web, mobile, retail)
- One sales channel has many products
- Link table enables this relationship

### 4. **Product → Options → Variant Options** (1:N → N:N)

```
product (1)
  ↓ has many
product_option (N) -- e.g., "Size", "Color"
  ↓ has many
product_option_value (N) -- e.g., "Small", "Red"
  ↔ via link table
product_variant_option (N:N)
  ↔ defines
product_variant (N)
```

**Example:**

```
Product: "T-Shirt"
  Option 1: "Size" → values: ["S", "M", "L"]
  Option 2: "Color" → values: ["Red", "Blue"]

Variants:
  - Variant 1: Size=S, Color=Red
  - Variant 2: Size=S, Color=Blue
  - Variant 3: Size=M, Color=Red
  - Variant 4: Size=M, Color=Blue
  - ...
```

---

## SQL Queries to Explore Relationships

### Query 1: Complete Product with All Relations

```sql
SELECT
    p.id,
    p.title,
    p.status,
    pc.title as collection,
    pt.value as type,

    -- Count relations
    COUNT(DISTINCT pv.id) as variants,
    COUNT(DISTINCT img.id) as images,
    COUNT(DISTINCT psc.sales_channel_id) as sales_channels,
    COUNT(DISTINCT pt2.product_tag_id) as tags

FROM product p
LEFT JOIN product_collection pc ON p.collection_id = pc.id
LEFT JOIN product_type pt ON p.type_id = pt.id
LEFT JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN image img ON p.id = img.product_id
LEFT JOIN product_sales_channel psc ON p.id = psc.product_id
LEFT JOIN product_tags pt2 ON p.id = pt2.product_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.status, pc.title, pt.value
ORDER BY p.title;
```

### Query 2: Product → Variant → Price Path

```sql
SELECT
    p.title as product,
    pv.title as variant,
    pv.sku,
    pr.amount / 100.0 as price,
    pr.currency_code
FROM product p
INNER JOIN product_variant pv ON p.id = pv.product_id
INNER JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
INNER JOIN price_set ps ON pvps.price_set_id = ps.id
INNER JOIN price pr ON ps.id = pr.price_set_id
WHERE p.deleted_at IS NULL
  AND pv.deleted_at IS NULL
  AND pr.deleted_at IS NULL
ORDER BY p.title, pv.title, pr.currency_code;
```

### Query 3: Product → Variant → Inventory Path

```sql
SELECT
    p.title as product,
    pv.sku,
    ii.sku as inventory_sku,
    il.stocked_quantity,
    sl.name as location
FROM product p
INNER JOIN product_variant pv ON p.id = pv.product_id
INNER JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
INNER JOIN inventory_item ii ON pvii.inventory_item_id = ii.id
INNER JOIN inventory_level il ON ii.id = il.inventory_item_id
LEFT JOIN stock_location sl ON il.location_id = sl.id
WHERE p.deleted_at IS NULL
ORDER BY p.title, pv.sku;
```

### Query 4: Product with All Option Combinations

```sql
SELECT
    p.title as product,
    pv.title as variant,
    po.title as option_name,
    pov.value as option_value
FROM product p
INNER JOIN product_variant pv ON p.id = pv.product_id
INNER JOIN product_variant_option pvo ON pv.id = pvo.variant_id
INNER JOIN product_option_value pov ON pvo.option_value_id = pov.id
INNER JOIN product_option po ON pov.option_id = po.id
WHERE p.deleted_at IS NULL
ORDER BY p.title, pv.title, po.title;
```

---

## Table Sizes & Cardinalities

Based on your seeded data:

| Table                   | Typical Rows | Purpose                              |
| ----------------------- | ------------ | ------------------------------------ |
| `product`               | 4            | Base products                        |
| `product_variant`       | 16+          | 4 variants per product on average    |
| `product_option`        | 4            | 1 option per product (Size)          |
| `product_option_value`  | 16           | 4 values per option (S, M, L, XL)    |
| `price`                 | 32+          | 2 currencies per variant (EUR, USD)  |
| `image`                 | 8+           | 2 images per product on average      |
| `product_sales_channel` | 4+           | All products in default channel      |
| `inventory_level`       | 16+          | Stock level per variant per location |

---

## Important Notes

### ⚠️ Soft Deletes

All major tables use soft deletes via `deleted_at` timestamp:

- Always filter: `WHERE deleted_at IS NULL`
- Or use: `WHERE deleted_at IS NOT NULL` to see deleted items

### 🔑 Primary Keys

All IDs are text (not integers):

- Format: `{type}_01XXXXXXXXXXXXXXXXX`
- Example: `prod_01K7E7DZHFRAEFAWABXARCGYSR`
- Uses ULID (Universally Unique Lexicographically Sortable Identifier)

### 💰 Price Storage

- Prices stored in **smallest currency unit** (cents)
- `amount: 1000` = $10.00 or €10.00
- Divide by 100 to get decimal amount

### 📦 JSONB Fields

Several tables have `metadata` (JSONB):

- Store custom data: `{"custom_field": "value"}`
- Query with: `WHERE metadata->>'custom_field' = 'value'`

---

## DBeaver Tips for Exploring Schema

1. **View ER Diagram:**

   - Right-click schema `public`
   - Select "View Diagram"
   - See visual relationships

2. **Explore Foreign Keys:**

   - Open table properties
   - Go to "Foreign Keys" tab
   - See all relationships

3. **Find Related Data:**

   - Right-click on a row
   - Select "Navigate" → "Foreign Keys"
   - Jump to related records

4. **Generate JOIN Queries:**
   - Right-click on table
   - Select "Generate SQL" → "SELECT"
   - Choose related tables to join

This should help you understand why data is spread across tables and how to query it properly in DBeaver! 🚀
