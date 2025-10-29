# 🚫 Variant Hiding Implementation

## Overview

This system completely hides all variant-related UI elements from the Medusa admin panel. Since this store uses a single-SKU-per-product model with pincode-based pricing instead of variants, the variant functionality is completely disabled from the UI.

## Implementation

### Files Created/Modified

1. **`src/admin/widgets/hide-product-variants.tsx`**

   - Primary widget for hiding variants on product pages
   - Injects CSS styles to hide variant links, tabs, and sections
   - Uses MutationObserver to handle dynamically loaded content
   - Zone: `product.details.before`

2. **`src/admin/widgets/global-variant-hider.tsx`**

   - Global widget that runs across all admin pages
   - More aggressive hiding strategy with periodic checks
   - Handles navigation items and route-based variant sections
   - Zone: `order.details.before` (to ensure global coverage)

3. **`src/admin/widgets/product-no-variants-notice.tsx`** (existing)

   - Shows a notice explaining variants are disabled
   - Zone: `product.details.before`

4. **`src/admin/routes/products/[id]/variants/page.tsx`** (existing)
   - Custom page that displays when someone tries to access variant route
   - Shows disabled message with redirect to pincode pricing

## What Gets Hidden

### 1. Navigation & Links

- Variant tabs in product details page
- "Variants" navigation items
- Any links containing `/variants` in the URL
- Parent list items containing variant links

### 2. Buttons & Actions

- "Add Variant" buttons
- "Edit Variants" buttons
- "Manage Variants" buttons
- Any button with variant-related aria-labels

### 3. Sections & Forms

- Variant sections in product create/edit forms
- Variant fieldsets and form groups
- Variant option inputs
- Variant data tables

### 4. Text Elements

- Headers containing "Variants"
- Labels with variant text
- Any element with text matching:
  - "Variants"
  - "Add Variant"
  - "Edit Variants"
  - "Manage Variants"
  - "Variant Options"

## How It Works

### CSS Injection Strategy

Both widgets inject `<style>` tags into the document head with comprehensive CSS rules:

```css
/* Example rules */
a[href*="/variants"] {
  display: none !important;
}
li:has(a[href*="/variants"]) {
  display: none !important;
}
[data-name="variants"] {
  display: none !important;
}
```

### JavaScript Detection Strategy

A MutationObserver watches for DOM changes and actively hides elements:

```typescript
// Monitors DOM for new elements
const observer = new MutationObserver(() => {
  hideVariantElements();
});

// Scans for variant-related text
const isVariantText =
  text === 'variants' ||
  text === 'add variant' ||
  // ... more checks
```

### Multi-Layer Approach

1. **CSS Layer**: Immediate hiding using CSS rules
2. **JavaScript Layer**: Scans and hides elements by text content
3. **Observer Layer**: Watches for dynamically loaded content
4. **Periodic Layer**: Fallback check every 2 seconds (global widget)

## Testing

### Areas to Test

1. **Product List Page**

   - ✅ No variant options visible
   - ✅ Product actions don't show variant management

2. **Product Details Page**

   - ✅ No "Variants" tab in navigation
   - ✅ Notice shows "Variants Disabled"
   - ✅ Only shows product info, pricing (pincode), inventory, etc.

3. **Product Create Page**

   - ✅ No variant section in the form
   - ✅ Simple product creation without variant options
   - ✅ SKU field is the only identifier

4. **Direct Variant URL Access**

   - ✅ `/admin/products/[id]/variants` shows disabled page
   - ✅ Message explains pincode pricing is used instead

5. **Navigation Menu**
   - ✅ No variant-related menu items
   - ✅ Parent items containing variant links are hidden

### Manual Testing Steps

1. **Open Product List**

   ```
   Go to: /admin/products
   Check: No "Variants" column or links
   ```

2. **Create New Product**

   ```
   Click: Create Product
   Check: No variant section in form
   Verify: Only basic product fields visible
   ```

3. **View Product Details**

   ```
   Open any product
   Check: No "Variants" tab in the navigation
   Verify: Only shows General, Pricing (Pincode), etc.
   ```

4. **Try Direct Variant Route**
   ```
   Navigate to: /admin/products/{product-id}/variants
   Check: Shows "Variants Not Supported" page
   Verify: Message mentions Pincode Pricing
   ```

## Customization

### To Modify Hide Behavior

Edit `src/admin/widgets/hide-product-variants.tsx` or `src/admin/widgets/global-variant-hider.tsx`:

```typescript
// Add more text patterns to hide
const isVariantText =
  text === 'variants' ||
  text === 'your_custom_text' ||
  // ... more patterns
```

### To Add More CSS Rules

Add to the `style.textContent` section:

```typescript
style.textContent = `
  /* Your custom CSS rules */
  .your-custom-selector {
    display: none !important;
  }
`;
```

### To Change Widget Zone

Modify the `config.zone` to place the widget on different pages:

```typescript
export const config = defineWidgetConfig({
  zone: "product.list.before", // Different zone
});
```

Available zones:

- `product.details.before`
- `product.details.after`
- `product.list.before`
- `product.list.after`
- `order.details.before`
- And many more...

## Troubleshooting

### Variants Still Visible

1. **Check Widget Loading**

   - Open browser console
   - Look for `hide-variants-style` or `global-hide-variants` in `<head>`
   - If missing, widget may not be loading

2. **Check for Errors**

   - Open browser console
   - Look for TypeScript/React errors
   - Check if widgets are registered

3. **Restart Dev Server**

   ```bash
   # Stop current server
   # Then restart
   yarn dev
   ```

4. **Clear Browser Cache**

   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - Or use incognito/private mode

5. **Check Medusa Version**
   - Ensure using Medusa 2.x
   - Widget API changed between versions

### CSS Not Taking Effect

If CSS rules aren't working:

1. **Increase Specificity**

   ```css
   /* More specific selector */
   body div a[href*="/variants"] {
     display: none !important;
   }
   ```

2. **Add Inline Styles via JavaScript**

   ```typescript
   element.style.display = "none";
   element.style.visibility = "hidden";
   ```

3. **Use Multiple Properties**
   ```css
   .element {
     display: none !important;
     visibility: hidden !important;
     height: 0 !important;
     overflow: hidden !important;
   }
   ```

## System Integration

This variant hiding system integrates with:

1. **Pincode Pricing System**

   - Products use pincode-based pricing instead of variants
   - See: `PINCODE_PRICING_COMPLETE_SYSTEM.md`

2. **Single SKU Model**

   - Each product = one SKU
   - No variant SKUs needed
   - See: `CSV_FORMAT_NO_VARIANTS.md`

3. **RBAC System**
   - Permissions apply to products, not variants
   - See: `COMPLETE_RBAC_MENU_PROTECTION.md`

## Future Enhancements

### Potential Improvements

1. **Backend API Blocking**

   - Add middleware to block variant API endpoints
   - Return 404 or 403 for variant routes

2. **Database Cleanup**

   - Remove existing variant data
   - Migrate to single-SKU structure

3. **Admin Extension**

   - Create proper Medusa admin extension
   - Override variant UI at the route level

4. **Configuration Flag**
   - Add config option to toggle variant hiding
   - `medusa-config.ts`: `disableVariants: true`

## Related Documentation

- `PINCODE_PRICING_COMPLETE_SYSTEM.md` - Pricing system overview
- `CSV_FORMAT_NO_VARIANTS.md` - Product CSV format without variants
- `PRODUCT_NO_VARIANTS_GUIDE.md` - General no-variants guide (if exists)

## Support

If variants are still showing after implementation:

1. Check browser console for errors
2. Verify widgets are in `src/admin/widgets/` directory
3. Ensure dev server restarted after changes
4. Try hard refresh or incognito mode
5. Check Medusa version compatibility

---

**Last Updated**: October 28, 2025  
**Medusa Version**: 2.10.3  
**Status**: ✅ Active & Working
