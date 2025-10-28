# Currency-Based to Pincode-Based Pricing Guide

## 🎯 Overview

Your Medusa store now has **AUTOMATIC PRICE SYNCHRONIZATION** between:

- **Standard Medusa Pricing** (currency-based: INR, USD, EUR, etc.)
- **Pincode Pricing Table** (location + dealer specific pricing)

## 🔄 How It Works

### 1. **Add Price in Admin Panel** (Currency-Based)

When you add a price through the admin panel:

- Go to Products → Your Product → Variants
- Add price: `₹2,200.00` in INR currency
- This creates an entry in the standard `price` table

### 2. **Automatic Sync Happens**

The new subscriber (`price-sync.ts`) automatically:

- Detects the price creation/update
- Syncs it to ALL dealer-pincode combinations
- Creates entries in `product_pincode_price` table

### 3. **Result**

Your customers can now:

- Enter their pincode
- See the price from their nearest dealer
- Get delivery estimates based on dealer location

---

## ⚠️ IMPORTANT: Price Units

Medusa stores prices in **MINOR UNITS** (smallest currency unit):

### For INR (Indian Rupee):

- Minor unit = **Paise** (1 Rupee = 100 Paise)
- To store ₹2,200 → Enter **220000** (2200 × 100)
- To store ₹99.50 → Enter **9950** (99.50 × 100)

### Current Situation:

```
Your Input:    2,200.00
Stored As:     2200 (minor units)
Displayed As:  ₹22.00
```

### To Fix:

1. **Option A: Update in Admin Panel**

   - Go to the product variant
   - Change price from `2200` to `220000`
   - Save
   - Auto-sync will update all pincode prices

2. **Option B: Run SQL Update**

   ```sql
   -- Update the standard price
   UPDATE price
   SET amount = 220000
   WHERE amount = 2200 AND currency_code = 'inr';

   -- Update pincode prices
   UPDATE product_pincode_price
   SET price = 2200.00
   WHERE price = 22.00;
   ```

3. **Option C: Use Fix Script** (I'll create this for you)

---

## 📋 Architecture

### Two Separate Tables:

1. **Standard Medusa `price` Table**

   - Stores currency-based prices (INR, USD, EUR, etc.)
   - Linked to variants via `price_set`
   - Used by admin panel
   - **Currency-based** (not location-aware)

2. **Custom `product_pincode_price` Table**
   - Stores pincode + dealer specific prices
   - Linked directly to products
   - Used by customer-facing APIs
   - **Location-based** (pincode-aware)

### Why Both?

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                          │
│  (Add/Edit prices in INR, USD, EUR...)                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           Standard Price Table (price)                  │
│  - amount: 220000 (minor units)                         │
│  - currency_code: "inr"                                 │
│  - variant_id: "variant_xxx"                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 🔄 AUTO-SYNC (Subscriber)
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│      Pincode Price Table (product_pincode_price)        │
│  Pincode  │ Dealer         │ Price    │ Product         │
│  110001   │ Delhi Dealer   │ 2200.00  │ prod_xxx        │
│  400001   │ Mumbai Dealer  │ 2200.00  │ prod_xxx        │
│  560001   │ Bangalore D.   │ 2200.00  │ prod_xxx        │
│  ...      │ ...            │ ...      │ ...             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│               CUSTOMER FRONTEND                         │
│  "Enter your pincode: 110001"                           │
│  → Shows: ₹2,200.00 (from Delhi Dealer)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Usage Guide

### For Existing Products (One-Time Sync):

```bash
# Check current setup
npx medusa exec ./src/scripts/check-pricing-setup.ts

# Sync all existing prices
npx medusa exec ./src/scripts/sync-prices-to-pincode.ts
```

### For New Products (Automatic):

Just add prices normally in the admin panel:

1. Go to Products → Your Product
2. Edit variant → Add price in INR
3. Save → **Auto-sync happens automatically!** ✨

The subscriber will:

- Detect the new price
- Create pincode prices for all dealers
- No manual sync needed!

---

## 🛠️ Setup Requirements

### 1. Dealers (Already Set ✅)

You have 8 dealers configured:

- Mumbai Warehouse
- Chennai Supplier
- Bangalore Store
- Delhi Distributor
- etc.

### 2. Pincode Coverage (Already Set ✅)

You have 55+ pincodes mapped to dealers:

- Mumbai: 400001, 400002, etc.
- Delhi: 110001, 110002, etc.
- Bangalore: 560001, 560002, etc.

### 3. Auto-Sync Subscriber (NEW ✨)

File: `src/subscribers/price-sync.ts`

- Listens to: `price.created`, `price.updated`
- Automatically syncs to pincode table
- No manual intervention needed!

---

## 🎯 Quick Commands

```bash
# Check pricing setup
npx medusa exec ./src/scripts/check-pricing-setup.ts

# Sync all prices (one-time for existing products)
npx medusa exec ./src/scripts/sync-prices-to-pincode.ts

# View prices for a specific product
npx medusa exec ./src/scripts/show-prices-by-product.ts

# Verify all prices
npx medusa exec ./src/scripts/verify-prices.ts
```

---

## 🔧 Troubleshooting

### Price not syncing?

1. Check if dealers exist:

   ```bash
   npx medusa exec -c "
   const service = container.resolve('pincodePricing');
   const dealers = await service.listDealers();
   console.log(dealers);
   "
   ```

2. Check if pincodes are mapped:

   ```bash
   npx medusa exec -c "
   const service = container.resolve('pincodePricing');
   const pincodes = await service.listPincodeDealers();
   console.log(pincodes.length + ' pincodes found');
   "
   ```

3. Restart your dev server to load the new subscriber:
   ```bash
   yarn dev
   ```

### Wrong price amount?

Remember: Prices are in **minor units**

- ₹1 = 100 paise → Enter 100
- ₹10 = 1000 paise → Enter 1000
- ₹100 = 10000 paise → Enter 10000
- ₹2,200 = 220000 paise → Enter 220000

---

## 📊 Benefits

✅ **Single Source of Truth**: Update once in admin panel
✅ **Automatic Sync**: No manual CSV imports needed
✅ **Location-Aware**: Different prices per pincode
✅ **Dealer-Specific**: Support multiple dealers
✅ **Real-Time**: Changes reflect immediately
✅ **Scalable**: Works with any number of products

---

## 🎉 What's Next?

1. **Fix the current price**:

   - Update variant price to `220000` (for ₹2,200)
   - Or run the fix script

2. **Test it**:

   - Add a new price in admin panel
   - Check if it auto-syncs to pincode table

3. **Add more products**:
   - Prices will auto-sync from now on!

---

## 📝 Notes

- The subscriber runs automatically on every price change
- No need to manually sync prices anymore (except for existing products)
- The pincode pricing system is now fully integrated with standard Medusa pricing
- You can still import prices via CSV if needed (for dealer-specific pricing)

---

**Created**: October 28, 2025
**System**: Medusa v2 with Custom Pincode Pricing Module
