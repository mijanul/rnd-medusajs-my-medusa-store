# 🚫 Variant Checkbox Hiding - Quick Reference

## What Was Hidden

The variant checkbox that appears in product creation forms with the following text:

```
☑️ Variants

Yes, this is a product with variants
When unchecked, we will create a default variant for you
```

## Implementation

### Files Updated

1. **`src/admin/widgets/hide-product-variants.tsx`**
2. **`src/admin/widgets/global-variant-hider.tsx`**

### Changes Made

#### 1. CSS Rules Added

```css
/* Hide variant checkboxes */
input[type="checkbox"][name*="variant" i],
input[type="checkbox"][id*="variant" i] {
  display: none !important;
}

/* Hide labels associated with variant checkboxes */
label[for*="variant" i] {
  display: none !important;
}

/* Hide form field containers with variant checkboxes */
div:has(> input[type="checkbox"][name*="variant" i]),
div:has(> input[type="checkbox"][id*="variant" i]),
fieldset:has(input[name*="variant" i]) {
  display: none !important;
}
```

#### 2. JavaScript Detection Enhanced

Added detection for:

- Checkboxes with `id` or `name` containing "variant"
- Associated `<label>` elements (by `for` attribute)
- Text containing "this is a product with variants"
- Text containing "we will create a default variant"

#### 3. Container Hiding Logic

The widgets now traverse up the DOM tree to hide the entire form field container, looking for:

- Elements with class containing "field", "form-field", "input-group"
- `<fieldset>` elements
- Elements with `role="group"`

## How It Works

### Step 1: CSS Immediate Hiding

When the page loads, CSS rules immediately hide any checkbox with variant-related attributes.

### Step 2: JavaScript Detection

A MutationObserver scans for:

```javascript
input[type="checkbox"] where:
  - id.includes('variant') OR
  - name.includes('variant')
```

### Step 3: Hide Associated Elements

For each found checkbox:

1. Hide the checkbox itself
2. Find and hide the associated `<label>` (by `for` attribute)
3. Traverse up to find the form field container
4. Hide the entire container

### Step 4: Text-Based Hiding

Scans all text elements for:

- "this is a product with variants"
- "we will create a default variant"
- Other variant-related phrases

## Testing

### To Verify It's Working

1. **Create New Product**

   ```
   Go to: /admin/products
   Click: Create Product
   Check: No "Variants" checkbox visible
   ```

2. **Check Browser Console**

   ```
   Open DevTools (F12)
   Look for: <style id="hide-variants-style">
   Look for: <style id="global-hide-variants">
   Both should be present in <head>
   ```

3. **Inspect Element**
   ```
   Right-click empty space where checkbox was
   Check: Element should have display: none
   Check: Parent containers should be hidden
   ```

## Troubleshooting

### If Checkbox Still Appears

1. **Hard Refresh**

   ```bash
   Cmd+Shift+R (Mac)
   Ctrl+Shift+R (Windows/Linux)
   ```

2. **Check Widget Loading**

   - Open browser console
   - Search for errors
   - Verify both style tags exist in `<head>`

3. **Check Medusa Dev Server**

   ```bash
   # Restart the server
   # Stop with Ctrl+C, then:
   yarn dev
   ```

4. **Check Element Attributes**
   - Open DevTools
   - Find the checkbox element
   - Note the exact `id` and `name` attributes
   - Verify they contain "variant" (case insensitive)

### Common Issues

**Issue**: Checkbox appears briefly then disappears  
**Cause**: CSS not loaded, JavaScript hiding working  
**Fix**: CSS should hide immediately, check style injection

**Issue**: Checkbox never disappears  
**Cause**: Widget not loading or attributes don't match  
**Fix**: Check browser console for errors

**Issue**: Label text still visible  
**Cause**: Label not properly associated or found  
**Fix**: Check label's `for` attribute matches checkbox `id`

## Advanced Customization

### To Hide Additional Form Elements

Edit the CSS in either widget file:

```typescript
style.textContent = `
  /* Your custom selector */
  input[type="checkbox"][name="your-field"] {
    display: none !important;
  }
`;
```

### To Add More Text Patterns

Edit the JavaScript detection:

```typescript
const isVariantText =
  text.includes("your custom text") ||
  // ... existing patterns
```

## Related Files

- Main implementation: `src/admin/widgets/hide-product-variants.tsx`
- Global coverage: `src/admin/widgets/global-variant-hider.tsx`
- Documentation: `VARIANT_HIDING_IMPLEMENTATION.md`
- Product system: `CSV_FORMAT_NO_VARIANTS.md`

## Status

✅ **Active** - Both widgets are running  
✅ **CSS Hiding** - Immediate hiding on page load  
✅ **JS Hiding** - Dynamic content handling  
✅ **Text Detection** - Variant-related text hidden  
✅ **Checkbox Hiding** - Variant checkbox completely hidden

---

**Last Updated**: October 28, 2025  
**Applies To**: Product Create/Edit Forms  
**Target**: "Yes, this is a product with variants" checkbox
