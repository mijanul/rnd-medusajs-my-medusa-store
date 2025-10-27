# 🇮🇳 Pincode-Based Pricing System

## Overview

This system allows you to manage product pricing based on **Indian pincodes** with **multiple dealers**. Admin creates products WITHOUT prices, then uploads pricing via CSV templates.

---

## ✨ Key Features

✅ **Products without prices** - Create products in admin, add prices later via CSV  
✅ **CSV-based pricing** - Download template → Fill prices → Upload  
✅ **Multiple dealers** - Different dealers serve different pincodes  
✅ **Dealer-specific delivery** - Each dealer has unique delivery time  
✅ **INR only** - Single currency (Indian Rupees)  
✅ **Scalable** - Start with 100 pincodes, grow to thousands  
✅ **Automatic best price** - System picks lowest price/fastest delivery

---

## 📚 Documentation

| Document                                                             | Purpose                          | Start Here?  |
| -------------------------------------------------------------------- | -------------------------------- | ------------ |
| **[PINCODE_PRICING_QUICK_START.md](PINCODE_PRICING_QUICK_START.md)** | Quick commands & setup checklist | ⭐ YES       |
| **[PINCODE_PRICING_GUIDE.md](PINCODE_PRICING_GUIDE.md)**             | Complete implementation guide    | For details  |
| **[SAMPLE_PRICING_CSV_TEMPLATE.md](SAMPLE_PRICING_CSV_TEMPLATE.md)** | CSV format & examples            | For CSV help |
| This README                                                          | Overview & quick reference       | You are here |

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Build & migrate
npm run build
npx medusa migrations run

# 2. Seed data
npm run seed
npx medusa exec ./src/scripts/seed-pincode-pricing.ts

# 3. Start server
npm run dev

# 4. Test
curl "http://localhost:9000/admin/pincode-pricing/dealers"
curl "http://localhost:9000/store/pincode-check?code=110001"
```

**Done!** Your system is ready. Now follow the [Quick Start Guide](PINCODE_PRICING_QUICK_START.md).

---

## 🏗️ Architecture

### Database Tables

1. **`dealer`** - Stores dealer information
2. **`pincode_dealer`** - Maps pincodes to dealers with delivery info
3. **`product_pincode_price`** - Stores prices per variant-pincode-dealer

### Key Concepts

**Dealer**: Supplier/warehouse that fulfills orders

```
Example: Mumbai Warehouse, Delhi Distributor
```

**Pincode Mapping**: Links pincode to dealer with delivery details

```
110001 → Delhi Distributor (2 days, COD available)
400001 → Mumbai Warehouse (2 days, COD available)
```

**Product Price**: Price for specific product variant in specific pincode

```
T-Shirt (Small) in 110001 = ₹499
T-Shirt (Small) in 400001 = ₹549
```

---

## 🔄 Complete Workflow

### Admin Side

```
1. Create Dealers
   ↓
2. Map Pincodes to Dealers
   ↓
3. Create Products (WITHOUT prices)
   ↓
4. Download CSV Template
   ↓
5. Fill Prices in Excel/Google Sheets
   ↓
6. Upload Completed CSV
   ↓
✅ Pricing Active!
```

### Customer Side

```
1. Customer visits product page
   ↓
2. Enters pincode (e.g., 110001)
   ↓
3. System checks: "Serviceable? ✅"
   ↓
4. Shows price: "₹499"
   ↓
5. Shows delivery: "Delivers in 2 days"
   ↓
6. Shows COD: "COD Available"
   ↓
7. Customer adds to cart
   ↓
✅ Checkout with pincode-based price
```

---

## 📊 CSV Template Example

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_123","T-Shirt","Small","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_123","T-Shirt","Small","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-M","var_124","T-Shirt","Medium","110001","DEALER_DELHI","Delhi Distributor","599.00"
```

**How it works:**

1. Download template from API
2. Template has all variants × all pincodes × all dealers
3. Fill `price_inr` column (leave empty for unsupported)
4. Upload completed CSV
5. System creates/updates prices in database

---

## 🌐 API Endpoints

### Admin APIs

| Endpoint                                 | Method   | Purpose               |
| ---------------------------------------- | -------- | --------------------- |
| `/admin/pincode-pricing/template`        | GET      | Download CSV template |
| `/admin/pincode-pricing/upload`          | POST     | Upload pricing CSV    |
| `/admin/pincode-pricing/dealers`         | GET/POST | Manage dealers        |
| `/admin/pincode-pricing/pincode-dealers` | GET/POST | Map pincodes          |

### Store APIs (Customer-facing)

| Endpoint                                                    | Method | Purpose              |
| ----------------------------------------------------------- | ------ | -------------------- |
| `/store/pincode-check?code=110001`                          | GET    | Check serviceability |
| `/store/products/{variant_id}/pincode-price?pincode=110001` | GET    | Get price            |

---

## 🎯 Use Cases

### Use Case 1: Uniform Pricing

Same price everywhere

```
Delhi: ₹499
Mumbai: ₹499
Bangalore: ₹499
```

### Use Case 2: City-Based Pricing

Different price per city

```
Delhi: ₹499
Mumbai: ₹549
Bangalore: ₹529
```

### Use Case 3: Dealer Competition

Multiple dealers, best price wins

```
400001:
  - DEALER_MUMBAI: ₹499 (2 days) ✅ Wins
  - DEALER_PUNE: ₹529 (3 days)
```

### Use Case 4: Limited Coverage

Only serve specific pincodes

```
Serviceable: 110001, 110002, 400001 ✅
Not serviceable: 123456 ❌
```

---

## 💡 Pricing Strategies

### Strategy 1: Metro Pricing

```csv
pincode,price_inr
"110001","499.00"  # Delhi
"400001","499.00"  # Mumbai
"560001","499.00"  # Bangalore
```

### Strategy 2: Distance-Based

```csv
pincode,dealer_code,price_inr
"400001","DEALER_MUMBAI","499.00"  # Local
"201001","DEALER_MUMBAI","549.00"  # Near
"302001","DEALER_MUMBAI","599.00"  # Far
```

### Strategy 3: Dealer-Specific

```csv
pincode,dealer_code,price_inr
"110001","DEALER_DELHI","499.00"
"110001","DEALER_NOIDA","529.00"
# Customer gets ₹499 (lowest)
```

---

## 🧪 Testing

### 1. Check Dealers

```bash
curl http://localhost:9000/admin/pincode-pricing/dealers
```

### 2. Check Pincode Serviceability

```bash
curl "http://localhost:9000/store/pincode-check?code=110001"
```

Expected response:

```json
{
  "pincode": "110001",
  "is_serviceable": true,
  "delivery_days": 2,
  "is_cod_available": true,
  "dealer_name": "Delhi Distributor"
}
```

### 3. Get Product Price

```bash
curl "http://localhost:9000/store/products/var_xxx/pincode-price?pincode=110001"
```

Expected response:

```json
{
  "variant_id": "var_xxx",
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

## 📈 Scaling

### Start Small

```
4 dealers
50-100 pincodes
20-50 products
= ~5,000-20,000 price records
```

### Grow Medium

```
10 dealers
500 pincodes
100 products
= ~50,000 price records
```

### Scale Large

```
50 dealers
5,000 pincodes
500 products
= ~2,500,000 price records
```

**Performance tips:**

- Index pincode columns
- Cache popular pincodes
- Batch CSV uploads
- Use database replicas

---

## ⚠️ Important Notes

### 1. Currency

- **Only INR supported**
- Prices stored in paise (smallest unit)
- Display shows rupees (divide by 100)

### 2. Pincode Format

- **Must be exactly 6 digits**
- Example: `110001`, `400001`
- No spaces, no dashes

### 3. Product Creation

- Create products normally in admin
- **Skip pricing** or set dummy price
- Real prices come from CSV

### 4. CSV Upload

- Download fresh template each time
- Fill only `price_inr` column
- Leave empty for unsupported pincodes
- Upload will skip empty prices

### 5. Multiple Dealers

- Same pincode can have multiple dealers
- System picks best (lowest price OR fastest delivery)
- Priority field determines preference

---

## 🔧 Files Changed

### Configuration

✅ `medusa-config.ts` - Added pincode-pricing module

### Seed Data

✅ `src/scripts/seed.ts` - Changed to India only, INR only  
✅ `src/scripts/seed-pincode-pricing.ts` - Seed dealers & pincodes

### Module

✅ `src/modules/pincode-pricing/` - Complete module with models & service

### API Routes

✅ `src/api/admin/pincode-pricing/` - Admin endpoints  
✅ `src/api/store/pincode-check/` - Customer endpoints  
✅ `src/api/store/products/[variant_id]/pincode-price/` - Price lookup

---

## 🆘 Troubleshooting

### Issue: Module not found

```bash
npm run build
```

### Issue: Tables not created

```bash
npx medusa migrations run
```

### Issue: No dealers

```bash
npx medusa exec ./src/scripts/seed-pincode-pricing.ts
```

### Issue: Pincode not serviceable

Add pincode mapping:

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -d '{"pincode":"110001","dealer_id":"dealer_xxx","delivery_days":2}'
```

### Issue: No price found

Upload pricing CSV with that variant-pincode combination

---

## 📞 Next Steps

1. ✅ Read [PINCODE_PRICING_QUICK_START.md](PINCODE_PRICING_QUICK_START.md)
2. ✅ Run setup commands
3. ✅ Create your first dealer
4. ✅ Map some pincodes
5. ✅ Create a test product
6. ✅ Download CSV template
7. ✅ Fill and upload prices
8. ✅ Test on storefront

---

## 📚 Additional Resources

- [Full Implementation Guide](PINCODE_PRICING_GUIDE.md)
- [CSV Template Examples](SAMPLE_PRICING_CSV_TEMPLATE.md)
- [Medusa Documentation](https://docs.medusajs.com)

---

## ✅ Summary

Your Medusa store now supports:

- ✅ Pincode-based pricing for India
- ✅ Multiple dealers with different delivery times
- ✅ CSV-based price management
- ✅ Products without prices in admin
- ✅ INR-only pricing
- ✅ Scalable architecture

**You're all set! Happy selling! 🎉**
