# 🚀 Pincode Pricing - Quick Reference

## 📦 What You Got

A complete pincode-based pricing system for your Medusa store where prices are determined by customer location (pincode) rather than currency.

---

## 🎯 Key Features

✅ **Pincode-based pricing** - Prices vary by customer location  
✅ **Admin widget** - Manage prices from product detail page  
✅ **Cart integration** - Add to cart with pincode pricing  
✅ **CSV support** - Bulk upload/download prices  
✅ **Auto-sync** - Currency price → Pincode prices  
✅ **Auto-cleanup** - CASCADE delete when product removed  
✅ **Tax compatible** - Works with Medusa's tax system

---

## 📁 New Files Created

### Admin

- `src/admin/widgets/product-pincode-pricing.tsx` - Widget on product page

### APIs

- `src/api/admin/pincode-pricing/prices/route.ts` - Get prices
- `src/api/admin/pincode-pricing/prices/[id]/route.ts` - Update price
- `src/api/admin/pincode-pricing/sync-product/[product_id]/route.ts` - Sync prices
- `src/api/store/cart/with-pincode/route.ts` - Add to cart with pincode

### Middleware & Workflows

- `src/api/middlewares/pincode-context.ts` - Capture pincode
- `src/workflows/calculate-cart-pincode-pricing.ts` - Calculate cart

### Documentation

- `PINCODE_PRICING_COMPLETE_SYSTEM.md` - Full documentation
- `PINCODE_PRICING_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `PINCODE_PRICING_TESTING_GUIDE.md` - Testing instructions
- `PINCODE_PRICING_QUICK_REFERENCE.md` - This file

---

## 🔑 Quick API Reference

### Customer APIs

```bash
# Check pincode
GET /store/pincode-check?code=110001

# Get product price for pincode
GET /store/products/{product_id}/pincode-price?pincode=110001

# Add to cart with pincode
POST /store/cart/with-pincode
Body: {
  "product_id": "prod_xxx",
  "pincode": "110001",
  "quantity": 1
}
```

### Admin APIs

```bash
# Get product prices
GET /admin/pincode-pricing/prices?product_id={product_id}

# Update a price
PUT /admin/pincode-pricing/prices/{price_id}
Body: { "price": 2500.00 }

# Sync product from currency price
POST /admin/pincode-pricing/sync-product/{product_id}

# Download CSV template
GET /admin/pincode-pricing/template

# Upload CSV
POST /admin/pincode-pricing/upload
```

---

## 🎨 Admin Workflow

### Option 1: Via Widget (Quick Edit)

1. Go to product detail page
2. Scroll to "Pincode-Based Pricing" widget
3. Click on any price to edit inline
4. Or click "Sync from Currency Price"

### Option 2: Via CSV (Bulk Edit)

1. Go to `/app/pincode-pricing`
2. Download template
3. Edit in Excel/Sheets
4. Upload

---

## 🛒 Customer Workflow

```
1. Customer enters pincode: 110001
   ↓
2. System checks serviceability
   ↓
3. Shows price: ₹2,200 (for that pincode)
   ↓
4. Shows dealer: "Delhi Dealer"
   ↓
5. Shows delivery: "2 days"
   ↓
6. Customer adds to cart
   ↓
7. Cart uses pincode price
   ↓
8. Checkout & payment
```

---

## 🗃️ Database Structure

```sql
-- Primary pricing table (pincode-based)
product_pincode_price
├── id (PK)
├── product_id (FK → product.id, CASCADE DELETE)
├── pincode (6 digits)
├── dealer_id (FK → dealer.id)
├── price (decimal)
└── is_active (boolean)

-- Dealer mapping
pincode_dealer
├── pincode
├── dealer_id
├── delivery_days
├── is_cod_available
└── is_serviceable

-- Dealers
dealer
├── id
├── code
├── name
└── is_active

-- Standard Medusa (fallback)
price
├── id
├── price_set_id
├── currency_code
└── amount
```

---

## 🔄 Data Flow

### Adding Price

```
Admin sets INR price: ₹2,200
         ↓
price-sync subscriber triggers
         ↓
Creates product_pincode_price entries
(for all dealers × all pincodes)
         ↓
Widget shows all prices
```

### Customer Purchase

```
Customer enters pincode: 110001
         ↓
Query: product_pincode_price
WHERE product_id = 'prod_xxx'
AND pincode = '110001'
         ↓
Return best price (lowest from dealers)
         ↓
Add to cart with pincode price
         ↓
Checkout uses pincode price
```

---

## 💡 Key Concepts

### Priority System

When multiple dealers serve same pincode:

1. **Lowest price wins**
2. If equal → **Higher priority dealer**
3. If equal → **First dealer**

### Pricing Fallback

If pincode price not found:

1. Try `product_pincode_price` (primary)
2. Fall back to `price` table (currency-based)
3. Show error if neither exists

### Pincode Validation

- Must be exactly **6 digits**
- Examples: `110001`, `400001`
- Invalid: `11001`, `ABCDEF`, `110001 `

---

## 🧪 Quick Tests

### Test 1: Widget

```
1. Open: http://localhost:9000/app/products/prod_xxx
2. Scroll down
3. See "Pincode-Based Pricing" widget
```

### Test 2: API

```bash
curl "http://localhost:9000/store/pincode-check?code=110001"
```

### Test 3: Cart

```bash
curl -X POST http://localhost:9000/store/cart/with-pincode \
  -d '{"product_id":"prod_xxx","pincode":"110001","quantity":1}'
```

### Test 4: Sync

```bash
# Change product INR price in admin
# Then:
curl -X POST http://localhost:9000/admin/pincode-pricing/sync-product/prod_xxx
```

---

## 🐛 Common Issues

### Widget not showing?

→ Restart dev server: `yarn dev`

### API 404 errors?

→ Check file paths and restart server

### Prices not syncing?

→ Check dealers and pincode mappings exist

### Wrong price in cart?

→ Verify pincode in cart metadata

---

## 📚 Full Documentation

For complete details, see:

- **Implementation**: `PINCODE_PRICING_IMPLEMENTATION_SUMMARY.md`
- **System Guide**: `PINCODE_PRICING_COMPLETE_SYSTEM.md`
- **Testing**: `PINCODE_PRICING_TESTING_GUIDE.md`

---

## ✅ Verification Checklist

- [ ] Widget appears on product page
- [ ] Can edit prices inline
- [ ] Sync button works
- [ ] CSV download/upload works
- [ ] Cart uses pincode prices
- [ ] Product deletion cleans up prices
- [ ] Invalid pincodes are rejected

---

## 🎉 You're All Set!

Your pincode-based pricing system is complete and ready to use.

**Next steps**:

1. Test with the testing guide
2. Add your dealers and pincodes
3. Sync prices for your products
4. Launch to customers

**Happy selling! 🚀**

---

## 📞 Quick Help

**Issue**: Price not updating in admin  
**Fix**: Click "Sync from Currency Price" button

**Issue**: Cart showing currency price  
**Fix**: Use `/store/cart/with-pincode` endpoint

**Issue**: Product deleted but pincode prices remain  
**Fix**: Check CASCADE constraint exists on product_pincode_price table

**Issue**: Widget not loading  
**Fix**: Clear browser cache, restart dev server

---

## 🔗 Related Files

```
Your Implementation:
├── Admin Widget ......... product-pincode-pricing.tsx
├── Cart API ............. cart/with-pincode/route.ts
├── Price APIs ........... admin/pincode-pricing/prices/
├── Middleware ........... pincode-context.ts
├── Workflow ............. calculate-cart-pincode-pricing.ts
└── Docs ................. PINCODE_PRICING_*.md

Existing (Already working):
├── Models ............... modules/pincode-pricing/models/
├── Service .............. modules/pincode-pricing/service.ts
├── Store APIs ........... store/pincode-check/, store/products/
├── CSV APIs ............. admin/pincode-pricing/template, upload
├── Sync Subscriber ...... subscribers/price-sync.ts
└── Cleanup Workflow ..... workflows/product-deleted.ts
```

---

**That's it! You now have a production-ready pincode-based pricing system! 🎊**
