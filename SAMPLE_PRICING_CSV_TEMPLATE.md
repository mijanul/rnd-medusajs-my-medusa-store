# Sample CSV Template for Pincode Pricing

## File Format

This file shows the CSV format for uploading product prices based on pincodes and dealers.

## Column Definitions

- **sku**: Product variant SKU (for reference)
- **variant_id**: Medusa variant ID (required)
- **product_title**: Product name (for reference only)
- **variant_title**: Variant name (for reference only)
- **pincode**: 6-digit Indian pincode (required)
- **dealer_code**: Dealer code matching database (required)
- **dealer_name**: Dealer name (for reference only)
- **price_inr**: Price in Indian Rupees (required)

## Sample Data

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","110002","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","110016","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","400002","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-S-BLACK","var_01ABC123","T-Shirt","S / Black","560001","DEALER_BANGALORE","Bangalore Store","529.00"
"SHIRT-S-WHITE","var_01ABC124","T-Shirt","S / White","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S-WHITE","var_01ABC124","T-Shirt","S / White","400001","DEALER_MUMBAI","Mumbai Warehouse","549.00"
"SHIRT-M-BLACK","var_01ABC125","T-Shirt","M / Black","110001","DEALER_DELHI","Delhi Distributor","599.00"
"SHIRT-M-BLACK","var_01ABC125","T-Shirt","M / Black","400001","DEALER_MUMBAI","Mumbai Warehouse","649.00"
"SHIRT-M-WHITE","var_01ABC126","T-Shirt","M / White","110001","DEALER_DELHI","Delhi Distributor","599.00"
"SHIRT-M-WHITE","var_01ABC126","T-Shirt","M / White","400001","DEALER_MUMBAI","Mumbai Warehouse","649.00"
```

## Example: Multiple Dealers for Same Pincode

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_01ABC123","T-Shirt","Small","400001","DEALER_MUMBAI","Mumbai Warehouse","499.00"
"SHIRT-S","var_01ABC123","T-Shirt","Small","400001","DEALER_PUNE","Pune Distributor","529.00"
```

**Result:** Customer in 400001 will see ₹499 (lower price from Mumbai Warehouse)

## Example: Zone-Based Pricing

```csv
sku,variant_id,product_title,variant_title,pincode,dealer_code,dealer_name,price_inr
"SHIRT-S","var_01ABC123","T-Shirt","Small","110001","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_01ABC123","T-Shirt","Small","110002","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_01ABC123","T-Shirt","Small","110016","DEALER_DELHI","Delhi Distributor","499.00"
"SHIRT-S","var_01ABC123","T-Shirt","Small","201001","DEALER_NOIDA","Noida Branch","549.00"
"SHIRT-S","var_01ABC123","T-Shirt","Small","201002","DEALER_NOIDA","Noida Branch","549.00"
```

**Pricing Strategy:**

- Delhi pincodes (110xxx): ₹499
- Noida pincodes (201xxx): ₹549

## Rules

1. **Pincode**: Must be exactly 6 digits
2. **Price**: Decimal number (499.00, 1299.50)
3. **Empty Rows**: Leave `price_inr` empty to skip
4. **Dealer Code**: Must exist in dealer table
5. **Variant ID**: Must exist in product_variant table

## How to Use

### Step 1: Download Template

```bash
curl "http://localhost:9000/admin/pincode-pricing/template" > template.csv
```

### Step 2: Fill Prices

Open in Excel/Google Sheets and fill the `price_inr` column

### Step 3: Upload

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/upload \
  -H "Content-Type: application/json" \
  -d '{"csv_data": "...your csv content..."}'
```

## Tips

- Start with major cities (110001, 400001, 560001, 600001)
- Use same price for all pincodes in a city
- Leave unsupported pincodes empty
- Update prices monthly/quarterly
- Keep master CSV file for your records

## Dealer Codes (from seed data)

- `DEALER_MUMBAI` - Mumbai Warehouse
- `DEALER_DELHI` - Delhi Distributor
- `DEALER_BANGALORE` - Bangalore Store
- `DEALER_CHENNAI` - Chennai Supplier

## Sample Pincodes (from seed data)

**Delhi:**

- 110001, 110002, 110016, 110096

**Mumbai:**

- 400001, 400002, 400051, 400101

**Bangalore:**

- 560001, 560002, 560100

**Chennai:**

- 600001, 600002, 600017

---

**Need more pincodes?** Add them via:

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/pincode-dealers \
  -H "Content-Type: application/json" \
  -d '{"pincode":"110099","dealer_id":"dealer_xxx","delivery_days":2,...}'
```
