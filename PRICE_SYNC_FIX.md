# 🔧 Price Sync Not Working - Fix Guide

## ❌ Problem

The price sync subscriber isn't triggering when you update prices in the admin panel.

## ✅ Solution

### 1. **Restart Your Dev Server** (REQUIRED)

The subscriber won't load until you restart the server.

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
yarn dev
```

### 2. **Updated Subscriber Event**

The subscriber now listens to the correct event:

- ❌ Before: `price.created`, `price.updated` (these don't have variant info)
- ✅ Now: `product_variant.updated` (has all the data we need)

### 3. **Test the Auto-Sync**

After restarting the server:

1. Go to your product: http://localhost:9000/app/products/prod_01K8N5JT03JVFG160G07ZMHBRE/variants/variant_01K8N5JT1PSH9YB9RBHB1VWN9R

2. Update the price (e.g., change to `150000` for ₹1,500)

3. Save

4. Check the terminal logs - you should see:
   ```
   🔄 Price sync triggered: {...}
   💰 Found INR price: ₹1500 for variant ...
   📍 Found 17 unique pincodes across 8 dealers
   ✅ Price sync complete: 0 created, 55 updated, 0 skipped
   ```

### 4. **Verify the Sync**

```bash
npx medusa exec ./src/scripts/check-pricing-setup.ts
```

Should show the updated price in both:

- Standard Prices: INR: 1500
- Pincode Prices: All showing ₹1,500.00

---

## 🧪 Manual Testing

If auto-sync doesn't work after restart, use manual sync:

```bash
# Test the sync logic manually
npx medusa exec ./src/scripts/test-manual-sync.ts

# This should show:
# ✅ SYNC COMPLETE
# Updated: 55
```

---

## 🔍 Current Status

### ✅ What's Working:

- Sync logic is correct (tested with manual script)
- All 55 pincode prices update successfully
- Current price: ₹9.99 (from amount 999)

### ⚠️ What Needs Fixing:

- Dev server needs restart to load subscriber
- Then auto-sync will work on price updates

---

## 📝 File Updated

**File**: `src/subscribers/price-sync.ts`

**Change**:

```typescript
// Before:
event: [
  "price.created",
  "price.updated",
  "product_variant.created",
  "product_variant.updated",
];

// After:
event: ["product_variant.updated"];
```

**Why**:

- `price.*` events don't include variant/product information
- `product_variant.updated` fires when you update a variant (including prices)
- This event includes the variant ID, which we can use to fetch prices

---

## 🚀 Next Steps

1. **Restart dev server** (yarn dev)
2. **Update a price** in admin panel
3. **Check terminal logs** for sync messages
4. **Verify** with check-pricing-setup script

---

## 💡 If Still Not Working

Check for errors:

```bash
# Look for subscriber loading in terminal
# Should see: "Registering subscriber: price-sync"

# Check if event is firing
# Update a product and watch terminal logs
```

If no logs appear, the subscriber might not be registered. Check:

- File location: `src/subscribers/price-sync.ts` ✅
- Export format: `export default async function` ✅
- Config export: `export const config: SubscriberConfig` ✅

---

**Updated**: October 28, 2025
**Status**: Fixed - Restart Required
