# Permission Access Control - Quick Start

## What Was Implemented

### ✅ Task 1: User Permissions Endpoint

The endpoint `GET /admin/users/me/permissions` already exists and is working properly.

**Location:** `/src/api/admin/users/me/permissions/route.ts`

**Test it:**

```bash
# In browser console (when logged in):
fetch('/admin/users/me/permissions').then(r => r.json()).then(console.log)
```

### ✅ Task 2: Orders Permission Protection

When a user tries to access `/app/orders` without proper permissions, they are redirected to an access denied page.

**What happens:**

1. User navigates to `/app/orders`
2. System checks if user has any "orders" permission
3. If NO permission → Redirect to `/app/access-denied?resource=orders&action=view`
4. If HAS permission → Orders page loads normally

## New Files Created

1. **`/src/admin/routes/access-denied/page.tsx`**

   - User-friendly access denied page
   - Shows clear message about missing permissions
   - Provides navigation options (Go Back, Dashboard)

2. **`/src/admin/routes/orders/page.tsx`**

   - Permission check wrapper for orders
   - Intercepts access and validates permissions
   - Redirects to access denied if no permission

3. **`/src/admin/components/permission-error-handler.tsx`**

   - Global 403 error handler
   - Automatically redirects on permission errors
   - Provides hook for manual error handling

4. **`/src/scripts/test-permission-access.ts`**

   - Test script to verify implementation
   - Browser and Node.js compatible

5. **`PERMISSION_ACCESS_CONTROL.md`**
   - Complete documentation
   - Usage examples
   - Testing guide

## How to Test

### Test 1: Check Your Permissions

```javascript
// In browser console (logged in):
fetch("/admin/users/me/permissions")
  .then((r) => r.json())
  .then((data) => {
    console.log("Your roles:", data.roles);
    console.log("Your permissions:", data.permissions_by_resource);
  });
```

### Test 2: Test Orders Access

**Without Permission:**

1. Go to Settings → Role Management
2. Create a new role (e.g., "Viewer")
3. Don't add any "orders" permissions
4. Assign this role to your user
5. Try to access `/app/orders`
6. **Expected:** Redirected to access denied page

**With Permission:**

1. Add "orders-view" or "orders-list" permission to role
2. Try to access `/app/orders`
3. **Expected:** Orders page loads normally

### Test 3: API Endpoint Protection

```javascript
// In browser console:
fetch("/admin/orders")
  .then((r) => r.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));

// If no permission, you'll see:
// {
//   "message": "Forbidden: You don't have permission to list orders",
//   "required_permission": "orders-list",
//   "redirect": "/app/access-denied?resource=orders&action=list"
// }
```

## Key Features

### 1. Multi-Layer Protection

- ✅ **API Level:** Middleware blocks unauthorized API requests
- ✅ **UI Level:** Frontend checks permissions before rendering
- ✅ **Route Level:** Navigation is intercepted and validated

### 2. User-Friendly Error Messages

- Clear access denied page
- Contextual messages (shows resource and action)
- Navigation options
- Instructions to contact admin

### 3. Automatic Redirects

- API 403 errors trigger automatic redirects
- Frontend permission checks redirect before loading
- Consistent user experience

### 4. Flexible Permission System

- Resource-based permissions (orders, products, etc.)
- Action-based granularity (view, create, update, delete)
- Role-based assignment
- Easy to extend

## Protected Resources

The following resources are protected by the middleware:

| Resource    | Endpoint              | Permission Check       |
| ----------- | --------------------- | ---------------------- |
| Orders      | `/admin/orders*`      | `orders-{action}`      |
| Customers   | `/admin/customers*`   | `customers-{action}`   |
| Products    | `/admin/products*`    | `products-{action}`    |
| Inventory   | `/admin/inventory*`   | `inventory-{action}`   |
| Promotions  | `/admin/promotions*`  | `promotions-{action}`  |
| Price Lists | `/admin/price-lists*` | `price_lists-{action}` |

## Usage in Components

### Check if User Has Permission

```tsx
import { useUserPermissions } from "../../lib/use-permissions";

function MyComponent() {
  const { hasPermission, hasAnyPermission } = useUserPermissions();

  // Check specific permission
  if (hasPermission("orders", "create")) {
    return <Button>Create Order</Button>;
  }

  // Check any permission for resource
  if (hasAnyPermission("orders")) {
    return <OrdersList />;
  }

  return <RestrictedAccess resource="orders" action="view" />;
}
```

### Protect a Component

```tsx
import { PermissionGate } from "../../components/restricted-access";
import { useUserPermissions } from "../../lib/use-permissions";

function MyComponent() {
  const { hasPermission, loading } = useUserPermissions();

  return (
    <PermissionGate
      resource="orders"
      action="create"
      hasPermission={hasPermission}
      loading={loading}
    >
      <CreateOrderForm />
    </PermissionGate>
  );
}
```

## Troubleshooting

**Q: I have the right role but still can't access orders**

- Check that your role has the specific permission assigned
- Verify: `fetch('/admin/users/me/permissions').then(r => r.json()).then(console.log)`
- Look for "orders" in `permissions_by_resource`

**Q: Access denied page shows wrong message**

- Clear browser cache
- Restart Medusa dev server
- Check URL parameters: `?resource=orders&action=view`

**Q: Changes not taking effect**

- Restart Medusa backend: `npm run dev`
- Clear browser cache and cookies
- Re-login to refresh session

**Q: Getting 500 errors instead of 403**

- Check Medusa backend logs
- Verify database schema is up to date
- Run: `npm run build` then `npm run dev`

## Next Steps

1. **Test with different roles** - Create various role combinations
2. **Add more protected routes** - Apply to custom modules
3. **Customize messages** - Update access denied page styling
4. **Audit logging** - Track permission denials

## Additional Documentation

- 📖 [PERMISSION_ACCESS_CONTROL.md](./PERMISSION_ACCESS_CONTROL.md) - Complete documentation
- 📖 [STEP3_PERMISSION_UI_RESTRICTIONS.md](./STEP3_PERMISSION_UI_RESTRICTIONS.md) - UI restrictions guide
- 📖 [ROLE_MANAGEMENT_GUIDE.md](./ROLE_MANAGEMENT_GUIDE.md) - Role management
- 📖 [PERMISSION_SYSTEM_UPDATE.md](./PERMISSION_SYSTEM_UPDATE.md) - System overview
