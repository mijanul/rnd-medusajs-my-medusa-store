# 📊 CSV Format Reference - Products Without Variants

## New CSV Format (Current)

### Structure

Products are listed with pricing directly linked - no variants needed.

### Column Layout

```
Column 1: sku (Product SKU/Handle)
Column 2: product_id (Medusa Product ID)
Column 3: product_title (Product Name - for reference)
Column 4+: Pincode Columns (one per pincode)
```

### Example Template

```tsv
sku	product_id	product_title	110001	400001	560001	600001	700001
TSHIRT-BLUE	prod_01ABC123	Cotton T-Shirt	2999	3199	2899	3099	3299
PANTS-BLACK	prod_01DEF456	Denim Pants	3999	4199	3799	3999	4299
SHOES-WHITE	prod_01GHI789	Running Shoes	5999	6199	5799	5999	6499
```

### Filled Example

```tsv
sku	product_id	product_title	110001	400001	560001	600001	700001
TSHIRT-BLUE	prod_01ABC123	Cotton T-Shirt	2999	3199	2899	3099	3299
PANTS-BLACK	prod_01DEF456	Denim Pants	3999	4199	3799	3999	4299
SHOES-WHITE	prod_01GHI789	Running Shoes	5999	6199	5799	5999	6499
```

---

## Old CSV Format (Deprecated)

### Structure (DO NOT USE)

```tsv
sku	variant_id	product_title	variant_title	110001	400001	560001
TSHIRT-S-BLUE	var_01ABC	T-Shirt	S / Blue	2999	3199	2899
TSHIRT-M-BLUE	var_01DEF	T-Shirt	M / Blue	3199	3399	3099
```

**This format is NO LONGER SUPPORTED.**

---

## Comparison Table

| Feature          | Old Format (Variants)              | New Format (No Variants)           |
| ---------------- | ---------------------------------- | ---------------------------------- |
| Fixed Columns    | 4                                  | 3                                  |
| Column 1         | sku                                | sku                                |
| Column 2         | variant_id                         | product_id                         |
| Column 3         | product_title                      | product_title                      |
| Column 4         | variant_title                      | _(removed)_                        |
| Rows per Product | Multiple (one per variant)         | One                                |
| Database Link    | product_variant table              | product table                      |
| API Endpoint     | `/store/products/[variant_id]/...` | `/store/products/[product_id]/...` |

---

## How to Fill the CSV

### Step 1: Download Template

Go to Admin Panel → Pincode Pricing → Download CSV Template

You'll get a file like:

```tsv
sku	product_id	product_title	110001	400001	560001
SHIRT-001	prod_123	Sample Shirt
PANTS-001	prod_456	Sample Pants
```

### Step 2: Open in Excel/Google Sheets

- Paste into Excel/Google Sheets
- Each column after `product_title` is a pincode
- Fill prices in cells

### Step 3: Fill Prices

```
Product: Cotton T-Shirt
- Delhi (110001): ₹2999
- Mumbai (400001): ₹3199
- Bangalore (560001): ₹2899
- Not available in Chennai (600001): Leave empty
```

In CSV:

```tsv
sku	product_id	product_title	110001	400001	560001	600001
TSHIRT-01	prod_123	Cotton T-Shirt	2999	3199	2899
```

### Step 4: Upload

1. Select all cells (Ctrl+A)
2. Copy (Ctrl+C)
3. Paste in Admin UI textarea
4. Click "Upload Pricing CSV"

---

## Validation Rules

### ✅ Valid

- Product ID exists in database
- Pincode is 6 digits
- Price is positive number
- Empty cells (product not available in that pincode)

### ❌ Invalid

- Non-existent product IDs
- Pincode not 6 digits
- Negative prices
- Non-numeric price values
- Missing required columns

---

## Examples

### Example 1: All Pincodes Available

```tsv
sku	product_id	product_title	110001	400001	560001
SHIRT-01	prod_abc	Basic Tee	1999	2099	1899
```

✅ Product available in all 3 pincodes with different prices

### Example 2: Selective Availability

```tsv
sku	product_id	product_title	110001	400001	560001
SHOES-01	prod_xyz	Running Shoes	5999		5799
```

✅ Product available only in Delhi (110001) and Bangalore (560001), NOT in Mumbai (400001)

### Example 3: Uniform Pricing

```tsv
sku	product_id	product_title	110001	400001	560001
PEN-01	prod_def	Blue Pen	99	99	99
```

✅ Same price across all pincodes

---

## Tips

### Excel Shortcuts

- **Fill down**: Select cell → Drag down fill handle
- **Fill right**: Select cell → Drag right fill handle
- **Format as table**: Makes editing easier
- **Freeze panes**: Keep headers visible while scrolling

### Common Patterns

1. **Metropolitan Premium**: Higher prices in metros (Mumbai, Delhi)
2. **Regional Pricing**: Different zones get different prices
3. **Logistics Cost**: Factor in shipping distance
4. **Dealer Margins**: Account for local dealer costs

### Bulk Operations

1. **Copy formula**: `=A2*1.1` (10% markup)
2. **Apply pattern**: Fill cells with formula
3. **Convert to values**: Copy → Paste Special → Values

---

## Import Statistics

After upload, you'll see:

```
Successfully uploaded 127 prices!
- Total rows processed: 15
- Rows skipped: 0
- Imported: 127
- Failed: 0
```

**Calculation**:

- 15 products
- 127 prices = sum of all filled cells across all products
- If a product has 10 pincodes filled, that's 10 prices

---

## Troubleshooting

### "CSV must have at least 4 columns"

**Problem**: Not enough columns in CSV
**Solution**: Ensure you have sku, product_id, product_title, and at least one pincode column

### "Invalid pincode format"

**Problem**: Pincode column headers are not 6 digits
**Solution**: Check column headers after product_title - must be 110001, 400001, etc.

### "No valid price data found"

**Problem**: All price cells are empty
**Solution**: Fill at least one price in any pincode column

### "Failed to upload CSV"

**Problem**: Product ID doesn't exist in database
**Solution**:

1. Check product exists: Go to Admin → Products
2. Copy correct product ID from database
3. Update CSV with correct ID

---

## Migration from Old Format

If you have old CSV files:

### 1. Identify Products

Old: Multiple rows per product (one per variant)

```tsv
SHIRT-S-BLUE	var_01	T-Shirt	S / Blue	2999
SHIRT-M-BLUE	var_02	T-Shirt	M / Blue	3199
SHIRT-L-BLUE	var_03	T-Shirt	L / Blue	3399
```

New: One row per product

```tsv
SHIRT-BLUE	prod_01	T-Shirt	2999
```

### 2. Merge Variant Data

- Choose one variant as primary (e.g., default size)
- Use product ID instead of variant ID
- Consolidate pricing

### 3. Update IDs

- Run query to get product IDs:

```sql
SELECT id, handle, title FROM product;
```

- Replace variant IDs with product IDs in CSV

---

## API Response Format

### Store Endpoint Response

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

**Note**: Response now includes `product_id` instead of `variant_id`

---

## Summary

- ✅ **3 fixed columns** (down from 4)
- ✅ **One row per product** (not per variant)
- ✅ **Direct product-to-price mapping**
- ✅ **Simpler management**
- ✅ **Tab-separated format** (TSV)
- ✅ **Empty cells supported** (selective availability)

For complete migration guide, see: `PRODUCT_WITHOUT_VARIANTS_MIGRATION.md`
