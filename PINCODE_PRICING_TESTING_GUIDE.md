# 🧪 Pincode Pricing - Testing Guide

## Quick Test Checklist

Use this guide to test your new pincode-based pricing system.

---

## 🎯 Pre-requisites

Before testing, ensure you have:

- ✅ Dev server running: `yarn dev`
- ✅ At least one dealer created
- ✅ Pincodes mapped to dealers
- ✅ At least one product with INR price

---

## 1️⃣ Test Admin Widget

### Access the Widget

1. Open browser: `http://localhost:9000/app`
2. Login to admin panel
3. Go to Products
4. Click on product: `prod_01K8N5JT03JVFG160G07ZMHBRE`
5. Scroll down to see **"Pincode-Based Pricing"** widget

### Expected Result

```
┌─────────────────────────────────────────────┐
│ Pincode-Based Pricing                       │
├─────────────────────────────────────────────┤
│ [Sync from Currency Price] [Manage via CSV] │
│                                             │
│ Total Pincodes: 150 | Total Prices: 300    │
│ Avg Price: ₹2,200.00                        │
│                                             │
│ Pincode | Dealer        | Price     | ...  │
│ 110001  | Delhi Dealer  | ₹2,200.00 | ...  │
│ 110002  | Delhi Dealer  | ₹2,200.00 | ...  │
│ ...                                         │
└─────────────────────────────────────────────┘
```

### Test Inline Editing

1. Click on any price (e.g., ₹2,200.00)
2. Input field appears
3. Change to 2500
4. Press Enter or click ✓
5. Price updates immediately

### Test Sync Button

1. Go to product pricing (standard Medusa UI)
2. Change INR price to ₹3,000
3. Go back to Pincode widget
4. Click **"Sync from Currency Price"**
5. All pincode prices update to ₹3,000

---

## 2️⃣ Test Store APIs

### Test 1: Check Pincode Serviceability

```bash
curl "http://localhost:9000/store/pincode-check?code=110001"
```

**Expected Response**:

```json
{
  "serviceable": true,
  "pincode": "110001",
  "dealers": [...],
  "message": "This pincode is serviceable"
}
```

**Test Invalid Pincode**:

```bash
curl "http://localhost:9000/store/pincode-check?code=999999"
```

**Expected**:

```json
{
  "serviceable": false,
  "pincode": "999999",
  "message": "Sorry, we don't serve this pincode yet"
}
```

### Test 2: Get Product Pincode Price

```bash
curl "http://localhost:9000/store/products/prod_01K8N5JT03JVFG160G07ZMHBRE/pincode-price?pincode=110001"
```

**Expected Response**:

```json
{
  "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
  "pincode": "110001",
  "price": 2200.0,
  "price_formatted": "₹2,200.00",
  "currency": "INR",
  "dealer": "Delhi Dealer",
  "delivery_days": 2,
  "is_cod_available": true
}
```

### Test 3: Add to Cart with Pincode

```bash
curl -X POST http://localhost:9000/store/cart/with-pincode \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
    "pincode": "110001",
    "quantity": 1
  }'
```

**Expected Response**:

```json
{
  "cart": {
    "id": "cart_xxxxx",
    "currency_code": "inr",
    "metadata": {
      "customer_pincode": "110001"
    },
    "items": [
      {
        "id": "item_xxxxx",
        "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
        "quantity": 1,
        "unit_price": 2200.0,
        "total": 2200.0,
        "metadata": {
          "pincode_price": 2200.0,
          "pincode": "110001",
          "dealer": "Delhi Dealer"
        }
      }
    ],
    "subtotal": 2200.0,
    "total": 2200.0
  },
  "pincode_info": {
    "pincode": "110001",
    "dealer": "Delhi Dealer",
    "delivery_days": 2,
    "is_cod_available": true
  }
}
```

**Save the cart_id for next tests!**

### Test 4: Add Another Item to Same Cart

```bash
# Replace cart_xxx with your cart_id from previous response
curl -X POST http://localhost:9000/store/cart/with-pincode \
  -H "Content-Type: application/json" \
  -d '{
    "cart_id": "cart_xxxxx",
    "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
    "pincode": "110001",
    "quantity": 2
  }'
```

**Expected**: Quantity updates to 3, subtotal = ₹6,600

---

## 3️⃣ Test Admin APIs

### Test 1: Get Product Prices

```bash
curl "http://localhost:9000/admin/pincode-pricing/prices?product_id=prod_01K8N5JT03JVFG160G07ZMHBRE" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Expected**:

```json
{
  "prices": [
    {
      "id": "price_xxx",
      "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
      "pincode": "110001",
      "dealer_id": "dealer_xxx",
      "price": 2200.00,
      "is_active": true,
      "dealer": {
        "id": "dealer_xxx",
        "name": "Delhi Dealer"
      }
    },
    ...
  ],
  "count": 300
}
```

### Test 2: Update a Price

```bash
# Replace price_xxx with actual price ID
curl -X PUT http://localhost:9000/admin/pincode-pricing/prices/price_xxx \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "price": 2500.00
  }'
```

**Expected**:

```json
{
  "success": true,
  "price": {
    "id": "price_xxx",
    "price": 2500.00,
    ...
  }
}
```

### Test 3: Sync Product Prices

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing/sync-product/prod_01K8N5JT03JVFG160G07ZMHBRE \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Expected**:

```json
{
  "success": true,
  "product_id": "prod_01K8N5JT03JVFG160G07ZMHBRE",
  "price_amount": 2200,
  "created": 50,
  "updated": 250,
  "errors": [],
  "pincodes_covered": 150,
  "dealers_count": 2
}
```

---

## 4️⃣ Test CSV Upload/Download

### Download Template

1. Go to: `http://localhost:9000/app/pincode-pricing`
2. Click **"Download Template"**
3. Open CSV in Excel/Google Sheets

**Expected Format**:

```csv
SKU,Product Name,110001,110002,400001,400002
TSHIRT-001,Red T-Shirt,2200,2200,2300,2300
```

### Upload Prices

1. Modify prices in CSV
2. Save as CSV
3. Upload via admin panel
4. Check if prices updated in widget

---

## 5️⃣ Test Product Deletion (CASCADE)

### Setup

```bash
# Create a test product via admin or API
# Note the product_id

# Sync prices for it
curl -X POST http://localhost:9000/admin/pincode-pricing/sync-product/prod_test_xxx \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Verify prices exist
curl "http://localhost:9000/admin/pincode-pricing/prices?product_id=prod_test_xxx" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Should show many prices
```

### Delete Product

```bash
# Delete the product via admin panel
# OR via API (if you have delete endpoint)

# Immediately check pincode prices
curl "http://localhost:9000/admin/pincode-pricing/prices?product_id=prod_test_xxx" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Expected**:

```json
{
  "prices": [],
  "count": 0
}
```

✅ **CASCADE delete worked!**

---

## 6️⃣ Test Edge Cases

### Test 1: Invalid Pincode Format

```bash
# Too short
curl "http://localhost:9000/store/pincode-check?code=1100"

# Too long
curl "http://localhost:9000/store/pincode-check?code=1100011"

# Non-numeric
curl "http://localhost:9000/store/pincode-check?code=ABCDEF"
```

**Expected**: Error message about invalid format

### Test 2: Product Not Available in Pincode

```bash
# Use a pincode with no dealer assigned
curl "http://localhost:9000/store/products/prod_xxx/pincode-price?pincode=999999"
```

**Expected**:

```json
{
  "product_id": "prod_xxx",
  "pincode": "999999",
  "message": "Sorry, we don't serve your area yet.",
  "error": "PINCODE_NOT_SERVICEABLE"
}
```

### Test 3: Add to Cart Without Pincode

```bash
curl -X POST http://localhost:9000/store/cart/with-pincode \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_xxx",
    "quantity": 1
  }'
```

**Expected**: Error about missing pincode

---

## 7️⃣ Test Price Comparison

### Test Standard vs Pincode Pricing

1. **Set standard price**: Go to product → Set INR price = ₹2,200
2. **Get standard price**:

   ```bash
   # Via Medusa's standard API (if available)
   # Should return 2200
   ```

3. **Set pincode price different**: Update via widget to ₹2,500
4. **Get pincode price**:

   ```bash
   curl "http://localhost:9000/store/products/prod_xxx/pincode-price?pincode=110001"
   # Should return 2500 (pincode price takes precedence)
   ```

5. **Add to cart**:
   ```bash
   curl -X POST http://localhost:9000/store/cart/with-pincode \
     -d '{"product_id":"prod_xxx","pincode":"110001","quantity":1}'
   # Cart should use 2500, not 2200
   ```

✅ **Pincode pricing is the primary source!**

---

## 📊 Test Results Checklist

Mark these as you test:

- [ ] Admin widget displays on product page
- [ ] Widget shows all pincode prices
- [ ] Inline editing works
- [ ] Sync button updates all prices
- [ ] Link to CSV management works
- [ ] GET /store/pincode-check validates pincodes
- [ ] GET /store/products/:id/pincode-price returns correct price
- [ ] POST /store/cart/with-pincode creates cart with pincode
- [ ] Cart metadata has customer_pincode
- [ ] Cart items use pincode price, not currency price
- [ ] GET /admin/pincode-pricing/prices returns data
- [ ] PUT /admin/pincode-pricing/prices/:id updates price
- [ ] POST /admin/pincode-pricing/sync-product syncs prices
- [ ] CSV download includes current prices
- [ ] CSV upload updates prices
- [ ] Product deletion cascades to pincode prices
- [ ] Invalid pincode formats are rejected
- [ ] Non-serviceable pincodes return proper error
- [ ] Multiple dealers for same pincode work
- [ ] Lowest price is selected when multiple dealers

---

## 🐛 Troubleshooting

### Widget not showing?

```bash
# Check if widget file exists
ls -la src/admin/widgets/product-pincode-pricing.tsx

# Restart dev server
yarn dev
```

### API returns 404?

```bash
# Check if API files exist
ls -la src/api/admin/pincode-pricing/
ls -la src/api/store/cart/with-pincode/

# Check server logs for errors
```

### Prices not syncing?

```bash
# Check if subscriber is running
# Look for "🔄 Price sync triggered" in logs

# Check if dealers exist
curl "http://localhost:9000/admin/pincode-pricing/dealers"

# Check if pincodes are mapped
curl "http://localhost:9000/admin/pincode-pricing/pincode-dealers"
```

### Cart showing wrong price?

```bash
# Verify cart metadata has pincode
curl "http://localhost:9000/store/carts/cart_xxx"
# Check cart.metadata.customer_pincode

# Verify item metadata has pincode_price
# Check items[].metadata.pincode_price
```

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ Widget appears on product detail page
2. ✅ Pincode prices can be viewed and edited
3. ✅ Cart uses pincode prices (not currency prices)
4. ✅ CSV upload/download works
5. ✅ Product deletion cleans up pincode prices
6. ✅ Invalid pincodes are rejected
7. ✅ Multiple dealers per pincode work
8. ✅ Tax calculations work with pincode prices

---

## 🎉 All Tests Pass?

**Congratulations! Your pincode-based pricing system is production-ready! 🚀**

Next steps:

- Deploy to staging
- Test with real data
- Train your team
- Launch to production

**Happy testing! 🧪**
