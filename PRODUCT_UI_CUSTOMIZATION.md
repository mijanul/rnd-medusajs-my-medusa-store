# Product Variant Removal - UI Customization

## Summary

Product creation/editing in Medusa Admin (`/app/products`) now shows that variants are disabled.

## Files Created

### 1. Notice Widget

**File**: `src/admin/widgets/product-no-variants-notice.tsx`

- Shows notice on product details page
- Explains variants are disabled
- Directs users to Pincode Pricing module

### 2. Variants Page Override

**File**: `src/admin/routes/products/[id]/variants/page.tsx`

- Overrides default variants tab
- Shows disabled message
- Cannot add/edit variants

## What Users See

### Product Details Page

- Notice box at top: "ℹ️ Variants Disabled"
- Message explains single-SKU approach

### Variants Tab (if clicked)

- Large "🚫 Variants Not Supported" message
- Explanation text
- Link to Pincode Pricing

## Testing

Restart dev server and check:

```bash
yarn dev
```

Go to: http://localhost:9000/app/products

## Note

Medusa's built-in product forms still show variant fields (like options). To fully remove these, you'd need to either:

1. Create custom product create/edit forms (complex)
2. Use CSS to hide variant sections (quick fix)
3. Accept that fields exist but educate users not to use them

For now, the notice widget provides clear guidance to users.
