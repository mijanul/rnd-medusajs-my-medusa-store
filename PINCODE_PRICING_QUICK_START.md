# 🚀 Quick Start - Pincode Pricing System

## ⚡ Quick Commands

```bash
# 1. Build & Setup
npm run build
npx medusa migrations run
npm run seed
npx medusa exec ./src/scripts/seed-pincode-pricing.ts

# 2. Start server
npm run dev

# 3. Test APIs
curl "http://localhost:9000/admin/pincode-pricing/dealers"
curl "http://localhost:9000/store/pincode-check?code=110001"
```

---

## 📋 Setup Checklist

### Step 1: Database Setup

- [ ] Run `npm run build`
- [ ] Run `npx medusa migrations run`
- [ ] Run `npm run seed`
- [ ] Run `npx medusa exec ./src/scripts/seed-pincode-pricing.ts`
- [ ] Verify tables created: `dealer`, `pincode_dealer`, `product_pincode_price`

### Step 2: Create Dealers

- [ ] POST /admin/pincode-pricing/dealers
- [ ] Create 2-4 dealers minimum
- [ ] Note down dealer codes

### Step 3: Map Pincodes

- [ ] POST /admin/pincode-pricing/pincode-dealers
- [ ] Map 20-50 pincodes to start
- [ ] Set delivery days and COD availability

### Step 4: Create Products

- [ ] Create products in admin
- [ ] Add variants (size, color, etc.)
- [ ] **DO NOT** set prices (or set dummy prices)
- [ ] Note down SKUs

### Step 5: Download Template

- [ ] GET /admin/pincode-pricing/template
- [ ] Save CSV file
- [ ] Open in Excel/Google Sheets

### Step 6: Fill Prices

- [ ] Fill `price_inr` column
- [ ] Leave empty for unsupported combinations
- [ ] Validate pincode format (6 digits)
- [ ] Save CSV

### Step 7: Upload CSV

- [ ] POST /admin/pincode-pricing/upload
- [ ] Check success/failure count
- [ ] Fix errors if any
- [ ] Re-upload corrected data

### Step 8: Test

- [ ] GET /store/pincode-check?code=110001
- [ ] GET /store/products/{variant_id}/pincode-price?pincode=110001
- [ ] Verify prices showing correctly
- [ ] Check delivery estimates

---

## 🗂️ File Structure Created

```
src/
├── modules/
│   └── pincode-pricing/
│       ├── index.ts                 ✅ Module registration
│       ├── service.ts               ✅ Business logic
│       └── models/
│           ├── dealer.ts            ✅ Dealer model
│           ├── pincode-dealer.ts    ✅ Pincode mapping
│           └── product-pincode-price.ts ✅ Pricing model
│
├── api/
│   ├── admin/
│   │   └── pincode-pricing/
│   │       ├── template/route.ts    ✅ Download CSV
│   │       ├── upload/route.ts      ✅ Upload CSV
│   │       ├── dealers/route.ts     ✅ Manage dealers
│   │       └── pincode-dealers/route.ts ✅ Map pincodes
│   │
│   └── store/
│       ├── pincode-check/route.ts   ✅ Check pincode
│       └── products/[variant_id]/
│           └── pincode-price/route.ts ✅ Get price
│
└── scripts/
    └── seed-pincode-pricing.ts      ✅ Seed data
```

---

## 📊 Database Tables

### dealer

```sql
CREATE TABLE dealer (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### pincode_dealer

```sql
CREATE TABLE pincode_dealer (
  id VARCHAR(255) PRIMARY KEY,
  pincode VARCHAR(6) NOT NULL,
  dealer_id VARCHAR(255) REFERENCES dealer(id),
  delivery_days INT DEFAULT 3,
  is_serviceable BOOLEAN DEFAULT true,
  is_cod_available BOOLEAN DEFAULT true,
  priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### product_pincode_price

```sql
CREATE TABLE product_pincode_price (
  id VARCHAR(255) PRIMARY KEY,
  variant_id VARCHAR(255) NOT NULL,
  sku VARCHAR(255),
  pincode VARCHAR(6) NOT NULL,
  dealer_id VARCHAR(255) REFERENCES dealer(id),
  price BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Quick Reference

### Admin APIs

| Method | Endpoint                                         | Purpose                       |
| ------ | ------------------------------------------------ | ----------------------------- |
| GET    | `/admin/pincode-pricing/template`                | Download CSV template         |
| GET    | `/admin/pincode-pricing/template?product_id=xxx` | Download for specific product |
| POST   | `/admin/pincode-pricing/upload`                  | Upload pricing CSV            |
| GET    | `/admin/pincode-pricing/dealers`                 | List all dealers              |
| POST   | `/admin/pincode-pricing/dealers`                 | Create dealer                 |
| GET    | `/admin/pincode-pricing/pincode-dealers`         | List pincode mappings         |
| POST   | `/admin/pincode-pricing/pincode-dealers`         | Create pincode mapping        |

### Store APIs

| Method | Endpoint                                                    | Purpose              |
| ------ | ----------------------------------------------------------- | -------------------- |
| GET    | `/store/pincode-check?code=110001`                          | Check serviceability |
| GET    | `/store/products/{variant_id}/pincode-price?pincode=110001` | Get price            |

---

## 📝 Sample Requests

### Create Dealer

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mumbai Warehouse",
    "code": "DEALER_MUMBAI",
    "contact_name": "Rajesh Kumar",
    "contact_email": "rajesh@example.com",
    "contact_phone": "+91-98765-43210",
    "is_active": true
  }'
```

### Map Pincode to Dealer

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "400001",
    "dealer_id": "dealer_01ABC...",
    "delivery_days": 2,
    "is_serviceable": true,
    "is_cod_available": true,
    "priority": 1
  }'
```

### Check Pincode

```bash
curl "http://localhost:9000/store/pincode-check?code=110001"
```

Response:

```json
{
  "pincode": "110001",
  "is_serviceable": true,
  "delivery_days": 2,
  "is_cod_available": true,
  "dealer_name": "Delhi Distributor",
  "alternative_dealers": 0
}
```

### Get Product Price

```bash
curl "http://localhost:9000/store/products/var_01ABC.../pincode-price?pincode=110001"
```

Response:

```json
{
  "variant_id": "var_01ABC...",
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

## 📄 CSV Template Format

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_123","T-Shirt","Small","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_123","T-Shirt","Small","110002","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_123","T-Shirt","Small","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-M","var_124","T-Shirt","Medium","110001","DEALER_DELHI","Delhi Distributor","599.00"
```

**Important:**

- `price_inr`: Price in rupees (e.g., 499.00)
- Leave empty to skip that combination
- 6-digit pincode only
- Dealer code must exist

---

## 🎯 Common Use Cases

### Use Case 1: Same Price Everywhere

```csv
sku,pincode,dealer_code,price_inr
"SHIRT-S","110001","DEALER_DELHI","499.00"
"SHIRT-S","400001","DEALER_MUMBAI","499.00"
"SHIRT-S","560001","DEALER_BANGALORE","499.00"
```

### Use Case 2: Different Prices by City

```csv
sku,pincode,dealer_code,price_inr
"SHIRT-S","110001","DEALER_DELHI","499.00"
"SHIRT-S","400001","DEALER_MUMBAI","549.00"
"SHIRT-S","560001","DEALER_BANGALORE","529.00"
```

### Use Case 3: Multiple Dealers, Same Pincode

```csv
sku,pincode,dealer_code,price_inr
"SHIRT-S","400001","DEALER_MUMBAI","499.00"
"SHIRT-S","400001","DEALER_PUNE","529.00"
```

→ Customer gets DEALER_MUMBAI (lower price)

---

## ⚠️ Troubleshooting

### Module not found error

```bash
npm run build
```

### Tables not created

```bash
npx medusa migrations generate
npx medusa migrations run
```

### Dealers not seeded

```bash
npx medusa exec ./src/scripts/seed-pincode-pricing.ts
```

### CSV upload fails

- Check dealer codes exist
- Validate pincode format (6 digits)
- Ensure variant_id exists
- Check price format (decimal number)

### No price returned

- Verify pincode is mapped to dealer
- Check product_pincode_price table has data
- Ensure is_active = true

---

## 📈 Scaling Tips

### Start Small

- 4 dealers
- 50-100 pincodes
- 20-50 products

### Grow Gradually

- Add dealers as you expand
- Map new pincodes monthly
- Update prices quarterly

### Performance

- Add indexes on pincode, variant_id
- Cache popular pincodes
- Use CDN for CSV templates

---

## ✅ Verification Steps

```bash
# 1. Check tables exist
psql your_database -c "\dt dealer"
psql your_database -c "\dt pincode_dealer"
psql your_database -c "\dt product_pincode_price"

# 2. Check dealers seeded
curl http://localhost:9000/admin/pincode-pricing/dealers

# 3. Check pincode mappings
curl http://localhost:9000/admin/pincode-pricing/pincode-dealers

# 4. Test pincode check
curl "http://localhost:9000/store/pincode-check?code=110001"

# 5. Download template
curl "http://localhost:9000/admin/pincode-pricing/template" > test.csv
cat test.csv

# 6. Check price (after upload)
curl "http://localhost:9000/store/products/YOUR_VARIANT_ID/pincode-price?pincode=110001"
```

---

## 🎉 You're Ready!

Your pincode pricing system is now set up and ready to use!

**Quick workflow:**

1. ✅ Create dealers
2. ✅ Map pincodes
3. ✅ Create products (no prices)
4. ✅ Download CSV template
5. ✅ Fill prices
6. ✅ Upload CSV
7. ✅ Test on storefront

**For full details, see:** `PINCODE_PRICING_GUIDE.md`
