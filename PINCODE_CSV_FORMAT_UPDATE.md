# Pincode Pricing CSV Format Update - Summary

## Overview

Restructured the pincode pricing CSV template to have **pincodes as columns** instead of rows, and removed all dealer-related functionality from the UI and CSV format.

## Changes Made

### 1. CSV Template Generation (`src/api/admin/pincode-pricing/template/route.ts`)

**Old Format:**

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
SHIRT-S-BLACK,variant_01K7E7DZJX7B8EYPYF0QAJX4MT,Medusa T-Shirt,S / Black,110001,DEALER_MUMBAI,Mumbai Warehouse,
```

**New Format:**

```csv
sku	variant_id	product_title	variant_title	110001	400001	560001	600001	700001
SHIRT-S-BLACK	variant_01K7E7DZJX7B8EYPYF0QAJX4MT	Medusa T-Shirt	S / Black	2999	3199	2899	3099	3299
```

**Key Changes:**

- ✅ Each pincode is now a column header (columns 5+)
- ✅ Removed `pincode`, `dealer_code`, `dealer_name` columns
- ✅ One row per variant instead of multiple rows per variant
- ✅ Prices filled in cells for each pincode column
- ✅ Empty cells mean variant not available in that pincode
- ✅ Uses tab separator for better Excel compatibility
- ✅ Automatically fetches existing pincodes from `pincode_dealer` table
- ✅ Falls back to sample pincodes if no pincodes exist

### 2. CSV Upload Endpoint (`src/api/admin/pincode-pricing/upload/route.ts`)

**Key Changes:**

- ✅ Parses new CSV format with pincodes as columns
- ✅ Supports both tab and comma separators
- ✅ Validates pincode format (6 digits)
- ✅ Processes each cell as a price for that variant-pincode combination
- ✅ Skips empty cells automatically
- ✅ Returns detailed upload statistics (imported, failed, errors)
- ✅ Calls new `bulkImportPricesSimple()` method

### 3. Service Layer (`src/modules/pincode-pricing/service.ts`)

**Added New Method:**

```typescript
async bulkImportPricesSimple(
  pricesData: Array<{
    sku: string;
    variant_id: string;
    pincode: string;
    price: number;
  }>
)
```

**Key Changes:**

- ✅ No `dealer_code` required in input
- ✅ Automatically uses/creates a "DEFAULT" dealer internally
- ✅ Maintains backward compatibility with existing data model
- ✅ Better error handling with detailed error messages

### 4. Admin UI (`src/admin/routes/pincode-pricing/page.tsx`)

**Removed:**

- ❌ Dealer management tab
- ❌ Pincode mapping tab
- ❌ All dealer-related state and functions
- ❌ Table imports

**Simplified to:**

- ✅ Single "Pincode-Based Pricing" page
- ✅ Download CSV Template button
- ✅ Paste CSV Data textarea
- ✅ Upload Pricing CSV button
- ✅ Clear instructions with visual example
- ✅ Detailed format documentation

**New UI Features:**

- Shows example CSV format with pincodes as columns
- Explains each column clearly
- Success message shows upload stats (imported/failed counts)
- Displays upload errors in console for debugging

## How to Use

### 1. Download Template

1. Go to Admin → Pincode Pricing
2. Click "Download CSV Template"
3. Open in Excel/Google Sheets

### 2. Fill Prices

- Each row is one product variant
- Each column (after column 4) is a pincode
- Fill in prices in INR for each variant-pincode combination
- Leave cells empty if variant not available in that pincode

### 3. Upload

1. Copy all content from the CSV (Ctrl+A, Ctrl+C)
2. Paste into the textarea in admin UI
3. Click "Upload Pricing CSV"
4. See success message with statistics

## Example CSV Format

```
sku              variant_id    product_title    variant_title    110001    400001    560001
SHIRT-S-BLACK    var_123       Medusa T-Shirt   S / Black        2999      3199      2899
SHIRT-M-WHITE    var_124       Medusa T-Shirt   M / White        3199      3399      3099
SWEATSHIRT-L     var_125       Medusa Sweatshirt L               4999      5199      4799
```

## Benefits

1. **Simpler CSV Format**: Much easier to edit in spreadsheet applications
2. **Less Redundancy**: One row per variant instead of variant × pincode × dealer rows
3. **Better UX**: Can see all prices for a variant at a glance
4. **Faster Data Entry**: Fill prices across pincodes horizontally
5. **Cleaner UI**: Removed unused dealer management complexity
6. **Better Excel Compatibility**: Tab-separated format

## Technical Notes

- **Backward Compatibility**: The data model still uses dealer_id internally (with DEFAULT dealer)
- **Future-proof**: Easy to add pincodes by adding columns
- **Validation**: Automatically validates 6-digit pincode format
- **Error Handling**: Detailed error messages for debugging
- **Performance**: Bulk import optimized for large datasets

## Files Modified

1. `/src/api/admin/pincode-pricing/template/route.ts` - Template generation
2. `/src/api/admin/pincode-pricing/upload/route.ts` - CSV upload parsing
3. `/src/modules/pincode-pricing/service.ts` - Added bulkImportPricesSimple()
4. `/src/admin/routes/pincode-pricing/page.tsx` - Simplified UI

## Migration Notes

- **Existing Data**: Not affected - old prices remain in database
- **New Uploads**: Use new format going forward
- **Mixed Data**: System handles both old and new data seamlessly
- **Dealers**: Still exist in database but hidden from UI
- **Pincode Mappings**: Still used internally for serviceability checks

## Next Steps

If you want to:

- Add more pincodes: They'll automatically appear as columns in the template
- Remove dealer tables entirely: Would require migration script (not recommended - used internally)
- Add bulk edit UI: Consider building a spreadsheet-like interface
- Export existing prices: Add a new export endpoint that generates CSV in new format
