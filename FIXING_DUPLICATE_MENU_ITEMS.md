# 🎯 SOLUTION: Fixing Duplicate Menu Items

## The Problem

When you created route overrides in `src/admin/routes/`, Medusa treated them as **extensions** rather than overrides, causing:

- ❌ Duplicate "Orders" sections in sidebar
- ❌ Duplicate "Products" sections
- ❌ Duplicate "Customers" sections
- ❌ One under "Core" and one under "Extensions"

## The Root Cause

Medusa Admin SDK's `defineRouteConfig` creates **new routes** rather than truly overriding core routes. This is by design - Medusa separates core modules from extensions.

## ✅ The Solution

**Use API-only protection** - it's cleaner, more secure, and doesn't create duplicates.

### Why API-Only is Better:

1. **No Duplicate UI** - No route overrides = no duplicate menu items
2. **More Secure** - UI restrictions can be bypassed; API cannot
3. **Cleaner Code** - Fewer files, simpler maintenance
4. **Better UX** - Users get clear error messages when they try forbidden actions
5. **Medusa-Native** - Works with Medusa's architecture, not against it

## 🚀 Quick Fix

### Step 1: Remove Duplicate-Causing Files

Run the cleanup script:

```bash
./cleanup-duplicate-routes.sh
```

Or manually delete:

```bash
rm -rf src/admin/routes/orders
rm -rf src/admin/routes/products
rm -rf src/admin/routes/customers
```

### Step 2: Restart Medusa

```bash
npm run dev
```

### Step 3: Verify

✅ Open admin panel - duplicate sections should be gone
✅ Test API protection - should still return 403 for unauthorized users
✅ Try accessing protected resources - should fail gracefully with error message

## How It Works Now

### User WITHOUT Permission:

```
1. User clicks "Orders" (default Medusa menu)
   └─> Page loads normally

2. Page tries to fetch orders: GET /admin/orders
   └─> API middleware checks permission
   └─> Returns: 403 Forbidden

3. Frontend handles error:
   └─> Shows toast: "You don't have permission"
   └─> OR displays empty state with message

Result: ✅ No duplicates, secure, clear UX
```

### User WITH Permission:

```
1. User clicks "Orders"
   └─> Page loads

2. Page fetches orders: GET /admin/orders
   └─> API middleware checks permission
   └─> Returns: 200 OK + data

3. Frontend displays data

Result: ✅ Works perfectly, no issues
```

## What You Still Have (Protected)

### ✅ API Endpoints (This is what matters!)

All these are still protected:

**Orders:**

- `GET /admin/orders` → requires `orders-list`
- `POST /admin/orders` → requires `orders-create`
- `GET /admin/orders/:id` → requires `orders-view`
- `POST /admin/orders/:id` → requires `orders-update`
- `DELETE /admin/orders/:id` → requires `orders-delete`

**Products:**

- `GET /admin/products` → requires `products-list`
- `POST /admin/products` → requires `products-create`
- `GET /admin/products/:id` → requires `products-view`
- `POST /admin/products/:id` → requires `products-update`
- `DELETE /admin/products/:id` → requires `products-delete`

**Customers:**

- `GET /admin/customers` → requires `customers-list`
- `POST /admin/customers` → requires `customers-create`
- `GET /admin/customers/:id` → requires `customers-view`
- `POST /admin/customers/:id` → requires `customers-update`
- `DELETE /admin/customers/:id` → requires `customers-delete`

## Optional Enhancements

### Enhancement 1: Global Error Handler

Already created in `src/admin/lib/api-error-handler.ts`

Use in your components:

```tsx
import { handleApiError } from "../lib/api-error-handler";

const fetchOrders = async () => {
  try {
    const response = await fetch("/admin/orders");
    if (!response.ok) throw response;
    return await response.json();
  } catch (error) {
    handleApiError(error); // Shows user-friendly toast
  }
};
```

### Enhancement 2: Hide Menu Items (Optional)

Already created in `src/admin/components/hide-unauthorized-menu.tsx`

Add to your root layout:

```tsx
import { HideUnauthorizedMenuItems } from "./components/hide-unauthorized-menu";

const Layout = () => {
  return (
    <>
      <HideUnauthorizedMenuItems />
      {/* rest of your layout */}
    </>
  );
};
```

This will hide sidebar items for resources user can't access.

## Testing

### Test 1: Verify No Duplicates

1. Open admin panel: `http://localhost:9000/app`
2. Check sidebar
3. ✅ Should see ONE "Orders" section (under Core)
4. ✅ Should see ONE "Products" section
5. ✅ Should see ONE "Customers" section
6. ❌ Should NOT see duplicate sections under "Extensions"

### Test 2: Verify API Protection Works

```bash
# Test without permission (should fail)
curl -X GET http://localhost:9000/admin/orders \
  -H "Authorization: Bearer TOKEN_WITHOUT_PERMISSION"

# Expected: 403 Forbidden
# Response: { "message": "Forbidden: You don't have the required permission: orders-list" }

# Test with permission (should work)
curl -X GET http://localhost:9000/admin/orders \
  -H "Authorization: Bearer TOKEN_WITH_PERMISSION"

# Expected: 200 OK
# Response: { orders: [...] }
```

### Test 3: Verify UI Shows Errors

1. Login as user WITHOUT orders permission
2. Navigate to `/orders`
3. ✅ Page loads but shows error toast
4. ✅ OR shows empty state: "You don't have permission to view orders"

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│                                                              │
│  Medusa Default UI (No custom route overrides)              │
│  ├─ Orders (core)      ✅ Single menu item                  │
│  ├─ Products (core)    ✅ Single menu item                  │
│  └─ Customers (core)   ✅ Single menu item                  │
│                                                              │
│  Optional: Hide menu items with CSS (UX enhancement)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ Makes API calls
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Protected!)                  │
│                                                              │
│  src/api/admin/                                              │
│  ├─ orders/route.ts        → requirePermission()            │
│  ├─ products/route.ts      → requirePermission()            │
│  └─ customers/route.ts     → requirePermission()            │
│                                                              │
│  Returns 403 if no permission ← REAL SECURITY               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ If authorized
┌─────────────────────────────────────────────────────────────┐
│                    Medusa Core Services                      │
│  (OrderService, ProductService, CustomerService)            │
└─────────────────────────────────────────────────────────────┘
```

## Files You Have

### ✅ Keep These (API Protection):

- `src/api/admin/orders/route.ts`
- `src/api/admin/orders/[id]/route.ts`
- `src/api/admin/products/route.ts`
- `src/api/admin/products/[id]/route.ts`
- `src/api/admin/customers/route.ts`
- `src/api/admin/customers/[id]/route.ts`

### ✅ Keep These (Utilities):

- `src/modules/role-management/middleware.ts`
- `src/modules/role-management/middleware-advanced.ts`
- `src/modules/role-management/utils.ts`
- `src/admin/components/restricted-access.tsx` (for custom routes)
- `src/admin/lib/use-permissions.ts`
- `src/admin/lib/api-error-handler.ts` (new)
- `src/admin/components/hide-unauthorized-menu.tsx` (new, optional)

### ❌ Remove These (Causing Duplicates):

- `src/admin/routes/orders/page.tsx` ← Delete
- `src/admin/routes/products/page.tsx` ← Delete
- `src/admin/routes/customers/page.tsx` ← Delete

### 📚 Documentation:

- `API_ONLY_PROTECTION_GUIDE.md` (new)
- `PREDEFINED_MODULES_PROTECTION.md` (update as reference)
- All other guides remain useful

## Troubleshooting

### Issue: Still seeing duplicates after cleanup

**Solution:**

1. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Stop Medusa: Ctrl+C
3. Clear build cache: `rm -rf .medusa`
4. Restart: `npm run dev`

### Issue: API returns 403 but user should have access

**Check:**

1. Permission exists: `npx medusa exec ./src/scripts/verify-permissions.ts`
2. User has role: Query `user_role` table
3. Role has permission: Query `role_permission` table
4. Token is valid: Check JWT expiration

### Issue: Want to hide menu items

**Solution:** Use the `HideUnauthorizedMenuItems` component (already created)

## Summary

### Before (With Route Overrides):

- ❌ Duplicate menu items
- ❌ Confusing UX
- ✅ API protected
- ✅ UI blocked

### After (API-Only):

- ✅ No duplicate menu items
- ✅ Clean UI
- ✅ API protected (still secure!)
- ✅ Graceful error handling

### Security Comparison:

Both approaches are equally secure because **API protection is what matters**. The UI is just for UX.

## Next Steps

1. ✅ Run cleanup script: `./cleanup-duplicate-routes.sh`
2. ✅ Restart Medusa: `npm run dev`
3. ✅ Verify no duplicates in admin panel
4. ✅ Test API protection still works
5. 🎯 Optional: Add `HideUnauthorizedMenuItems` component to hide sidebar items
6. 🎯 Optional: Customize error messages in `api-error-handler.ts`

---

**You now have clean, secure, Medusa-native RBAC without duplicate menu items!** 🎉
