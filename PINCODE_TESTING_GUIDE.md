# Pincode Pricing System - Testing Guide

## ✅ All TypeScript Errors Fixed!

The pincode pricing module is now ready to test. All import and type errors have been resolved.

## Quick Start Commands

### 1. Build the Project

```bash
npm run build
```

### 2. Run Database Migrations

This will create all the new tables (dealer, pincode_dealer, product_pincode_price):

```bash
npx medusa migrations run
```

### 3. Seed Demo Data

First run the standard seed to set up products with India/INR:

```bash
npm run seed
```

Then seed pincode pricing data (dealers and pincode mappings):

```bash
npx tsx src/scripts/seed-pincode-pricing.ts
```

### 4. Start Development Server

```bash
npm run dev
```

## API Endpoints to Test

### Admin Endpoints

#### 1. List All Dealers

```bash
curl http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 2. Create a New Dealer

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DEALER_KOLKATA",
    "name": "Kolkata Supplier",
    "city": "Kolkata",
    "state": "West Bengal",
    "contact_name": "Amit Roy",
    "contact_phone": "+91-9876543210",
    "contact_email": "amit@kolkata-supplier.com"
  }'
```

#### 3. Map Pincode to Dealer

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "700001",
    "dealer_id": "DEALER_ID_HERE",
    "delivery_days": 2,
    "is_cod_available": true
  }'
```

#### 4. Download CSV Template

This will include all your product variants:

```bash
curl http://localhost:9000/admin/pincode-pricing/template \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o template.csv
```

#### 5. Upload Pricing CSV

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csv_data": "sku,variant_id,pincode,dealer_code,price_inr\nSHIRT-001,variant_123,110001,DEALER_DELHI,2999\nSHIRT-001,variant_123,400001,DEALER_MUMBAI,3199"
  }'
```

### Store (Customer) Endpoints

#### 6. Check if Pincode is Serviceable

```bash
curl http://localhost:9000/store/pincode-check?pincode=110001
```

Expected response:

```json
{
  "serviceable": true,
  "dealers": [
    {
      "dealer_name": "Delhi Warehouse",
      "delivery_days": 2,
      "is_cod_available": true
    }
  ]
}
```

#### 7. Get Price for a Product Variant by Pincode

```bash
curl http://localhost:9000/store/products/variant_123/pincode-price?pincode=110001
```

Expected response:

```json
{
  "variant_id": "variant_123",
  "pincode": "110001",
  "price": 299900,
  "price_inr": 2999,
  "currency": "INR",
  "dealer": {
    "name": "Delhi Warehouse",
    "delivery_days": 2,
    "is_cod_available": true
  }
}
```

## Sample CSV Format

Create a file `sample-prices.csv`:

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLACK-M,var_01JHK...,110001,DEALER_DELHI,1999
TSHIRT-BLACK-M,var_01JHK...,110002,DEALER_DELHI,1999
TSHIRT-BLACK-M,var_01JHK...,400001,DEALER_MUMBAI,2099
TSHIRT-BLACK-L,var_01JHK...,110001,DEALER_DELHI,1999
TSHIRT-WHITE-M,var_01JHK...,560001,DEALER_BANGALORE,1899
```

## Testing Multiple Dealers for Same Pincode

The system handles multiple dealers per pincode. The `getBestPriceForPincode()` method returns the lowest price.

### Example: Two dealers in Bangalore serving pincode 560001

```bash
# Create first dealer
curl -X POST http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DEALER_BANGALORE_1",
    "name": "Bangalore Warehouse East",
    "city": "Bangalore"
  }'

# Create second dealer
curl -X POST http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DEALER_BANGALORE_2",
    "name": "Bangalore Warehouse West",
    "city": "Bangalore"
  }'

# Map same pincode to both dealers
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -d '{"pincode": "560001", "dealer_id": "dealer_1_id", "delivery_days": 2}'

curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -d '{"pincode": "560001", "dealer_id": "dealer_2_id", "delivery_days": 3}'
```

Upload pricing CSV with different prices:

```csv
sku,variant_id,pincode,dealer_code,price_inr
SHIRT-001,var_123,560001,DEALER_BANGALORE_1,2999
SHIRT-001,var_123,560001,DEALER_BANGALORE_2,2799
```

When customer checks: `GET /store/products/var_123/pincode-price?pincode=560001`

- System will return: price=2799 from DEALER_BANGALORE_2 (lowest price)

## How It Works

1. **Admin creates products** without prices in Medusa admin panel
2. **Admin downloads CSV template** with all product variants
3. **Admin fills in pricing** for each variant-pincode-dealer combination
4. **Admin uploads CSV** which populates `product_pincode_price` table
5. **Customer enters pincode** on storefront
6. **System checks serviceability** via `pincode_dealer` table
7. **System returns price** from `product_pincode_price` (lowest if multiple dealers)

## Database Tables

Three new tables are created:

1. **dealer** - Stores dealer/supplier information
2. **pincode_dealer** - Maps which dealers service which pincodes
3. **product_pincode_price** - Stores actual pricing per variant-pincode-dealer

## Troubleshooting

### Module not found error

Make sure you've run `npm run build` after creating the module.

### Database errors

Run migrations: `npx medusa migrations run`

### No prices returned

1. Check if pincode is mapped to a dealer
2. Check if pricing exists for that variant-pincode-dealer combo
3. Verify dealer is active (`is_active = true`)

### Multiple dealers showing

By design! The `getBestPriceForPincode()` returns the cheapest option.
To show all options, use `getPriceForPincode()` instead.

## Next Steps

1. Build the system: `npm run build`
2. Run migrations: `npx medusa migrations run`
3. Seed data: `npm run seed && npx tsx src/scripts/seed-pincode-pricing.ts`
4. Start server: `npm run dev`
5. Test APIs using curl or Postman

## Key Features ✅

- ✅ Products created without prices
- ✅ CSV template generation with all variants
- ✅ CSV upload for bulk pricing
- ✅ Multiple dealers per pincode support
- ✅ Automatic best price selection (lowest)
- ✅ Delivery days per dealer-pincode
- ✅ COD availability tracking
- ✅ India-only, INR-only setup
- ✅ Scalable to thousands of pincodes
