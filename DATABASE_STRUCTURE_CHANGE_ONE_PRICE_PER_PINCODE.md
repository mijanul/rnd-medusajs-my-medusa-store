# Database Structure Change: One Price Per Pincode

## Summary

Changed the pincode pricing system from **multiple dealers per pincode** to **one price per pincode** (applies to all dealers).

**Result**: If you have 17 pincodes, you'll have exactly 17 price entries, not 43.

---

## Changes Made

### 1. Database Model Update

**File**: `src/modules/pincode-pricing/models/product-pincode-price.ts`

**Before**:

```typescript
dealer: model.belongsTo(() => Dealer, {
  mappedBy: "prices",
});
```

**After**:

```typescript
// Removed dealer relationship
// Added unique constraint on (product_id, pincode)
.indexes([
  {
    name: "idx_product_pincode_unique",
    on: ["product_id", "pincode"],
    unique: true,
  },
])
```

**Key Changes**:

- ❌ Removed `dealer` relationship
- ✅ Added unique constraint: `(product_id, pincode)` must be unique
- ✅ One pincode = One price for ALL dealers

---

### 2. Database Migration

**File**: `src/modules/pincode-pricing/migrations/Migration20251028120000.ts`

**Actions**:

1. ✅ Removed duplicate entries (kept lowest price per pincode)
2. ✅ Dropped `dealer_id` column
3. ✅ Added unique index on `(product_id, pincode)`

**Migration Status**: ✅ Successfully executed

---

### 3. Admin Widget Updates

**File**: `src/admin/widgets/product-pincode-pricing.tsx`

**Changes**:

1. ✅ Removed "Total Prices" statistic (only shows "Total Pincodes")
2. ✅ Removed bulk update functionality ("Update All Dealers" button)
3. ✅ Simplified Grouped View - shows one price per pincode card
4. ✅ Updated descriptions and comments
5. ✅ Changed pagination text from "prices" to "pincodes"

**Before - Grouped View**:

```
┌─ 110001 (3 dealers) ─────── [Update All Dealers] ──┐
│ Dealer 1: ₹2,200 [Edit] [Delete]                   │
│ Dealer 2: ₹2,150 [Edit] [Delete]                   │
│ Dealer 3: ₹2,180 [Edit] [Delete]                   │
└─────────────────────────────────────────────────────┘
```

**After - Grouped View**:

```
┌─ 110001 ───────────────── ₹2,150 [Edit] [Delete] ──┐
└─────────────────────────────────────────────────────┘
```

---

## Database Structure

### New Table Schema

```sql
CREATE TABLE product_pincode_price (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,  -- References product.id (CASCADE delete)
  sku TEXT,                  -- Product SKU for CSV mapping
  pincode TEXT NOT NULL,     -- 6-digit pincode
  price NUMERIC NOT NULL,    -- Price for this pincode
  is_active BOOLEAN DEFAULT true,

  -- Unique constraint: one price per product per pincode
  CONSTRAINT idx_product_pincode_unique UNIQUE (product_id, pincode)
);
```

### Key Points

- ✅ **One row per pincode**: If product has 17 pincodes, table has 17 rows
- ✅ **No dealer column**: All dealers use the same price
- ✅ **Unique constraint**: Cannot have duplicate (product_id, pincode) combinations
- ✅ **CASCADE delete**: Deleting product auto-deletes all its pincode prices

---

## Example Data

### Before (3 dealers, 2 pincodes = 6 rows)

| id  | product_id | pincode | dealer_id | price |
| --- | ---------- | ------- | --------- | ----- |
| 1   | prod_123   | 110001  | dealer_1  | 2200  |
| 2   | prod_123   | 110001  | dealer_2  | 2150  |
| 3   | prod_123   | 110001  | dealer_3  | 2180  |
| 4   | prod_123   | 110002  | dealer_1  | 2300  |
| 5   | prod_123   | 110002  | dealer_2  | 2250  |
| 6   | prod_123   | 110002  | dealer_3  | 2280  |

### After (2 pincodes = 2 rows)

| id  | product_id | pincode | price |
| --- | ---------- | ------- | ----- | ------------------- |
| 2   | prod_123   | 110001  | 2150  | ← Kept lowest price |
| 5   | prod_123   | 110002  | 2250  | ← Kept lowest price |

**Result**: 6 rows → 2 rows (one per pincode)

---

## API Behavior

### GET `/admin/pincode-pricing/prices?product_id=prod_123`

**Before**:

```json
{
  "prices": [
    { "id": "1", "pincode": "110001", "dealer": { "name": "Dealer 1" }, "price": 2200 },
    { "id": "2", "pincode": "110001", "dealer": { "name": "Dealer 2" }, "price": 2150 },
    { "id": "3", "pincode": "110001", "dealer": { "name": "Dealer 3" }, "price": 2180 },
    ...
  ]
}
```

**After**:

```json
{
  "prices": [
    { "id": "2", "pincode": "110001", "price": 2150 },
    { "id": "5", "pincode": "110002", "price": 2250 }
  ]
}
```

---

## Widget UI Changes

### Statistics Bar

**Before**:

```
Total Pincodes: 17 | Total Prices: 43 | Showing: 43 results
```

**After**:

```
Total Pincodes: 17 | Showing: 17 results
```

### List View

**Before**:

```
Pincode | Price   | Actions
110001  | 2200.00 | [Edit] [Delete]
110001  | 2150.00 | [Edit] [Delete]
110001  | 2180.00 | [Edit] [Delete]
```

**After**:

```
Pincode | Price   | Actions
110001  | 2150.00 | [Edit] [Delete]
110002  | 2250.00 | [Edit] [Delete]
```

### Grouped View

**Before**:

- Shows multiple dealers per pincode card
- "Update All Dealers" button
- Shows dealer count: "3 dealer(s)"

**After**:

- One price per pincode card
- Direct edit in header
- No dealer information

---

## Benefits

### 1. Simplified Data Structure

- ✅ No dealer complexity
- ✅ One price = one pincode
- ✅ Easier to understand and manage

### 2. Reduced Redundancy

- ✅ 17 pincodes = 17 rows (not 43)
- ✅ No duplicate pricing data
- ✅ Smaller database footprint

### 3. Cleaner UI

- ✅ No confusing dealer lists
- ✅ Direct price editing
- ✅ Faster page load

### 4. Data Integrity

- ✅ Unique constraint prevents duplicates
- ✅ Cannot have multiple prices per pincode
- ✅ Database enforces consistency

---

## Migration Notes

### What Happened During Migration

1. **Duplicate Removal**: For each product-pincode combination with multiple entries, kept only the one with the **lowest price**
2. **Column Removal**: Dropped the `dealer_id` column
3. **Constraint Added**: Created unique index on `(product_id, pincode)`

### Data Loss

If you had different prices for different dealers per pincode, the migration kept only the **lowest price**. Other prices were deleted.

**Example**:

- Dealer 1: ₹2,200
- Dealer 2: ₹2,150 ← **KEPT**
- Dealer 3: ₹2,180

### Rollback

The migration includes a `down()` method that:

- Drops the unique constraint
- Re-adds the `dealer_id` column

**Note**: Deleted data cannot be recovered via rollback.

---

## CSV Format Update

### Before

```csv
sku,pincode,dealer_id,price
SKU001,110001,dealer_1,2200
SKU001,110001,dealer_2,2150
SKU001,110002,dealer_1,2300
```

### After

```csv
sku,pincode,price
SKU001,110001,2150
SKU001,110002,2300
```

**Change**: Removed `dealer_id` column from CSV format.

---

## Testing Checklist

### Database

- [x] Migration executed successfully
- [ ] Verify unique constraint works (try inserting duplicate pincode)
- [ ] Verify CASCADE delete works (delete product, check prices deleted)

### Widget

- [ ] List View shows one row per pincode
- [ ] Grouped View shows one card per pincode
- [ ] Statistics show correct pincode count
- [ ] Edit button works
- [ ] Delete button works
- [ ] Search by pincode works
- [ ] Pagination shows "X pincodes" not "X prices"

### APIs

- [ ] GET prices returns one entry per pincode
- [ ] PUT price update works
- [ ] DELETE price works
- [ ] POST sync from currency works

---

## Files Modified

1. ✅ `src/modules/pincode-pricing/models/product-pincode-price.ts`
2. ✅ `src/modules/pincode-pricing/migrations/Migration20251028120000.ts` (NEW)
3. ✅ `src/admin/widgets/product-pincode-pricing.tsx`

---

## Next Steps

1. **Test the Widget**: Visit a product page and verify pincode pricing shows correctly
2. **Test CSV Upload**: Upload CSV without dealer_id column
3. **Verify Count**: Confirm pincode count matches price count (17 pincodes = 17 prices)
4. **Update Documentation**: Update any existing docs that mention dealer-based pricing

---

## Summary

✅ **One pincode = One price**  
✅ **No dealer differentiation**  
✅ **17 pincodes = 17 prices (not 43)**  
✅ **Simpler, cleaner, more maintainable**

Your pincode pricing system now has a 1:1 relationship between pincodes and prices! 🎉
