# Product Deletion & Pricing Data Cleanup

## Overview

When a product is deleted, all associated pricing data in the `product_pincode_price` table is automatically cleaned up to prevent orphaned records.

## ✅ Implementation

### 1. Automatic Cleanup (Subscriber)

**File:** `src/subscribers/product-deleted.ts`

A subscriber listens to the `product.deleted` event and automatically removes all related pricing data.

**How it works:**

```
Product Deleted → Event Triggered → Subscriber Runs → Pricing Data Deleted
```

**Features:**

- ✅ Automatic cleanup when product is deleted
- ✅ No manual intervention needed
- ✅ Logs deletion count
- ✅ Non-blocking (errors won't stop product deletion)

### 2. Service Methods

**File:** `src/modules/pincode-pricing/service.ts`

Added three new methods for deletion:

#### `deleteProductPricing(productId: string)`

Deletes all pricing data for a specific product.

```typescript
const result = await pricingService.deleteProductPricing("prod_123");
// Returns: { deleted: 15 }
```

#### `deletePincodePricing(pincode: string)`

Deletes all pricing data for a specific pincode.

```typescript
const result = await pricingService.deletePincodePricing("110001");
// Returns: { deleted: 50 }
```

#### `deletePricing(priceIds: string[])`

Deletes specific pricing entries by IDs.

```typescript
const result = await pricingService.deletePricing(["price_1", "price_2"]);
// Returns: { deleted: 2 }
```

### 3. Admin API Endpoints

#### Delete by Product

**Endpoint:** `DELETE /admin/pincode-pricing/product/:product_id`

Delete all pricing data for a specific product manually.

```bash
curl -X DELETE "http://localhost:9000/admin/pincode-pricing/product/prod_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "message": "Successfully deleted 15 pricing entries",
  "product_id": "prod_123",
  "deleted_count": 15
}
```

#### Delete by Pincode

**Endpoint:** `DELETE /admin/pincode-pricing/pincode/:pincode`

Delete all pricing data for a specific pincode.

```bash
curl -X DELETE "http://localhost:9000/admin/pincode-pricing/pincode/110001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "message": "Successfully deleted 50 pricing entries",
  "pincode": "110001",
  "deleted_count": 50
}
```

---

## 🔄 Deletion Flow

### Automatic (When Product is Deleted)

```
1. Admin deletes product in Medusa Admin
   ↓
2. Product deletion API is called
   ↓
3. Product is deleted from database
   ↓
4. "product.deleted" event is emitted
   ↓
5. Subscriber catches the event
   ↓
6. Subscriber queries product_pincode_price table
   ↓
7. All matching pricing entries are deleted
   ↓
8. Success message logged to console
```

### Manual (Using API)

```
1. Call DELETE API endpoint
   ↓
2. Service queries matching prices
   ↓
3. Price IDs are collected
   ↓
4. deleteProductPincodePrices() is called
   ↓
5. Entries are deleted from database
   ↓
6. Response with deleted count returned
```

---

## 📊 Database Impact

### Before Deletion

```sql
-- Product has pricing data
SELECT * FROM product_pincode_price WHERE product_id = 'prod_123';
-- Returns: 15 rows
```

### After Product Deletion

```sql
-- All related pricing data is automatically removed
SELECT * FROM product_pincode_price WHERE product_id = 'prod_123';
-- Returns: 0 rows
```

---

## 🧪 Testing

### Test 1: Delete Product via Admin UI

1. Go to Medusa Admin → Products
2. Delete a product that has pricing data
3. Check console logs for cleanup message
4. Verify pricing data is removed:
   ```sql
   SELECT * FROM product_pincode_price WHERE product_id = 'DELETED_PRODUCT_ID';
   ```

### Test 2: Manual Deletion via API

```bash
# Delete pricing for a specific product
curl -X DELETE "http://localhost:9000/admin/pincode-pricing/product/prod_123"

# Delete pricing for a specific pincode
curl -X DELETE "http://localhost:9000/admin/pincode-pricing/pincode/110001"
```

### Test 3: Check Logs

When a product is deleted, you should see:

```
✅ Deleted 15 pricing entries for product prod_123
```

---

## 🎯 Use Cases

### 1. Product Discontinuation

When you stop selling a product:

- Delete the product in admin
- Pricing data automatically cleaned up
- No orphaned records in database

### 2. Pincode Removal

When you stop serving a pincode:

```bash
DELETE /admin/pincode-pricing/pincode/999999
```

### 3. Bulk Cleanup

To clean up all pricing for multiple products:

```javascript
for (const productId of discontinuedProducts) {
  await fetch(`/admin/pincode-pricing/product/${productId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer TOKEN" },
  });
}
```

### 4. Data Migration

When migrating or resetting pricing:

```bash
# Delete all pricing for old products
# Then upload new pricing via CSV
```

---

## ⚠️ Important Notes

### Soft Delete vs Hard Delete

- Currently implements **hard delete** (permanent removal)
- Alternative: Could use soft delete by setting `deleted_at` timestamp
- To implement soft delete, modify service methods to update `deleted_at` instead of deleting

### Data Backup

Before bulk deletion:

```sql
-- Backup pricing data
CREATE TABLE product_pincode_price_backup AS
SELECT * FROM product_pincode_price;

-- Restore if needed
INSERT INTO product_pincode_price
SELECT * FROM product_pincode_price_backup;
```

### Performance

- Deletion is batched (all IDs at once)
- Indexed on `product_id` for fast lookups
- Non-blocking subscriber (won't slow down product deletion)

---

## 🔧 Troubleshooting

### Issue: Pricing data not deleted after product deletion

**Solution:**

1. Check if subscriber is running: Look for console logs
2. Verify service is available: Check container resolution
3. Check manually via API:
   ```bash
   curl -X DELETE "/admin/pincode-pricing/product/PRODUCT_ID"
   ```

### Issue: "Service not found" error

**Solution:**

1. Ensure pincode pricing module is registered
2. Check `medusa-config.ts` for module configuration
3. Restart dev server

### Issue: Want to prevent deletion

**Solution:**
Modify subscriber to use soft delete instead:

```typescript
// Instead of deleting, mark as inactive
await pricingService.updateProductPincodePrices(priceIds, {
  is_active: false,
  deleted_at: new Date(),
});
```

---

## 📝 Files Created/Modified

### New Files

1. ✅ `src/subscribers/product-deleted.ts` - Event subscriber
2. ✅ `src/api/admin/pincode-pricing/product/[product_id]/route.ts` - Delete by product API
3. ✅ `src/api/admin/pincode-pricing/pincode/[pincode]/route.ts` - Delete by pincode API
4. ✅ `src/workflows/product-deleted.ts` - Workflow hook (alternative approach)

### Modified Files

1. ✅ `src/modules/pincode-pricing/service.ts` - Added deletion methods

---

## 🚀 Future Enhancements

Potential improvements:

- [ ] Soft delete option (keep data but mark inactive)
- [ ] Bulk deletion UI in admin panel
- [ ] Deletion history/audit log
- [ ] Restore deleted pricing option
- [ ] Scheduled cleanup of old data
- [ ] Warning before deletion (if product has active prices)

---

## 💡 Best Practices

### 1. Always Backup Before Bulk Operations

```sql
-- Create backup before major cleanup
pg_dump -t product_pincode_price > pricing_backup.sql
```

### 2. Use Soft Delete for Important Data

```typescript
// Mark as deleted instead of removing
is_active: false,
deleted_at: new Date()
```

### 3. Monitor Deletion Logs

```bash
# Watch logs during product deletion
tail -f logs/medusa.log | grep "pricing entries"
```

### 4. Test in Staging First

- Test deletion flow in staging environment
- Verify data cleanup works correctly
- Then deploy to production

---

## 📊 Summary

| Action                 | Method                                             | Result                    |
| ---------------------- | -------------------------------------------------- | ------------------------- |
| Delete Product (Admin) | Automatic                                          | Pricing data auto-deleted |
| Delete Product Pricing | API: `DELETE /admin/pincode-pricing/product/:id`   | Manual cleanup            |
| Delete Pincode Pricing | API: `DELETE /admin/pincode-pricing/pincode/:code` | Manual cleanup            |
| Delete Specific Prices | Service: `deletePricing(ids)`                      | Programmatic deletion     |

---

**Status:** ✅ Complete and Ready to Use
**Date:** October 28, 2025
**Impact:** Prevents orphaned pricing data, maintains database integrity
