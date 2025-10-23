# 🔍 Permission Debugging Improvements

## Overview

Enhanced the RBAC system with comprehensive debugging logs and fixes for permission checking issues.

## Changes Made

### 1. **Enhanced Permission Fetching** (`src/admin/lib/menu-config.tsx`)

- ✅ Uses `/admin/users/me/permissions` endpoint directly
- ✅ Extracts permission names from response correctly
- ✅ Added detailed console logging:
  - 🔄 Fetching status
  - 📦 Raw API response
  - ✅ Extracted permissions array

### 2. **Improved Route Matching** (`src/admin/widgets/menu-customizer.tsx`)

- ✅ Changed from `includes()` to exact matching + `startsWith()`
  - Prevents `/app/orders` from catching `/app/orders/drafts`
  - Uses `href === route.path` for exact match
  - Uses `href.startsWith(route.path + "/")` for sub-routes
- ✅ Added detailed route matching logs:
  - 🔍 Shows exact vs sub-route match
  - 🎯 Shows matched route and resource

### 3. **Enhanced Permission Checking** (`hasResourcePermission` function)

- ✅ Handles both `price_lists` and `price-lists` naming formats
  - Normalizes underscores to hyphens and vice versa
  - Checks all format variations
- ✅ Super admin detection (checks for `all-all` permission)
- ✅ Detailed permission logging:
  - ✅ Shows which permissions were found
  - ❌ Shows what was looked for when not found
  - 📦 Shows all user permissions for debugging

### 4. **Route Guard Component** (NEW)

Created two new files:

- `src/admin/lib/route-guard.tsx` - Core route guard logic
- `src/admin/widgets/route-guard.tsx` - Widget wrapper

**Features:**

- Checks permissions on page navigation
- Redirects to access denied if no permission
- Handles all protected routes:
  - `/app/orders`
  - `/app/products`
  - `/app/customers`
  - `/app/customer-groups`
  - `/app/inventory`
  - `/app/promotions`
  - `/app/price-lists`
  - `/app/pages`

**Benefits:**

- ✅ Catches route access BEFORE API calls
- ✅ Prevents users from seeing unauthorized pages
- ✅ Works with direct URL navigation

## Console Log Guide

When you restart the server and refresh the browser, you'll see:

### Permission Fetching Logs

```
🔄 Fetching user permissions...
📦 Raw API Response: {roles: [], permissions: [...], ...}
✅ Extracted Permissions: ["pages-list", "pages-view", ...]
```

### Route Guard Logs

```
🛡️ Route guard checking: /app/orders (resource: orders)
🔐 User permissions: ["pages-list", "pages-view", ...]
🎯 Has orders permission: false
🚫 Redirecting to access denied: /app/orders
```

### Menu Hiding Logs

```
🎨 Checking menu items for permissions...
👤 User permissions: ["pages-list", "pages-view", ...]

   📋 Link 1: "Orders" → /app/orders
   🔍 Checking route: /app/orders (exact: true, sub: false)
   🎯 Matched route: /app/orders (resource: orders)
      ❌ No orders permission found
      📝 Looking for: ["orders-list", "orders-view", ...]
      📦 User permissions: ["pages-list", "pages-view", ...]
   🚫 HIDING menu item: "Orders"

   📋 Link 2: "Customers" → /app/customers
   🔍 Checking route: /app/customers (exact: true, sub: false)
   🎯 Matched route: /app/customers (resource: customers)
      ✅ Has customers permission: ["customers-list"]
   ✅ SHOWING menu item: "Customers"
```

## Testing Steps

1. **Restart the server:**

   ```bash
   yarn dev
   ```

2. **Hard refresh browser** (Cmd+Shift+R on Mac)

3. **Open browser console** (Cmd+Option+I on Mac)

4. **Check the logs:**

   - Look for "🔄 Fetching user permissions..."
   - Look for "✅ Extracted Permissions:"
   - Look for "🎨 Checking menu items..."
   - Look for each link's permission check

5. **Test navigation:**
   - Try navigating to `/app/orders` - should redirect if no permission
   - Try navigating to `/app/customers` - should redirect if no permission
   - Check which menu items are visible

## Expected Behavior

Based on your database (user has only `pages-*` permissions):

### Should HIDE:

- ❌ Orders
- ❌ Drafts (under orders)
- ❌ Products
- ❌ Customers
- ❌ Customer Groups
- ❌ Inventory
- ❌ Promotions
- ❌ Price Lists

### Should SHOW:

- ✅ Pages (you have pages-list, pages-view, etc.)
- ✅ Settings (excluded from protection)

### Navigation Behavior:

- ✅ `/app/pages` - accessible
- ❌ `/app/orders` - redirect to access denied
- ❌ `/app/customers` - redirect to access denied
- ❌ `/app/price-lists` - redirect to access denied

## Debugging Issues

If something doesn't work as expected, check the console logs:

1. **"customers permission enabled but not showing"**

   - Look for the "📦 User permissions:" log
   - Check if you see "customers-list" or "customers-view" in the array
   - Look for the "Customers" link in the menu check logs
   - See what the permission check says

2. **"Price Lists showing when it shouldn't"**

   - Look for the "Price Lists" link in the menu check logs
   - Check if it says "✅ Has price_lists permission" or "❌ No price_lists permission"
   - Check both `price_lists` and `price-lists` format checks

3. **"Drafts always showing"**
   - Look for the "Drafts" link in the menu check logs
   - Check the route matching: should show "🔍 Checking route: /app/orders/drafts"
   - See if it matches the orders route correctly

## Files Modified

1. `src/admin/lib/menu-config.tsx` - Enhanced permission fetching
2. `src/admin/widgets/menu-customizer.tsx` - Improved route matching and permission checking
3. `src/admin/lib/route-guard.tsx` - NEW: Route guard logic
4. `src/admin/widgets/route-guard.tsx` - NEW: Route guard widget

## Next Steps

After testing with console logs:

1. Share the console output
2. We'll analyze what's happening
3. Fix any remaining issues based on actual behavior
