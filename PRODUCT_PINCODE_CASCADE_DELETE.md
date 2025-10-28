# Product Pincode Price - Foreign Key CASCADE Delete

## Overview

Added a foreign key constraint on `product_pincode_price.product_id` that references `product.id` with **CASCADE delete**.

## What This Means

### Automatic Cleanup

When a product is deleted from the `product` table, **all associated pincode prices are automatically deleted** from the `product_pincode_price` table. You don't need to manually clean up the pincode prices anymore.

### Example Scenario

**Before this change:**

```sql
-- Delete a product
DELETE FROM product WHERE id = 'prod_123';

-- You would need to manually clean up pincode prices
DELETE FROM product_pincode_price WHERE product_id = 'prod_123';
```

**After this change:**

```sql
-- Delete a product
DELETE FROM product WHERE id = 'prod_123';

-- Pincode prices are automatically deleted! ✅
-- No manual cleanup needed
```

## Database Constraints

The `product_pincode_price` table now has two foreign key constraints:

### 1. Product Foreign Key (NEW)

- **Column**: `product_id`
- **References**: `product(id)`
- **On Delete**: `CASCADE` (auto-delete pincode prices when product is deleted)
- **On Update**: `CASCADE` (auto-update if product ID changes)

### 2. Dealer Foreign Key (Existing)

- **Column**: `dealer_id`
- **References**: `dealer(id)`
- **On Delete**: `NO ACTION` (prevents dealer deletion if it has prices)
- **On Update**: `CASCADE` (auto-update if dealer ID changes)

## Migration Applied

**File**: `src/modules/pincode-pricing/migrations/Migration20251028000000.ts`

**SQL Executed**:

```sql
ALTER TABLE product_pincode_price
ADD CONSTRAINT product_pincode_price_product_id_foreign
FOREIGN KEY (product_id)
REFERENCES product(id)
ON DELETE CASCADE
ON UPDATE CASCADE;
```

## Benefits

1. **Data Integrity**: Ensures no orphaned pincode prices when products are deleted
2. **Automatic Cleanup**: No manual intervention needed
3. **Consistency**: Database automatically maintains referential integrity
4. **Performance**: Database handles cascading deletes efficiently

## Verification

Run the verification script to check the constraint:

```bash
node verify-foreign-key.js
```

You should see:

```
✅ Constraint: product_pincode_price_product_id_foreign
   Column: product_id
   References: product(id)
   On Delete: CASCADE
   On Update: CASCADE
```

## Important Notes

⚠️ **Warning**: Be careful when deleting products! All pincode prices for that product will be **permanently deleted** and cannot be recovered unless you have a backup.

✅ **Recommendation**: Before deleting a product:

1. Consider backing up the pincode prices if needed
2. Or mark the product as inactive instead of deleting it
3. Use soft deletes when possible (Medusa supports this with `deleted_at`)

## Testing

To test the CASCADE delete functionality:

1. Add some test pincode prices for a product
2. Delete the product
3. Verify that the pincode prices are automatically removed

```javascript
// Example test
const productId = "test_prod_123";

// 1. Add prices
await db.query(`
  INSERT INTO product_pincode_price (id, product_id, sku, pincode, dealer_id, price)
  VALUES ('price_1', '${productId}', 'SKU123', '400001', 'dealer_1', 100.00);
`);

// 2. Delete product
await db.query(`DELETE FROM product WHERE id = '${productId}';`);

// 3. Check - should return 0 rows
const result = await db.query(`
  SELECT * FROM product_pincode_price WHERE product_id = '${productId}';
`);
console.log("Remaining prices:", result.rowCount); // Should be 0
```

## Rollback

If you need to remove this constraint, run:

```bash
npx medusa db:migrate:down
```

Or manually:

```sql
ALTER TABLE product_pincode_price
DROP CONSTRAINT IF EXISTS product_pincode_price_product_id_foreign;
```

## Files Modified

1. ✅ `src/modules/pincode-pricing/migrations/Migration20251028000000.ts` - Migration to add constraint
2. ✅ `src/modules/pincode-pricing/models/product-pincode-price.ts` - Updated model documentation

---

**Date**: October 28, 2025  
**Status**: ✅ Applied and Verified
