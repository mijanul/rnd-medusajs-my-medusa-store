# 🇮🇳 Pincode-Based Pricing System - Implementation Guide

## 📋 Overview

This system allows you to manage product pricing based on **Indian pincodes** and **multiple dealers**. Each dealer can serve different pincodes with different delivery times and prices.

---

## 🎯 Key Features

1. **Products without prices** - Create products in admin WITHOUT setting prices
2. **CSV-based pricing** - Download template, fill prices, upload
3. **Multiple dealers** - Different dealers serve different pincodes
4. **Dealer-specific delivery** - Each dealer has different delivery times
5. **INR only** - Single currency (Indian Rupees)
6. **Scalable** - Start with 100 pincodes, grow to thousands

---

## 🏗️ Architecture

### Database Tables

#### 1. `dealer`

Stores dealer/supplier information

```
- id (PK)
- name
- code (unique, e.g., "DEALER_MUMBAI")
- contact_name
- contact_email
- contact_phone
- address
- is_active
```

#### 2. `pincode_dealer`

Maps pincodes to dealers with delivery info

```
- id (PK)
- pincode (6 digits)
- dealer_id (FK → dealer)
- delivery_days
- is_serviceable
- is_cod_available
- priority (1 = highest)
```

#### 3. `product_pincode_price`

Stores product variant prices per pincode-dealer

```
- id (PK)
- variant_id (FK → product_variant)
- sku
- pincode
- dealer_id (FK → dealer)
- price (in paise)
- is_active
```

---

## 🚀 Setup Steps

### Step 1: Build and Migrate

```bash
# Build project
npm run build

# Run migrations (creates new tables)
npx medusa migrations run

# Seed initial data
npm run seed

# Seed dealers and pincode mappings
npx medusa exec ./src/scripts/seed-pincode-pricing.ts
```

### Step 2: Create Dealers (Admin)

**POST /admin/pincode-pricing/dealers**

```json
{
  "name": "Mumbai Warehouse",
  "code": "DEALER_MUMBAI",
  "contact_name": "Rajesh Kumar",
  "contact_email": "rajesh@example.com",
  "contact_phone": "+91-98765-43210",
  "address": "Andheri East, Mumbai",
  "is_active": true
}
```

### Step 3: Map Pincodes to Dealers

**POST /admin/pincode-pricing/pincode-dealers**

```json
{
  "pincode": "400001",
  "dealer_id": "dealer_xxx",
  "delivery_days": 2,
  "is_serviceable": true,
  "is_cod_available": true,
  "priority": 1
}
```

### Step 4: Create Products WITHOUT Prices

In admin panel, create products normally but **skip the pricing step** or set a dummy price. The actual prices will come from CSV.

### Step 5: Download CSV Template

**GET /admin/pincode-pricing/template**

Or with specific product:
**GET /admin/pincode-pricing/template?product_id=prod_xxx**

This downloads a CSV file like:

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_123","T-Shirt","Small","110001","DEALER_DELHI","Delhi Distributor",""
"SHIRT-S","var_123","T-Shirt","Small","400001","DEALER_MUMBAI","Mumbai Warehouse",""
"SHIRT-M","var_124","T-Shirt","Medium","110001","DEALER_DELHI","Delhi Distributor",""
```

### Step 6: Fill Prices in CSV

Open the CSV in Excel/Google Sheets and fill the `price_inr` column:

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_123","T-Shirt","Small","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_123","T-Shirt","Small","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-M","var_124","T-Shirt","Medium","110001","DEALER_DELHI","Delhi Distributor","599.00"
```

**Important:**

- Leave `price_inr` empty for pincodes you don't want to serve
- Prices are in rupees (will be converted to paise automatically)
- You can have different prices for same product in different pincodes
- Multiple dealers can serve same pincode with different prices

### Step 7: Upload CSV

**POST /admin/pincode-pricing/upload**

```json
{
  "csv_data": "sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr\n..."
}
```

Response:

```json
{
  "message": "Pricing data uploaded successfully",
  "results": {
    "success": 150,
    "failed": 2,
    "errors": ["Dealer DEALER_XYZ not found"]
  }
}
```

---

## 🌐 API Endpoints

### Admin Endpoints

#### Get CSV Template

```
GET /admin/pincode-pricing/template
GET /admin/pincode-pricing/template?product_id=prod_xxx
```

Downloads CSV template with all variants and pincodes.

#### Upload Pricing CSV

```
POST /admin/pincode-pricing/upload
Body: { "csv_data": "..." }
```

Bulk uploads pricing data from CSV.

#### Manage Dealers

```
GET /admin/pincode-pricing/dealers
POST /admin/pincode-pricing/dealers
Body: { name, code, contact_name, contact_email, ... }
```

#### Manage Pincode-Dealer Mappings

```
GET /admin/pincode-pricing/pincode-dealers
GET /admin/pincode-pricing/pincode-dealers?pincode=110001
GET /admin/pincode-pricing/pincode-dealers?dealer_id=dealer_xxx

POST /admin/pincode-pricing/pincode-dealers
Body: { pincode, dealer_id, delivery_days, ... }
```

### Store Endpoints (Customer-facing)

#### Check Pincode Serviceability

```
GET /store/pincode-check?code=110001
```

Response:

```json
{
  "pincode": "110001",
  "is_serviceable": true,
  "delivery_days": 2,
  "is_cod_available": true,
  "dealer_name": "Delhi Distributor",
  "alternative_dealers": 1
}
```

#### Get Product Price for Pincode

```
GET /store/products/{variant_id}/pincode-price?pincode=110001
```

Response:

```json
{
  "variant_id": "var_123",
  "pincode": "110001",
  "price": 499.0,
  "price_formatted": "₹499.00",
  "currency": "INR",
  "dealer": "Delhi Distributor",
  "delivery_days": 2,
  "is_cod_available": true
}
```

---

## 📝 CSV Template Format

### Column Descriptions

| Column          | Description              | Required | Example             |
| --------------- | ------------------------ | -------- | ------------------- |
| `sku`           | Product variant SKU      | Yes      | "SHIRT-S"           |
| `variant_id`    | Medusa variant ID        | Yes      | "var_01ABC..."      |
| `product_title` | Product name (reference) | No       | "T-Shirt"           |
| `variant_title` | Variant name (reference) | No       | "Small"             |
| `pincode`       | 6-digit Indian pincode   | Yes      | "110001"            |
| `dealer_code`   | Dealer code              | Yes      | "DEALER_DELHI"      |
| `dealer_name`   | Dealer name (reference)  | No       | "Delhi Distributor" |
| `price_inr`     | Price in rupees          | Yes      | "499.00"            |

### CSV Rules

1. **Pincode Format**: Must be exactly 6 digits
2. **Price Format**: Decimal number (499.00, 1299.50)
3. **Empty Prices**: Rows with empty `price_inr` are skipped
4. **Dealer Code**: Must match existing dealer
5. **Variant ID**: Must match existing product variant

### Example CSV

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S-BLACK","var_123","T-Shirt","S / Black","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-BLACK","var_123","T-Shirt","S / Black","110002","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-BLACK","var_123","T-Shirt","S / Black","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-M-BLACK","var_124","T-Shirt","M / Black","110001","DEALER_DELHI","Delhi Distributor","599.00"
"SHIRT-M-BLACK","var_124","T-Shirt","M / Black","400001","DEALER_MUMBAI","Mumbai Warehouse","649.00"
```

---

## 🎯 Workflow Example

### Admin Workflow

1. **Setup Dealers**

   - Create dealers via API or admin UI
   - Example: Mumbai Warehouse, Delhi Distributor

2. **Map Pincodes**

   - Map each pincode to one or more dealers
   - Set delivery days and COD availability
   - Example: 400001 → Mumbai Warehouse (2 days, COD)

3. **Create Products**

   - Create products in admin WITHOUT prices
   - Add all details: title, description, images, variants
   - Skip pricing step

4. **Download Template**

   - GET /admin/pincode-pricing/template
   - Receives CSV with all variants × all pincodes × all dealers

5. **Fill Prices**

   - Open CSV in Excel/Google Sheets
   - Fill `price_inr` column for applicable combinations
   - Leave empty for unsupported pincode-product combinations

6. **Upload CSV**
   - POST /admin/pincode-pricing/upload
   - System imports prices in bulk
   - Get success/error report

### Customer Workflow

1. **Customer visits product page**

2. **Enters pincode** (e.g., 110001)

   - GET /store/pincode-check?code=110001
   - System shows: "Delivers in 2 days, COD available"

3. **Views product**

   - GET /store/products/var_123/pincode-price?pincode=110001
   - System shows: "₹499.00"

4. **Adds to cart** with pincode-based pricing

5. **Proceeds to checkout**
   - Price locked for their pincode
   - Delivery estimate shown
   - COD option available/unavailable

---

## 🔄 Multiple Dealers Example

### Scenario: Same pincode served by 2 dealers

```csv
sku,variant_id,pincode,dealer_code,price_inr
"SHIRT-S","var_123","400001","DEALER_MUMBAI","499.00"
"SHIRT-S","var_123","400001","DEALER_PUNE","529.00"
```

**Pincode-Dealer Mapping:**

```
400001 → DEALER_MUMBAI (delivery: 2 days, priority: 1)
400001 → DEALER_PUNE (delivery: 3 days, priority: 2)
```

**Customer enters 400001:**

- System finds both dealers
- Chooses DEALER_MUMBAI (lower price: ₹499, faster delivery: 2 days)
- Customer sees: "₹499.00, Delivers in 2 days"

---

## 💡 Best Practices

### 1. Pricing Strategy

**Option A: Uniform Pricing**

```
All pincodes = Same price
Example: ₹499 everywhere
```

**Option B: Zone-Based Pricing**

```
Metro cities (Mumbai, Delhi) = ₹499
Tier 1 cities = ₹549
Tier 2 cities = ₹599
```

**Option C: Dealer-Based Pricing**

```
Each dealer sets their own price
System picks lowest for customer
```

### 2. Pincode Management

- Start with major cities (100 pincodes)
- Gradually expand to more areas
- Track demand from unsupported pincodes
- Add new pincodes monthly

### 3. Dealer Management

- Assign pincodes based on dealer location
- Set realistic delivery estimates
- Monitor dealer performance
- Adjust priorities based on performance

### 4. CSV Updates

- Download fresh template for each update
- Update only changed prices
- Keep master CSV file for reference
- Version control your pricing CSVs

---

## 🧪 Testing

### Test Checklist

```bash
# 1. Create dealers
curl -X POST http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Dealer","code":"DEALER_TEST",...}'

# 2. Map pincodes
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -H "Content-Type: application/json" \
  -d '{"pincode":"110001","dealer_id":"dealer_xxx",...}'

# 3. Check pincode
curl "http://localhost:9000/store/pincode-check?code=110001"

# 4. Download template
curl "http://localhost:9000/admin/pincode-pricing/template" > template.csv

# 5. Upload prices (after filling CSV)
curl -X POST http://localhost:9000/admin/pincode-pricing/upload \
  -H "Content-Type: application/json" \
  -d '{"csv_data":"..."}'

# 6. Get product price
curl "http://localhost:9000/store/products/var_xxx/pincode-price?pincode=110001"
```

---

## 🚨 Common Issues

### Issue: "Dealer not found"

**Cause:** Dealer code in CSV doesn't match database
**Fix:** Check dealer codes: `GET /admin/pincode-pricing/dealers`

### Issue: "Pincode not serviceable"

**Cause:** Pincode not mapped to any dealer
**Fix:** Add mapping: `POST /admin/pincode-pricing/pincode-dealers`

### Issue: "No price found"

**Cause:** Price not uploaded for that variant-pincode combination
**Fix:** Upload CSV with pricing data

### Issue: "Invalid pincode format"

**Cause:** Pincode is not 6 digits
**Fix:** Ensure pincode is exactly 6 digits (e.g., 110001, not 11001)

---

## 📊 Scaling Considerations

### Starting Small (100 pincodes)

```
- 4 dealers
- 100 pincodes
- 50 products × 4 variants = 200 variants
- Total prices: 200 × 100 = 20,000 price records
```

### Growing Larger (1000 pincodes)

```
- 20 dealers
- 1000 pincodes
- 200 products × 5 variants = 1000 variants
- Total prices: 1000 × 1000 = 1,000,000 price records
```

### Database Optimization

- Index on `pincode` column
- Index on `variant_id` column
- Index on `dealer_id` column
- Consider caching popular pincodes

---

## 🎉 Summary

Your system is now set up for:
✅ Products without prices in admin  
✅ CSV-based pricing upload  
✅ Multiple dealers per pincode  
✅ Dealer-specific delivery times  
✅ INR-only pricing  
✅ Scalable to thousands of pincodes

**Next Steps:**

1. Run migrations and seed data
2. Create your first dealer
3. Map some pincodes
4. Create a test product
5. Download CSV template
6. Upload pricing data
7. Test on storefront

---

**Need help?** Check the API endpoints and test each step individually!
