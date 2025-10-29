# Week 2 Troubleshooting Guide

## Admin API & CSV Upload Issues

> **Quick solutions for common issues with Admin API endpoints**

---

## 🔴 CSV Upload Issues

### Issue 1: "Product not found with handle: xxx"

**Symptom:**

```json
{
  "errors": [
    {
      "row": 5,
      "sku": "my-product",
      "message": "Product not found with handle: my-product"
    }
  ]
}
```

**Cause:** Product handle in CSV doesn't match database

**Solutions:**

1. **Check product handle:**

   ```bash
   curl http://localhost:9000/store/products/my-product
   ```

2. **Use correct handle:**

   - Handle = URL-friendly version (e.g., `premium-headphones`)
   - NOT the product title
   - NOT the product ID

3. **Download template with prefill to see correct handles:**
   ```bash
   curl http://localhost:9000/admin/pincode-pricing-v2/template?prefill=true \
     -H "Authorization: Bearer TOKEN" \
     -o template.csv
   ```

---

### Issue 2: "Invalid price: abc"

**Symptom:**

```json
{
  "errors": [
    {
      "row": 12,
      "sku": "product-1",
      "pincode": "110001",
      "message": "Invalid price: abc"
    }
  ]
}
```

**Cause:** Non-numeric value in price cell

**Solutions:**

1. **Ensure prices are numbers:**

   - ✅ Correct: `2999`
   - ❌ Wrong: `₹2999`, `Rs 2999`, `2,999`, `abc`

2. **Leave empty for unavailable products:**

   - ✅ Correct: Empty cell
   - ❌ Wrong: `NA`, `N/A`, `0`, `-`

3. **CSV format:**
   ```csv
   SKU,110001,110002,110003
   product-1,2999,3199,2899
   product-2,1999,,1899
   ```

---

### Issue 3: "File format invalid"

**Symptom:**

```json
{
  "error": "INVALID_FILE",
  "message": "File must contain at least a header row and one data row"
}
```

**Cause:** CSV file is empty or malformed

**Solutions:**

1. **Check file structure:**

   ```csv
   # Minimum valid CSV:
   SKU,110001
   product-1,2999
   ```

2. **Verify encoding:** Use UTF-8 encoding

3. **Check for BOM:** Remove byte-order-mark if present

4. **Test with simple CSV first:**
   ```csv
   SKU,110001,110002
   test-product,2999,3199
   ```

---

### Issue 4: Base64 encoding errors

**Symptom:**

```json
{
  "error": "PROCESSING_ERROR",
  "message": "Failed to process uploaded file"
}
```

**Cause:** File not properly base64 encoded

**Solutions:**

1. **Correct base64 encoding (JavaScript):**

   ```javascript
   function fileToBase64(file) {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onload = () => {
         // Remove data:text/csv;base64, prefix
         const base64 = reader.result.split(",")[1];
         resolve(base64);
       };
       reader.onerror = reject;
       reader.readAsDataURL(file);
     });
   }
   ```

2. **Correct base64 encoding (command line):**

   ```bash
   # macOS/Linux
   base64 -i file.csv

   # Without line breaks
   base64 -i file.csv | tr -d '\n'
   ```

3. **Test with cURL:**

   ```bash
   base64_content=$(base64 -i test.csv | tr -d '\n')

   curl -X POST http://localhost:9000/admin/pincode-pricing-v2/upload \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"file\":\"$base64_content\",\"filename\":\"test.csv\"}"
   ```

---

## 🔴 Price Update Issues

### Issue 5: "Invalid pincode"

**Symptom:**

```json
{
  "error": "INVALID_PINCODE",
  "message": "Valid 6-digit pincode is required"
}
```

**Solutions:**

1. **Ensure exactly 6 digits:**

   - ✅ Correct: `"110001"`
   - ❌ Wrong: `110001` (number), `"11001"` (5 digits), `"1100011"` (7 digits)

2. **Always use string:**

   ```json
   {
     "pincode": "110001" // String, not number
   }
   ```

3. **Leading zeros matter:**
   ```json
   {
     "pincode": "001234" // Valid
   }
   ```

---

### Issue 6: "Product not found"

**Symptom:**

```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product prod_123 not found"
}
```

**Solutions:**

1. **Verify product exists:**

   ```bash
   curl http://localhost:9000/store/products/prod_123
   ```

2. **Get product ID from admin:**

   ```bash
   curl http://localhost:9000/admin/products \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Check product ID format:**
   - ✅ Correct: `prod_01J8X...` (Medusa ID format)
   - ❌ Wrong: Product handle, title, or SKU

---

### Issue 7: "Price must be a positive number"

**Symptom:**

```json
{
  "error": "INVALID_PRICE",
  "message": "Price must be a positive number (in cents)"
}
```

**Solutions:**

1. **Remember: Price is in cents:**

   ```json
   {
     "price": 299900 // ₹2,999.00
   }
   ```

2. **Conversion formula:**

   ```javascript
   const priceInRupees = 2999;
   const priceInCents = priceInRupees * 100; // 299900
   ```

3. **Must be positive:**
   - ✅ Correct: `299900`, `1`, `100`
   - ❌ Wrong: `-100`, `0`, `null`

---

## 🔴 Authentication Issues

### Issue 8: "Unauthorized"

**Symptom:**

```json
{
  "message": "Unauthorized"
}
```

**Solutions:**

1. **Login as admin:**

   ```bash
   curl -X POST http://localhost:9000/admin/auth/session \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@medusa-test.com","password":"supersecret"}'
   ```

2. **Include token in requests:**

   ```bash
   curl http://localhost:9000/admin/pincode-pricing-v2/products/prod_123 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check token expiry:** Re-authenticate if token expired

---

## 🔴 Template Download Issues

### Issue 9: Empty template

**Symptom:** Template CSV has no data rows

**Solutions:**

1. **Ensure products exist:**

   ```bash
   curl http://localhost:9000/admin/products \
     -H "Authorization: Bearer TOKEN"
   ```

2. **Template only includes first 100 products:** Modify if needed

3. **Use prefill for existing prices:**
   ```bash
   curl http://localhost:9000/admin/pincode-pricing-v2/template?prefill=true \
     -H "Authorization: Bearer TOKEN"
   ```

---

### Issue 10: Missing pincodes in template

**Symptom:** Template doesn't include expected pincodes

**Solutions:**

1. **Specify pincodes explicitly:**

   ```bash
   curl "http://localhost:9000/admin/pincode-pricing-v2/template?pincodes=110001,110002,400001" \
     -H "Authorization: Bearer TOKEN"
   ```

2. **Default pincodes:** If not specified, uses sample pincodes:
   ```
   110001, 110002, 110003, 400001, 400002, 560001
   ```

---

## 🔴 Database Issues

### Issue 11: "Region not found"

**Symptom:**

```json
{
  "error": "PINCODE_NOT_FOUND",
  "message": "No region found for pincode 110001"
}
```

**Solutions:**

1. **Create price first:**

   ```bash
   curl -X POST http://localhost:9000/admin/pincode-pricing-v2/products/prod_123/prices \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"pincode":"110001","price":299900}'
   ```

2. **Check existing regions:**

   ```bash
   curl http://localhost:9000/admin/regions \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Regions are created automatically** when updating prices

---

### Issue 12: Price not updating

**Symptom:** Price update succeeds but price doesn't change

**Solutions:**

1. **Clear cache:**

   ```bash
   # Restart Medusa server
   npm run dev
   ```

2. **Check price set:**

   ```bash
   curl http://localhost:9000/admin/products/prod_123 \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Verify region association:**

   - Price must be linked to region
   - Price rule must exist

4. **Check using Store API:**
   ```bash
   curl "http://localhost:9000/store/pincode-pricing/product/prod_123?pincode=110001"
   ```

---

## 🔴 TypeScript Issues

### Issue 13: Compile errors in admin routes

**Symptom:** TypeScript errors when running dev server

**Solutions:**

1. **These are expected:** Some Medusa APIs have incomplete type definitions

2. **Code works at runtime:** Type errors don't affect functionality

3. **To suppress errors temporarily:**

   ```typescript
   // @ts-ignore
   const result = await service.someMethod();
   ```

4. **Wait for Medusa updates:** Type definitions will improve over time

---

## 🔴 Excel Upload Issues

### Issue 14: Excel file not parsing

**Symptom:** Excel upload fails but CSV works

**Solutions:**

1. **Ensure XLSX library installed:**

   ```bash
   npm install xlsx
   ```

2. **Check file extension:**

   - ✅ Supported: `.xlsx`, `.xls`
   - ❌ Not supported: `.xlsm`, `.xlsb`

3. **Try CSV instead:**

   - Save as CSV from Excel
   - Upload CSV format

4. **Check Excel structure:**
   - First sheet is used
   - Same format as CSV:
     ```
     SKU | 110001 | 110002 | 110003
     product-1 | 2999 | 3199 | 2899
     ```

---

## 🔴 Performance Issues

### Issue 15: Slow CSV upload

**Symptom:** Large CSV files take too long to process

**Solutions:**

1. **Split large files:**

   ```bash
   # Split into 100-row chunks
   split -l 100 large-file.csv chunk-
   ```

2. **Upload in batches:**

   - Upload 100-200 products at a time
   - Wait for each batch to complete

3. **Optimize CSV:**

   - Remove empty rows
   - Remove unnecessary columns

4. **Use queue for large uploads** (future enhancement)

---

## 🔴 Testing Issues

### Issue 16: Tests failing

**Symptom:** Test suite fails with errors

**Solutions:**

1. **Set environment variables:**

   ```bash
   export MEDUSA_BACKEND_URL="http://localhost:9000"
   export ADMIN_EMAIL="admin@medusa-test.com"
   export ADMIN_PASSWORD="supersecret"
   ```

2. **Ensure server is running:**

   ```bash
   npm run dev
   ```

3. **Create test products:**

   ```bash
   # At least one product should exist
   curl http://localhost:9000/store/products
   ```

4. **Check admin credentials:**
   ```bash
   # Verify admin can login
   curl -X POST http://localhost:9000/admin/auth/session \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@medusa-test.com","password":"supersecret"}'
   ```

---

## 📋 Debug Checklist

When encountering issues, check:

- [ ] Server is running (`npm run dev`)
- [ ] Admin is authenticated
- [ ] Product exists
- [ ] Pincode is 6 digits
- [ ] Price is in cents (positive number)
- [ ] CSV format is correct
- [ ] File is base64 encoded properly
- [ ] Authorization header is included
- [ ] Environment variables are set

---

## 🛠️ Debugging Tools

### Enable Dev Mode

Show detailed error messages:

```bash
export NODE_ENV="development"
npm run dev
```

### Check Logs

```bash
# View Medusa logs
tail -f .medusa/server.log
```

### Test Single Endpoint

```bash
# Test pricing overview
curl http://localhost:9000/admin/pincode-pricing-v2/products/prod_123 \
  -H "Authorization: Bearer TOKEN" \
  -v  # Verbose mode
```

### Inspect Database

```sql
-- Check regions
SELECT * FROM region WHERE name LIKE 'pincode-%';

-- Check prices
SELECT * FROM price WHERE region_id = 'reg_123';

-- Check price rules
SELECT * FROM price_rule WHERE price_id = 'price_456';
```

---

## 📞 Getting Help

If issues persist:

1. **Check Documentation:**

   - [Admin API Documentation](./ADMIN_API_DOCUMENTATION_V2.md)
   - [Week 2 Summary](./WEEK_2_SUMMARY.md)

2. **Run Tests:**

   ```bash
   npx tsx src/scripts/test-admin-api-routes.ts
   ```

3. **Enable Verbose Logging:**

   ```bash
   export DEBUG=medusa:*
   npm run dev
   ```

4. **Check Medusa Version:**
   ```bash
   npm list @medusajs/medusa
   ```

---

**Last Updated:** Week 2, Day 6  
**Version:** 2.0 (Medusa Native Pricing)
