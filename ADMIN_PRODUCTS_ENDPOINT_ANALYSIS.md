# Deep Dive: GET /admin/products Endpoint Analysis

## Your Request

```
GET /admin/products?limit=20&offset=0&is_giftcard=false&fields=id%2Ctitle%2Chandle%2Cstatus%2C%2Acollection%2C%2Asales_channels%2Cvariants.id%2Cthumbnail
```

**Decoded URL Parameters:**

```
limit=20
offset=0
is_giftcard=false
fields=id,title,handle,status,*collection,*sales_channels,variants.id,thumbnail
```

---

## 🔄 Complete Request Flow

### 1. **Route Registration**

```
File: node_modules/@medusajs/medusa/dist/api/admin/products/route.js
Handler: exports.GET
```

### 2. **Middleware Stack** (Applied in Order)

From `node_modules/@medusajs/medusa/dist/api/admin/products/middlewares.js`:

```javascript
{
  method: ["GET"],
  matcher: "/admin/products",
  middlewares: [
    // 1. Validate & Transform Query Parameters
    validateAndTransformQuery(
      AdminGetProductsParams,
      listProductQueryConfig
    ),

    // 2. Apply Link Filter (for sales channels)
    maybeApplyLinkFilter({
      entryPoint: "product_sales_channel",
      resourceId: "product_id",
      filterableField: "sales_channel_id"
    }),

    // 3. Apply Price Lists Filter
    maybeApplyPriceListsFilter()
  ]
}
```

**What Each Middleware Does:**

#### Middleware 1: `validateAndTransformQuery`

- **Validates** query parameters using Zod schema
- **Transforms** `is_giftcard=false` → `{ is_giftcard: false }`
- **Parses** pagination: `limit=20`, `offset=0`
- **Parses** fields: Splits comma-separated fields
- **Stores** in `req.filterableFields` and `req.queryConfig`

#### Middleware 2: `maybeApplyLinkFilter`

- **Purpose**: Filter products by sales channel if `sales_channel_id` provided
- **How**: Uses the link table `product_sales_channel` to join
- **Tables**: Links `product` ↔ `sales_channel`

#### Middleware 3: `maybeApplyPriceListsFilter`

- **Purpose**: Filter products by price list if `price_list_id` provided
- **How**: Joins with price list module data

---

## 📊 Query Configuration

From `node_modules/@medusajs/medusa/dist/api/admin/products/query-config.js`:

```javascript
exports.defaultAdminProductFields = [
  // Basic fields
  "id",
  "title",
  "subtitle",
  "status",
  "external_id",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "type_id",

  // Dimensions
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",

  // Timestamps
  "created_at",
  "updated_at",
  "deleted_at",
  "metadata",

  // Relations (marked with *)
  "*type", // product_type table
  "*collection", // product_collection table
  "*options", // product_option table
  "*options.values", // product_option_value table
  "*tags", // product_tag table (many-to-many)
  "*images", // product_image table
  "*variants", // product_variant table
  "*variants.prices", // money_amount table via price_set
  "variants.prices.price_rules.value",
  "variants.prices.price_rules.attribute",
  "*variants.options", // product_option_value table
  "*sales_channels", // sales_channel table (many-to-many)
];

exports.listProductQueryConfig = {
  defaults: defaultAdminProductFields,
  defaultLimit: 50,
  isList: true,
};
```

**Field Notation:**

- `id` = Direct column from product table
- `*collection` = Include ALL fields from related collection table
- `variants.id` = Only include id field from variants
- `+metadata` = Add this field to default selection

---

## 🎯 Main GET Handler

From `node_modules/@medusajs/medusa/dist/api/admin/products/route.js`:

```javascript
exports.GET = async (req, res) => {
  // Check if Index Engine feature flag is enabled
  if (FeatureFlag.isFeatureEnabled(INDEX_ENGINE.key)) {
    // Index engine doesn't support tags/categories yet
    if (
      Object.keys(req.filterableFields).length === 0 ||
      isPresent(req.filterableFields.tags) ||
      isPresent(req.filterableFields.categories)
    ) {
      return await getProducts(req, res);
    }
    return await getProductsWithIndexEngine(req, res);
  }

  // Default: use traditional query
  return await getProducts(req, res);
};
```

**Two Query Methods:**

### Method 1: Traditional Remote Query (Most Common)

```javascript
async function getProducts(req, res) {
  // 1. Remap field keys (prices → price_set.prices)
  const selectFields = remapKeysForProduct(req.queryConfig.fields ?? []);

  // 2. Execute query via Remote Query
  const { rows: products, metadata } = await refetchEntities(
    "product", // Entry point (table)
    req.filterableFields, // { is_giftcard: false }
    req.scope, // Dependency injection container
    selectFields, // Parsed fields
    req.queryConfig.pagination, // { skip: 0, take: 20 }
    req.queryConfig.withDeleted // Include soft-deleted?
  );

  // 3. Transform response (remap prices back)
  res.json({
    products: products.map(remapProductResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
}
```

### Method 2: Index Engine (Optimized Search)

```javascript
async function getProductsWithIndexEngine(req, res) {
  const query = req.scope.resolve("query");

  // Transform sales_channel_id filter
  const filters = req.filterableFields;
  if (isPresent(filters.sales_channel_id)) {
    filters["sales_channels"] = { id: filters.sales_channel_id };
    delete filters.sales_channel_id;
  }

  // Query the search index
  const { data: products, metadata } = await query.index({
    entity: "product",
    fields: req.queryConfig.fields ?? [],
    filters: filters,
    pagination: req.queryConfig.pagination,
    withDeleted: req.queryConfig.withDeleted,
  });

  res.json({
    products: products.map(remapProductResponse),
    count: metadata.estimate_count,
    estimate_count: metadata.estimate_count,
    offset: metadata.skip,
    limit: metadata.take,
  });
}
```

---

## 🗄️ Database Tables Involved

### Your Request Uses These Tables:

#### 1. **Main Table: `product`**

```sql
SELECT
  id,
  title,
  handle,
  status,
  thumbnail,
  collection_id,
  is_giftcard,
  ...
FROM product
WHERE is_giftcard = false
LIMIT 20 OFFSET 0;
```

**Columns Queried:**

- `id` - Primary key
- `title` - Product name
- `handle` - URL-friendly slug
- `status` - draft/proposed/published/rejected
- `thumbnail` - Image URL
- `is_giftcard` - Boolean filter

#### 2. **Related Table: `product_collection`**

```sql
LEFT JOIN product_collection
  ON product.collection_id = product_collection.id
```

**Selected via:** `*collection` (all collection fields)

#### 3. **Link Table: `product_sales_channel`**

```sql
LEFT JOIN product_sales_channel
  ON product.id = product_sales_channel.product_id
LEFT JOIN sales_channel
  ON product_sales_channel.sales_channel_id = sales_channel.id
```

**Selected via:** `*sales_channels` (all sales channel fields)

#### 4. **Related Table: `product_variant`**

```sql
LEFT JOIN product_variant
  ON product.id = product_variant.product_id
```

**Selected via:** `variants.id` (only variant IDs)

---

## 🔍 Remote Query System

### How `refetchEntities` Works:

From `node_modules/@medusajs/framework/dist/http/utils/refetch-entities.js`:

```javascript
const refetchEntities = async (
  entryPoint,    // "product"
  idOrFilter,    // { is_giftcard: false }
  scope,         // Container with services
  fields,        // ["id", "title", "*collection", ...]
  pagination,    // { skip: 0, take: 20 }
  withDeleted    // false
) => {
  // 1. Resolve Remote Query service from container
  const remoteQuery = scope.resolve("remoteQuery");

  // 2. Build filters
  const filters = isString(idOrFilter)
    ? { id: idOrFilter }
    : idOrFilter;

  // 3. Build query object
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product",
    variables: {
      filters: { is_giftcard: false },
      skip: 0,
      take: 20,
      withDeleted: false
    },
    fields: ["id", "title", "handle", ...]
  });

  // 4. Execute query (returns array of products)
  return await remoteQuery(queryObject);
};
```

### Remote Query Object Structure:

```javascript
{
  entity: "product",
  fields: [
    "id",
    "title",
    "handle",
    "status",
    "thumbnail",
    "collection.*",        // All collection fields
    "sales_channels.*",    // All sales channel fields
    "variants.id"          // Only variant IDs
  ],
  filters: {
    is_giftcard: false
  },
  pagination: {
    skip: 0,
    take: 20
  }
}
```

---

## 📝 Field Remapping (Important!)

### Why Remapping?

**Old Medusa v1:** Variant prices were directly on variants
**New Medusa v2:** Prices are in a separate `price_set` module

### From `helpers.js`:

```javascript
const remapKeysForProduct = (selectFields) => {
  const productFields = selectFields.filter(
    (fieldName) => !isPricing(fieldName)
  );

  const pricingFields = selectFields
    .filter((fieldName) => isPricing(fieldName))
    .map((fieldName) =>
      fieldName.replace("variants.prices.", "variants.price_set.prices.")
    );

  return [...productFields, ...pricingFields];
};

// Request:  "variants.prices"
// Remapped: "variants.price_set.prices"
```

### Response Remapping:

```javascript
const remapProductResponse = (product) => {
  return {
    ...product,
    variants: product.variants?.map((variant) => ({
      ...variant,
      prices: variant.price_set?.prices?.map((price) => ({
        id: price.id,
        amount: price.amount,
        currency_code: price.currency_code,
        variant_id: variant.id,
        rules: buildRules(price), // Convert price_rules to object
      })),
    })),
  };
};
```

---

## 🎨 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ HTTP Request                                                     │
│ GET /admin/products?limit=20&is_giftcard=false&fields=...      │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Middleware Stack                                                 │
│ 1. validateAndTransformQuery()                                  │
│    → Parse: limit=20, offset=0                                  │
│    → Parse: is_giftcard=false                                   │
│    → Parse fields: [id, title, *collection, variants.id, ...]  │
│                                                                  │
│ 2. maybeApplyLinkFilter()                                       │
│    → Handle sales_channel_id filtering via link table           │
│                                                                  │
│ 3. maybeApplyPriceListsFilter()                                 │
│    → Handle price_list_id filtering                             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Route Handler: GET function                                      │
│ → Check if Index Engine enabled?                                │
│   ├─ Yes (and no tags/categories) → getProductsWithIndexEngine()│
│   └─ No → getProducts()                                         │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ getProducts() - Traditional Query                                │
│                                                                  │
│ 1. remapKeysForProduct()                                        │
│    "variants.prices" → "variants.price_set.prices"              │
│                                                                  │
│ 2. refetchEntities()                                            │
│    ├─ Resolve remoteQuery service                               │
│    ├─ Build query object                                        │
│    └─ Execute query                                             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Remote Query Service                                             │
│ remoteQueryObjectFromString()                                   │
│                                                                  │
│ Converts field notation to actual database queries:             │
│ {                                                                │
│   entity: "product",                                             │
│   fields: ["id", "title", "collection.*", ...],                │
│   filters: { is_giftcard: false },                              │
│   pagination: { skip: 0, take: 20 }                             │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Database Layer (PostgreSQL)                                      │
│                                                                  │
│ Main Query:                                                      │
│   SELECT * FROM product                                          │
│   WHERE is_giftcard = false                                      │
│   LIMIT 20 OFFSET 0                                              │
│                                                                  │
│ Joins (based on field selections):                              │
│   LEFT JOIN product_collection                                   │
│     ON product.collection_id = product_collection.id            │
│                                                                  │
│   LEFT JOIN product_sales_channel                                │
│     ON product.id = product_sales_channel.product_id            │
│   LEFT JOIN sales_channel                                        │
│     ON product_sales_channel.sales_channel_id = sales_channel.id│
│                                                                  │
│   LEFT JOIN product_variant                                      │
│     ON product.id = product_variant.product_id                  │
│                                                                  │
│   LEFT JOIN price_set                                            │
│     ON product_variant.id = price_set.variant_id                │
│   LEFT JOIN money_amount                                         │
│     ON price_set.id = money_amount.price_set_id                 │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Raw Database Result                                              │
│ [                                                                │
│   {                                                              │
│     id: "prod_123",                                              │
│     title: "Cool T-Shirt",                                       │
│     handle: "cool-t-shirt",                                      │
│     status: "published",                                         │
│     thumbnail: "https://...",                                    │
│     is_giftcard: false,                                          │
│     collection: {                                                │
│       id: "col_abc",                                             │
│       title: "Summer Collection"                                 │
│     },                                                           │
│     sales_channels: [                                            │
│       { id: "sc_xyz", name: "Webshop" }                          │
│     ],                                                           │
│     variants: [                                                  │
│       { id: "var_456" }                                          │
│     ],                                                           │
│     price_set: { ... }  // ← This needs remapping               │
│   }                                                              │
│ ]                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Response Transformation                                          │
│ remapProductResponse()                                          │
│                                                                  │
│ Transform: price_set.prices → variants[].prices                │
│ Add variant_id to each price                                    │
│ Convert price_rules array to rules object                       │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ JSON Response                                                    │
│ {                                                                │
│   products: [                                                    │
│     {                                                            │
│       id: "prod_123",                                            │
│       title: "Cool T-Shirt",                                     │
│       handle: "cool-t-shirt",                                    │
│       status: "published",                                       │
│       thumbnail: "https://...",                                  │
│       collection: {                                              │
│         id: "col_abc",                                           │
│         title: "Summer Collection"                               │
│       },                                                         │
│       sales_channels: [                                          │
│         { id: "sc_xyz", name: "Webshop" }                        │
│       ],                                                         │
│       variants: [                                                │
│         {                                                        │
│           id: "var_456",                                         │
│           prices: [/* transformed */]                            │
│         }                                                        │
│       ]                                                          │
│     }                                                            │
│   ],                                                             │
│   count: 45,                                                     │
│   offset: 0,                                                     │
│   limit: 20                                                      │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Database Tables Summary

### Tables Queried for Your Request:

| Table                   | Purpose                 | Selected Fields                                   | How Joined                                      |
| ----------------------- | ----------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `product`               | Main entity             | id, title, handle, status, thumbnail, is_giftcard | N/A (main table)                                |
| `product_collection`    | Collection info         | All fields (\*)                                   | `product.collection_id = product_collection.id` |
| `sales_channel`         | Sales channels          | All fields (\*)                                   | Via `product_sales_channel` link table          |
| `product_sales_channel` | Link table              | (not selected, just for joining)                  | `product.id = product_sales_channel.product_id` |
| `product_variant`       | Product variants        | id only                                           | `product.id = product_variant.product_id`       |
| `price_set`             | Pricing data (internal) | (transformed)                                     | `product_variant.id = price_set.variant_id`     |
| `money_amount`          | Actual prices           | (transformed)                                     | `price_set.id = money_amount.price_set_id`      |

### Tables NOT Queried (not in your fields):

- `product_tag` (you didn't request `*tags`)
- `product_image` (you didn't request `*images`)
- `product_option` (you didn't request `*options`)
- `product_type` (you didn't request `*type`)
- `product_category` (you didn't request `*categories`)

---

## 🔑 Key Takeaways

1. **Entry Point**: The query starts with `"product"` entity
2. **Filter**: `is_giftcard=false` becomes WHERE clause
3. **Pagination**: `limit=20&offset=0` becomes `LIMIT 20 OFFSET 0`
4. **Relations**: `*collection` and `*sales_channels` trigger JOINs
5. **Remapping**: Price fields are remapped due to v2 architecture
6. **Two Query Modes**: Index Engine (fast search) vs Remote Query (flexible)

---

## 💡 How to Query Differently

### Example 1: Get More Fields

```
GET /admin/products?fields=*,*variants,*images,*tags
```

This will join more tables.

### Example 2: Filter by Collection

```
GET /admin/products?collection_id=col_123
```

Adds WHERE clause on collection_id.

### Example 3: Search by Title

```
GET /admin/products?q=shirt
```

Adds WHERE title ILIKE '%shirt%'.

### Example 4: Include Deleted Products

```
GET /admin/products?deleted_at[gt]=0
```

Includes soft-deleted products.

---

## 🎯 Summary

**Your request flow:**

1. URL parsed → Query params extracted
2. Middleware validates and transforms params
3. `getProducts()` called
4. Fields remapped for v2 pricing architecture
5. `refetchEntities()` builds and executes remote query
6. Database queries `product` table with JOINs
7. Results transformed (remap prices back)
8. JSON response sent

**Database tables accessed:**

- `product` (main)
- `product_collection` (via collection_id FK)
- `sales_channel` + `product_sales_channel` (many-to-many)
- `product_variant` (via product_id FK)
- Price-related tables (via variant price_set)

**Total products returned:** Up to 20 (with pagination)
