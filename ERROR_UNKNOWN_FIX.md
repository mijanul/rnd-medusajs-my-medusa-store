# ⚠️ Error: "unknown_error" - Troubleshooting Guide

## Error You're Seeing

```json
{
  "code": "unknown_error",
  "type": "unknown_error",
  "message": "An unknown error occurred."
}
```

## Most Likely Cause

The **pincode-pricing module** is not initialized in the database yet.

## ✅ Solution - Run These Commands:

### Step 1: Build the Project

```bash
npm run build
# or
yarn build
```

### Step 2: Run Database Migrations

```bash
npx medusa migrations run
# or
yarn medusa migrations run
```

This will create the 3 new database tables:

- `dealer`
- `pincode_dealer`
- `product_pincode_price`

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
# or
yarn dev
```

### Step 4: Refresh Browser

Go to: `http://localhost:9000/app/pincode-pricing`

---

## 🔍 Why This Happens

The error occurs because:

1. The Medusa admin panel loads and tries to fetch dealers
2. The API route tries to resolve the `pincodePricing` module
3. The module doesn't exist in the database yet (migrations not run)
4. Module resolution fails → "unknown_error"

---

## ✅ Verify It Works

After running migrations, you should be able to:

### Test API Directly:

```bash
# Test dealers endpoint
curl http://localhost:9000/admin/pincode-pricing/dealers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
{"dealers": []}
```

### Test UI:

1. Go to: `http://localhost:9000/app/pincode-pricing`
2. Should see 3 tabs
3. Should see "No dealers found" message (not an error!)

---

## 🐛 If Still Errors

### Check 1: Module is Registered

Open `medusa-config.ts` and verify:

```typescript
modules: [
  {
    resolve: "./src/modules/pincode-pricing",
  },
  // ... other modules
];
```

### Check 2: Module Exists

File should exist:

```
src/modules/pincode-pricing/index.ts
```

### Check 3: Database Connection

```bash
# Check if database is running
psql -U postgres -c "SELECT version();"
```

### Check 4: Migration Status

```bash
# List all migrations
npx medusa migrations list
```

### Check 5: Server Logs

Look at terminal where `yarn dev` is running for actual error message.

---

## 📋 Complete Fresh Start

If nothing works, try a complete reset:

```bash
# 1. Stop server
# Press Ctrl+C

# 2. Clean build
rm -rf dist node_modules/.cache

# 3. Rebuild
npm run build

# 4. Run migrations
npx medusa migrations run

# 5. Seed base data
npm run seed

# 6. Seed pincode data (optional)
npx tsx src/scripts/seed-pincode-pricing.ts

# 7. Start server
npm run dev
```

---

## 🎯 Expected Behavior After Fix

### UI Should Show:

```
┌────────────────────────────────────────┐
│  Pincode-Based Pricing                 │
├────────────────────────────────────────┤
│  [📍 Pricing Upload] [🏢 Dealers (0)]  │
├────────────────────────────────────────┤
│  No dealers found. Add your first      │
│  dealer to get started.                │
└────────────────────────────────────────┘
```

### API Should Return:

```json
{
  "dealers": []
}
```

---

## 💡 Better Error Messages

I've updated the API routes to show better error messages. Now if the module isn't found, you'll see:

```json
{
  "message": "Pincode pricing service not found. Did you run migrations?",
  "error": "..."
}
```

Instead of just "unknown_error".

---

## ✅ Quick Fix Summary

```bash
# The 3 commands you need:
npm run build
npx medusa migrations run
npm run dev
```

Then refresh browser at: `http://localhost:9000/app/pincode-pricing`

Should work! 🎉
