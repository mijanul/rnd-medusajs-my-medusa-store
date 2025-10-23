# ✅ RECOMMENDED APPROACH: API-Only Protection

## Why API-Only Protection is Better

Creating route overrides in Medusa's admin panel causes duplicate menu items because Medusa treats them as extensions. The **cleaner and more secure approach** is:

1. ✅ **Protect ALL API endpoints** (this is mandatory for security)
2. ✅ **Let UI fail gracefully** when API returns 403
3. ✅ **Optionally add global permission checks** without route overrides

## Implementation

### ✅ Step 1: Remove Duplicate Route Overrides

Delete these files that cause duplicates:

```bash
rm -rf src/admin/routes/orders
rm -rf src/admin/routes/products
rm -rf src/admin/routes/customers
```

### ✅ Step 2: Keep API Protection (Already Implemented)

Your API middlewares are the **primary security layer**:

```
✅ src/api/admin/orders/route.ts
✅ src/api/admin/orders/[id]/route.ts
✅ src/api/admin/products/route.ts
✅ src/api/admin/products/[id]/route.ts
✅ src/api/admin/customers/route.ts
✅ src/api/admin/customers/[id]/route.ts
```

These intercept API calls and return 403 if user lacks permission.

### ✅ Step 3: Handle 403 Errors in UI (Optional Enhancement)

Add a global error handler that shows friendly messages when API returns 403:

```tsx
// src/admin/lib/api-error-handler.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 403) {
    toast.error("You don't have permission to perform this action");
    return;
  }

  if (error.response?.status === 401) {
    toast.error("Please login again");
    return;
  }

  toast.error(error.message || "An error occurred");
};
```

### ✅ Step 4: Hide Menu Items for Unauthorized Users (Optional)

Instead of creating route overrides, use Medusa's navigation configuration to conditionally hide menu items:

```tsx
// src/admin/lib/navigation-config.ts
import { useUserPermissions } from "./use-permissions";

export const useFilteredNavigation = () => {
  const { hasPermission } = useUserPermissions();

  return {
    showOrders: hasPermission("orders", "list"),
    showProducts: hasPermission("products", "list"),
    showCustomers: hasPermission("customers", "list"),
  };
};
```

## How It Works

### User WITHOUT Permission:

```
1. User clicks "Orders" in sidebar
   └─> Medusa loads /orders page (default)

2. Orders page tries to fetch data
   └─> GET /admin/orders

3. API middleware checks permission
   └─> User lacks "orders-list" permission
   └─> Returns: 403 Forbidden

4. Frontend receives 403
   └─> Shows error toast: "You don't have permission"
   └─> OR shows empty state with message

✅ No duplicate menu items
✅ Secure (API protected)
✅ Clean UX (error handling)
```

### User WITH Permission:

```
1. User clicks "Orders"
   └─> Medusa loads /orders page

2. Orders page fetches data
   └─> GET /admin/orders

3. API middleware checks permission
   └─> User has "orders-list" permission
   └─> Returns: 200 OK with data

4. Frontend receives data
   └─> Displays orders normally

✅ Works as expected
```

## Comparison

### ❌ Route Override Approach (Your Current Issue)

```
Pros:
- Blocks access before page loads
- Clear "Access Restricted" message

Cons:
- Creates duplicate menu items ❌
- Medusa treats as extensions ❌
- Confusing UX with duplicate sections ❌
- Harder to maintain ❌
```

### ✅ API-Only Approach (Recommended)

```
Pros:
- No duplicate menu items ✅
- Cleaner codebase ✅
- API security (mandatory) ✅
- Natural UX (data just doesn't load) ✅
- Easier to maintain ✅

Cons:
- User sees the page momentarily before error
- Need proper error handling in UI
```

## Migration Steps

### Step 1: Remove Route Overrides

```bash
# Remove the files causing duplicates
rm src/admin/routes/orders/page.tsx
rm src/admin/routes/products/page.tsx
rm src/admin/routes/customers/page.tsx

# Remove empty directories
rmdir src/admin/routes/orders 2>/dev/null || true
rmdir src/admin/routes/products 2>/dev/null || true
rmdir src/admin/routes/customers 2>/dev/null || true
```

### Step 2: Verify API Protection Still Works

```bash
# Start Medusa
npm run dev

# Test API protection
curl -X GET http://localhost:9000/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 403 if no permission
```

### Step 3: Add Global Error Handler (Optional)

Create `src/admin/lib/api-error-handler.ts`:

```tsx
import { toast } from "@medusajs/ui";

export const handleApiError = (error: any) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  switch (status) {
    case 401:
      toast.error("Authentication required. Please login.");
      break;
    case 403:
      toast.error(
        message || "You don't have permission to perform this action"
      );
      break;
    case 404:
      toast.error("Resource not found");
      break;
    case 500:
      toast.error("Server error. Please try again later.");
      break;
    default:
      toast.error(message || "An error occurred");
  }
};
```

### Step 4: Use Error Handler in Your Components

```tsx
import { handleApiError } from "../lib/api-error-handler";

const MyComponent = () => {
  const fetchOrders = async () => {
    try {
      const response = await fetch("/admin/orders");
      if (!response.ok) throw response;
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      handleApiError(error);
    }
  };
};
```

## Advanced: Hide Sidebar Items

If you want to hide menu items for unauthorized users, you can't do it directly through route config (that would require Medusa core changes), but you can:

### Option A: CSS-Based Hiding (Quick Fix)

```tsx
// src/admin/components/hide-unauthorized-menu.tsx
import { useEffect } from "react";
import { useUserPermissions } from "../lib/use-permissions";

export const HideUnauthorizedMenuItems = () => {
  const { hasPermission, loading } = useUserPermissions();

  useEffect(() => {
    if (loading) return;

    // Hide orders menu item if no permission
    if (!hasPermission("orders", "list")) {
      const ordersLink = document.querySelector('a[href*="/orders"]');
      if (ordersLink?.parentElement) {
        ordersLink.parentElement.style.display = "none";
      }
    }

    // Hide products menu item if no permission
    if (!hasPermission("products", "list")) {
      const productsLink = document.querySelector('a[href*="/products"]');
      if (productsLink?.parentElement) {
        productsLink.parentElement.style.display = "none";
      }
    }

    // Hide customers menu item if no permission
    if (!hasPermission("customers", "list")) {
      const customersLink = document.querySelector('a[href*="/customers"]');
      if (customersLink?.parentElement) {
        customersLink.parentElement.style.display = "none";
      }
    }
  }, [hasPermission, loading]);

  return null;
};
```

Add to your main layout or root component.

### Option B: Wait for Medusa V2 Navigation API

Medusa is working on better navigation customization APIs. For now, API protection is sufficient.

## Summary

### What to Keep:

✅ All API middleware files in `src/api/admin/`
✅ Permission checking utilities
✅ RestrictedAccess component (for custom routes)

### What to Remove:

❌ `src/admin/routes/orders/page.tsx`
❌ `src/admin/routes/products/page.tsx`
❌ `src/admin/routes/customers/page.tsx`

### Result:

✅ No duplicate menu items
✅ API fully protected (secure)
✅ Clean, maintainable code
✅ Better UX

### Security:

🔒 API protection is the ONLY security that matters
🔒 UI hiding is just UX improvement
🔒 Users can bypass UI but can't bypass API

## Quick Command

```bash
# Remove duplicate-causing files
rm -rf src/admin/routes/orders src/admin/routes/products src/admin/routes/customers

# Restart Medusa
npm run dev

# ✅ Duplicates gone, API still protected!
```
