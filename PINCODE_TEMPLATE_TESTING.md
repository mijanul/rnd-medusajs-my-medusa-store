# Testing Guide - Pincode Pricing Template Pre-fill Feature

## Quick Test Steps

### Prerequisites

- Medusa server running (`yarn dev`)
- Admin panel accessible
- At least one product in the database
- Some existing pincode prices (optional for full test)

### Test Scenario 1: No Existing Prices

**Goal**: Verify template generates correctly when no prices exist

1. Navigate to **Pincode Pricing** page in admin panel
2. Click **"Download CSV Template"**
3. Open the downloaded CSV file
4. **Expected Result**:
   - All price columns are empty
   - Product information is populated (SKU, ID, Title)
   - Pincode columns are present

### Test Scenario 2: With Existing Prices

**Goal**: Verify existing prices are pre-filled in template

#### Setup:

First, add some prices via CSV upload or API:

```csv
sku	product_id	product_title	110001	400001	560001
test-product	prod_abc123	Test Product	2999	2899	3099
```

#### Test:

1. Upload the CSV with prices
2. Wait for success confirmation
3. Click **"Download CSV Template"** again
4. Open the downloaded CSV file
5. **Expected Result**:
   - Price cells contain the uploaded values (2999, 2899, 3099)
   - Product information matches
   - All data is tab-separated

### Test Scenario 3: Partial Prices

**Goal**: Verify mixed state (some products with prices, some without)

1. Ensure you have:

   - Product A with prices for some pincodes
   - Product B with no prices
   - Product C with prices for all pincodes

2. Download template
3. **Expected Result**:
   - Product A: Some cells filled, some empty
   - Product B: All price cells empty
   - Product C: All cells filled

### Test Scenario 4: Update Existing Prices

**Goal**: Verify you can modify pre-filled prices and re-upload

1. Download template (with existing prices)
2. Modify some price values
3. Save the CSV
4. Upload the modified CSV
5. Download template again
6. **Expected Result**:
   - New prices are reflected in the template
   - No data loss
   - All modifications persisted

## Visual Verification

### UI Elements to Check:

1. **Smart Template Notice** (Blue box)

   - [ ] Visible near the top of the page
   - [ ] Contains text about automatic price inclusion
   - [ ] Blue background with proper contrast

2. **Format Instructions** (Gray box at bottom)

   - [ ] Contains CSV format details
   - [ ] Green highlighted text about pre-filled prices
   - [ ] All bullet points visible

3. **Download Button**
   - [ ] "Download CSV Template" button works
   - [ ] File downloads with timestamp in name
   - [ ] No console errors

## Manual Database Verification

If you want to verify data integrity:

```sql
-- Check existing prices
SELECT
  p.id,
  p.title,
  ppp.pincode,
  ppp.price,
  ppp.is_active
FROM product p
LEFT JOIN product_pincode_price ppp ON p.id = ppp.product_id
WHERE ppp.is_active = true
ORDER BY p.title, ppp.pincode;
```

## Common Issues & Solutions

### Issue 1: Empty Template (No Products)

**Symptom**: Template has only headers
**Solution**: Ensure products exist in database

### Issue 2: No Pincodes in Template

**Symptom**: Only 3 columns (SKU, ID, Title)
**Solution**: Either:

- Add pincode-dealer mappings, or
- Sample pincodes (110001, etc.) should appear automatically

### Issue 3: Prices Not Showing

**Symptom**: Template downloads but prices are empty
**Possible Causes**:

- Prices marked as `is_active: false`
- Product IDs don't match
- Pincode format mismatch

**Debug**:

```bash
# Check backend logs
yarn dev

# Look for:
# - Number of prices fetched
# - Price map contents
# - Any errors in template generation
```

### Issue 4: Format Issues in Excel

**Symptom**: Columns not properly separated
**Solution**:

- Ensure file opens in Excel with "Text Import Wizard"
- Select "Tab" as delimiter
- Or save as .tsv instead of .csv

## Performance Testing

### Large Dataset Test:

1. Create 100+ products
2. Add prices for 50+ pincodes
3. Download template
4. **Verify**:
   - Download completes in reasonable time (<5 seconds)
   - No memory issues
   - File size is reasonable

## API Testing (Optional)

Direct API call to test backend:

```bash
# Test template endpoint
curl -X GET "http://localhost:9000/admin/pincode-pricing/template" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  --output template.csv

# Check file contents
cat template.csv | head -5
```

## Success Criteria

✅ **Feature is working if:**

1. Template downloads successfully
2. Existing prices appear in correct cells
3. Empty cells for products without prices
4. UI shows clear instructions about pre-fill feature
5. Modified prices can be re-uploaded successfully
6. No errors in browser console or backend logs

## Reporting Issues

If you find issues, provide:

1. Browser console logs
2. Backend terminal output
3. Sample CSV content (first few rows)
4. Steps to reproduce
5. Expected vs actual behavior

---

**Quick Start Command**:

```bash
# Start Medusa dev server
yarn dev

# Navigate to: http://localhost:9000/app/pincode-pricing
```
