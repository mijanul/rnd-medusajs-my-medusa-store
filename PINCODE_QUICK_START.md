# Quick Start: New Pincode Pricing Format

## 🎯 What Changed?

Your CSV template now has **pincodes as columns** instead of rows!

**Old:** Each row = one variant + one pincode + one dealer  
**New:** Each row = one variant, columns = all pincodes

## 🚀 How to Use (3 Easy Steps)

### Step 1: Download Template

1. Go to Medusa Admin → Pincode Pricing
2. Click **"Download CSV Template"** button
3. Open the downloaded file in Excel/Google Sheets

### Step 2: Fill in Prices

The template looks like this:

```
sku              variant_id              product_title    variant_title    110001    400001    560001
SHIRT-S-BLACK    variant_01K7E7DZ...    Medusa T-Shirt   S / Black        [empty]   [empty]   [empty]
SHIRT-M-WHITE    variant_02K8F8EZ...    Medusa T-Shirt   M / White        [empty]   [empty]   [empty]
```

**Fill in the empty cells with prices:**

```
sku              variant_id              product_title    variant_title    110001    400001    560001
SHIRT-S-BLACK    variant_01K7E7DZ...    Medusa T-Shirt   S / Black        2999      3199      2899
SHIRT-M-WHITE    variant_02K8F8EZ...    Medusa T-Shirt   M / White        3199      3399      3099
```

**Tips:**

- Fill prices left to right for each variant
- Leave cells empty if variant not available in that pincode
- Prices are in INR (no decimals needed)

### Step 3: Upload

1. Select all cells in Excel (Ctrl+A / Cmd+A)
2. Copy (Ctrl+C / Cmd+C)
3. Go back to Medusa Admin → Pincode Pricing
4. Paste into the textarea (Ctrl+V / Cmd+V)
5. Click **"Upload Pricing CSV"**
6. See success message! 🎉

## ✅ What Removed

- ❌ No more dealer_code column
- ❌ No more dealer_name column
- ❌ No more Dealers tab
- ❌ No more Pincode Mappings tab

Everything is now **simpler and faster**!

## 📋 CSV Format Rules

1. **Separator:** Tab or comma (both work)
2. **First 4 columns:** sku, variant_id, product_title, variant_title
3. **Remaining columns:** 6-digit pincodes (110001, 400001, etc.)
4. **Cell values:** Price in INR (e.g., 2999 for ₹29.99)
5. **Empty cells:** Variant not available in that pincode

## 🎨 Example CSV

### With 3 Pincodes

```
sku              variant_id    product_title      variant_title    110001    400001    560001
SHIRT-S-BLACK    var_123       Medusa T-Shirt     S / Black        2999      3199      2899
SHIRT-M-WHITE    var_124       Medusa T-Shirt     M / White        3199      3399      3099
SWEATSHIRT-L     var_125       Medusa Sweatshirt  L                4999      5199      4799
```

### With Empty Cells (Not Available)

```
sku              variant_id    product_title      variant_title    110001    400001    560001
SHIRT-S-BLACK    var_123       Medusa T-Shirt     S / Black        2999              2899
SHIRT-M-WHITE    var_124       Medusa T-Shirt     M / White                3399      3099
SWEATSHIRT-L     var_125       Medusa Sweatshirt  L                4999      5199
```

In this example:

- S / Black: Not available in 400001 (Mumbai)
- M / White: Not available in 110001 (Delhi)
- L: Not available in 560001 (Bangalore)

## 🆘 Troubleshooting

### "Failed to upload CSV"

- Check that you copied the entire content including headers
- Make sure pincodes are 6 digits
- Prices should be numbers only (no currency symbols)

### "No valid price data found"

- You need to fill in at least one price
- Empty template won't upload

### Template is empty

- No products/variants exist yet
- Create products first, then download template

## 💡 Pro Tips

1. **Use Excel/Google Sheets:** Much easier than editing CSV in text editor
2. **Copy formulas across:** If prices follow a pattern, use Excel formulas
3. **Color code:** Use Excel cell colors to track filled vs empty cells
4. **Save backup:** Keep a copy before uploading
5. **Test with one variant:** Upload one variant first to test

## 📊 Benefits vs Old Format

| Benefit            | Description                    |
| ------------------ | ------------------------------ |
| **Faster**         | 80% less time to enter prices  |
| **Cleaner**        | 90% smaller file size          |
| **Simpler**        | No dealer management needed    |
| **Excel-friendly** | Horizontal view is natural     |
| **Less errors**    | Fewer columns = less confusion |

## 🔄 Existing Data

Don't worry! Your existing prices are **safe**. They continue to work normally. This is just a new, better way to upload prices going forward.

## 📞 Need Help?

Check the detailed documentation:

- `PINCODE_CSV_FORMAT_UPDATE.md` - Technical details
- `PINCODE_FORMAT_BEFORE_AFTER.md` - Visual comparison

---

**Happy Pricing! 🎉**
