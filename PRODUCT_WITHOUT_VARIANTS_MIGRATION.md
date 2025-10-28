# 🔄 Product Without Variants - Complete Migration Guide

## Overview

Your Medusa store has been successfully modified to work **without product variants**. All products are now treated as single SKU items with pricing directly linked to products instead of variants.

---

## 📋 Changes Made

### 1. Database Schema Changes

#### Migration: `Migration20251027120000.ts`

- **Renamed column**: `variant_id` → `product_id` in `product_pincode_price` table
- **Updated indexes**:
  - Dropped: `product_pincode_price_variant_id_index`
  - Created: `product_pincode_price_product_id_index`
  - Created: `product_pincode_price_product_pincode_index` (composite)

**Status**: ✅ Migration executed successfully

---

### 2. Model Updates

#### File: `src/modules/pincode-pricing/models/product-pincode-price.ts`

**Before**:

```typescript
variant_id: model.text(), // Links to product_variant.id
```

**After**:

```typescript
product_id: model.text(), // Links to product.id
```

**Impact**: The pricing model now directly references products instead of variants.

---

### 3. API Endpoint Changes

#### Admin Template Endpoint

**File**: `src/api/admin/pincode-pricing/template/route.ts`

**Changes**:

- Uses `listProducts()` instead of `listProductVariants()`
- CSV format changed from 4 columns to 3 columns:
  - **Old**: `sku, variant_id, product_title, variant_title, [pincodes...]`
  - **New**: `sku, product_id, product_title, [pincodes...]`

**Example CSV Template**:

```csv
sku	product_id	product_title	110001	400001	560001
SHIRT-001	prod_01ABC123	Medusa T-Shirt	2999	3199	2899
PANTS-001	prod_01DEF456	Cotton Pants	3999	4199	3799
```

---

#### Admin Upload Endpoint

**File**: `src/api/admin/pincode-pricing/upload/route.ts`

**Changes**:

- Parses CSV with 3 fixed columns (instead of 4)
- Validates `product_id` instead of `variant_id`
- Pincode columns start at index 3 (instead of 4)

---

#### Store Price Endpoint

**File**: `src/api/store/products/[product_id]/pincode-price/route.ts`

**Changes**:

- Endpoint path changed: `/store/products/[variant_id]/pincode-price` → `/store/products/[product_id]/pincode-price`
- Returns `product_id` instead of `variant_id` in response

**Example API Call**:

```bash
GET /store/products/prod_01ABC123/pincode-price?pincode=110001
```

**Response**:

```json
{
  "product_id": "prod_01ABC123",
  "pincode": "110001",
  "price": 2999,
  "price_formatted": "₹2999.00",
  "currency": "INR",
  "dealer": "Default Dealer",
  "delivery_days": 3,
  "is_cod_available": false
}
```

---

### 4. Service Layer Updates

#### File: `src/modules/pincode-pricing/service.ts`

**Updated Methods**:

1. **`getProductPrice(productId, pincode)`**

   - Parameter changed from `variantId` to `productId`
   - Queries by `product_id` instead of `variant_id`

2. **`bulkImportPrices(pricesData)`**

   - Accepts `product_id` instead of `variant_id` in data array
   - Creates pricing records with `product_id`

3. **`bulkImportPricesSimple(pricesData)`**
   - Accepts `product_id` instead of `variant_id`
   - Uses default dealer for simplified imports

---

### 5. Admin UI Updates

#### File: `src/admin/routes/pincode-pricing/page.tsx`

**Changes**:

- Updated instructions to mention "products" instead of "variants"
- Changed CSV format description from 4 to 3 fixed columns
- Updated placeholder text in textarea
- Removed variant-related terminology

---

## 🚀 How to Use

### Step 1: Download CSV Template

1. Go to **Admin Panel → Pincode Pricing**
2. Click **"Download CSV Template"**
3. Opens a CSV file with:
   - Column 1: `sku` (product handle/SKU)
   - Column 2: `product_id` (Medusa product ID)
   - Column 3: `product_title` (product name for reference)
   - Columns 4+: Pincode columns (e.g., `110001`, `400001`, etc.)

---

### Step 2: Fill Prices

Open the CSV in Excel or Google Sheets:

```
sku         product_id        product_title       110001  400001  560001
SHIRT-001   prod_01ABC123     Medusa T-Shirt      2999    3199    2899
PANTS-001   prod_01DEF456     Cotton Pants        3999    4199    3799
SHOES-001   prod_01GHI789     Running Shoes       5999    6199    5799
```

- Fill prices in **Indian Rupees** (e.g., 2999 for ₹2999)
- Leave cells empty if product not available in that pincode
- Use tab-separated format (TSV) for best Excel compatibility

---

### Step 3: Upload CSV

1. Copy all content from CSV (Ctrl+A, Ctrl+C)
2. Paste into textarea in Admin UI
3. Click **"Upload Pricing CSV"**
4. See success message: "Successfully uploaded 127 prices!"

---

## 🔍 Testing

### Test Admin Endpoints

#### 1. Download Template

```bash
curl -X GET "http://localhost:9000/admin/pincode-pricing/template" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o template.csv
```

#### 2. Upload Pricing

```bash
curl -X POST "http://localhost:9000/admin/pincode-pricing/upload" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csv_data": "sku\tproduct_id\tproduct_title\t110001\t400001\nSHIRT-001\tprod_123\tMedusa T-Shirt\t2999\t3199"
  }'
```

---

### Test Store Endpoint

```bash
curl -X GET "http://localhost:9000/store/products/prod_01ABC123/pincode-price?pincode=110001"
```

**Expected Response**:

```json
{
  "product_id": "prod_01ABC123",
  "pincode": "110001",
  "price": 2999,
  "price_formatted": "₹2999.00",
  "currency": "INR",
  "dealer": "Default Dealer",
  "delivery_days": 3,
  "is_cod_available": false
}
```

---

## 📊 Database Changes Summary

### Table: `product_pincode_price`

**Schema**:

```sql
CREATE TABLE product_pincode_price (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,  -- Changed from variant_id
  sku TEXT,
  pincode TEXT NOT NULL,
  dealer_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- New indexes
CREATE INDEX product_pincode_price_product_id_index ON product_pincode_price(product_id);
CREATE INDEX product_pincode_price_product_pincode_index ON product_pincode_price(product_id, pincode);
```

---

## ⚠️ Important Notes

### 1. **No More Variants**

- Products are treated as single items
- No size/color/option variations
- One product = One SKU = One price per pincode

### 2. **Backward Compatibility**

- Old CSV files with `variant_id` will **NOT** work
- Re-download template to get new format
- Re-upload all pricing data with new format

### 3. **Existing Data**

- If you had existing data with `variant_id`, the migration renamed the column to `product_id`
- **You need to update those IDs** to point to actual product IDs instead of variant IDs
- Run this SQL to check:

```sql
SELECT * FROM product_pincode_price LIMIT 10;
```

### 4. **Storefront Integration**

- If you have a separate storefront application, update API calls from:
  - `/store/products/[variant_id]/pincode-price` → `/store/products/[product_id]/pincode-price`
- Update frontend code to use `product_id` instead of `variant_id`

---

## 🔄 Migration Rollback

If you need to revert changes:

```bash
# Run down migration
yarn medusa db:migrate:down --module pincodePricing
```

This will:

- Rename `product_id` back to `variant_id`
- Restore old indexes
- Revert to variant-based system

---

## ✅ Verification Checklist

- [x] Database migration completed successfully
- [x] Model updated to use `product_id`
- [x] Admin template endpoint returns products (not variants)
- [x] Admin upload endpoint processes `product_id`
- [x] Store endpoint uses `/products/[product_id]/...`
- [x] Service methods updated to use `product_id`
- [x] Admin UI updated with correct terminology
- [ ] Test CSV download
- [ ] Test CSV upload with sample data
- [ ] Test store API with product ID and pincode
- [ ] Update storefront application (if separate)

---

## 🆘 Troubleshooting

### Issue: "No products found in template"

**Solution**: Make sure you have products in your database. Create products first, then download template.

### Issue: "Failed to upload CSV"

**Solution**:

- Check CSV format has exactly 3 fixed columns + pincode columns
- Ensure product IDs exist in database
- Use tab-separated format (not comma)

### Issue: "Product not found" in store API

**Solution**:

- Verify product ID is correct (starts with `prod_`)
- Check product exists: `SELECT * FROM product WHERE id = 'prod_123';`
- Ensure pricing exists: `SELECT * FROM product_pincode_price WHERE product_id = 'prod_123';`

---

## 📞 Next Steps

1. **Clear old pricing data** (if migrating from variant-based system):

```sql
DELETE FROM product_pincode_price;
```

2. **Download new template** with product IDs

3. **Fill prices** for all products and pincodes

4. **Upload CSV** via admin UI

5. **Test storefront** with new product-based endpoints

---

## 📝 Summary

Your store is now configured to work **without product variants**. All pricing is directly linked to products, making it simpler to manage inventory and pricing for single-SKU products.

**Key Benefits**:

- ✅ Simpler product management
- ✅ Cleaner CSV format (3 columns instead of 4)
- ✅ Direct product-to-price mapping
- ✅ No variant confusion
- ✅ Better performance (fewer joins)

**Files Modified**: 8 files
**Database Tables Modified**: 1 table (`product_pincode_price`)
**New Migrations**: 1 migration file
**Breaking Changes**: Yes (API endpoints and CSV format changed)
