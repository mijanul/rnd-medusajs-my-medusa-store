# Permission-Based Access Control Implementation

## Overview

This document describes the implementation of permission-based access control for the Medusa admin panel, specifically focusing on orders and other protected resources.

## Components Implemented

### 1. User Permissions Endpoint ✅

**Location:** `/src/api/admin/users/me/permissions/route.ts`

**Endpoint:** `GET /admin/users/me/permissions`

**Description:** Returns the current authenticated user's permissions based on their assigned roles.

**Response Format:**

```json
{
  "roles": ["Sales Manager", "Viewer"],
  "permissions": [
    {
      "id": "perm_123",
      "name": "orders-view",
      "resource": "orders",
      "action": "view",
      "description": "View orders"
    }
  ],
  "permissions_by_resource": {
    "orders": ["view", "list"],
    "products": ["view", "list", "create"]
  },
  "has_permissions": true,
  "total_permissions": 5
}
```

**Usage in Frontend:**

```typescript
import { useUserPermissions } from "../../lib/use-permissions";

const MyComponent = () => {
  const { permissions, hasPermission, hasAnyPermission, loading } =
    useUserPermissions();

  if (hasPermission("orders", "view")) {
    // User can view orders
  }

  if (hasAnyPermission("orders")) {
    // User has some permission for orders
  }
};
```

### 2. Access Denied Page ✅

**Location:** `/src/admin/routes/access-denied/page.tsx`

**Route:** `/app/access-denied`

**Query Parameters:**

- `resource` - The resource name (e.g., "orders", "products")
- `action` - The action attempted (e.g., "view", "create", "update")

**Description:** A user-friendly page shown when a user tries to access a resource without proper permissions.

**Features:**

- Clear visual indication (lock icon)
- Contextual message based on resource and action
- Navigation buttons (Go Back, Go to Dashboard)
- Instructions to contact administrator

### 3. API Middleware Protection ✅

**Location:** `/src/api/middlewares.ts`

**Description:** Server-side middleware that intercepts API requests and checks permissions before allowing access.

**Protected Routes:**

- `/admin/orders*` - Orders and draft orders
- `/admin/customers*` - Customer management
- `/admin/products*` - Product management
- `/admin/inventory*` - Inventory management
- `/admin/promotions*` - Promotions and campaigns
- `/admin/price-lists*` - Price lists

**Behavior:**
When a user without proper permissions tries to access a protected route:

1. Middleware checks user's permissions
2. Returns 403 Forbidden status
3. Includes redirect URL in response: `{ redirect: "/app/access-denied?resource=orders&action=view" }`

### 4. Frontend Permission Components ✅

#### RestrictedAccess Component

**Location:** `/src/admin/components/restricted-access.tsx`

**Usage:**

```tsx
import { RestrictedAccess } from "../../components/restricted-access";

// Show access denied message
<RestrictedAccess resource="orders" action="view" />

// With custom message
<RestrictedAccess
  resource="orders"
  action="view"
  message="Custom message here"
/>
```

#### PermissionGate Component

**Location:** `/src/admin/components/restricted-access.tsx`

**Usage:**

```tsx
import { PermissionGate } from "../../components/restricted-access";
import { useUserPermissions } from "../../lib/use-permissions";

const MyComponent = () => {
  const { hasPermission, loading } = useUserPermissions();

  return (
    <PermissionGate
      resource="orders"
      action="create"
      hasPermission={hasPermission}
      loading={loading}
    >
      {/* Content shown only if user has permission */}
      <Button>Create Order</Button>
    </PermissionGate>
  );
};
```

#### Permission Error Handler

**Location:** `/src/admin/components/permission-error-handler.tsx`

**Description:** Global error handler that intercepts 403 responses and automatically redirects to the access denied page.

**Usage as Hook:**

```tsx
import { usePermissionErrorHandler } from "../../components/permission-error-handler";

const MyComponent = () => {
  const { handlePermissionError } = usePermissionErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch("/admin/orders");
      if (response.status === 403) {
        handlePermissionError(response, "orders", "view");
        return;
      }
      // ... handle success
    } catch (error) {
      handlePermissionError(error);
    }
  };
};
```

### 5. Orders Page Protection ✅

**Location:** `/src/admin/routes/orders/page.tsx`

**Description:** Custom orders page that checks permissions before allowing access. If user doesn't have orders permissions, redirects to access denied page.

**Flow:**

1. User navigates to `/app/orders`
2. Component checks user permissions
3. If no orders permission → Redirect to `/app/access-denied?resource=orders&action=view`
4. If has permission → Show orders interface

## Testing the Implementation

### Test Case 1: User WITHOUT Orders Permission

1. Create a role without orders permissions
2. Assign the role to a user
3. Log in as that user
4. Try to access `/app/orders`
5. **Expected:** Redirected to access denied page with message about orders

### Test Case 2: User WITH Orders Permission

1. Create a role with orders view/list permissions
2. Assign the role to a user
3. Log in as that user
4. Access `/app/orders`
5. **Expected:** Orders page loads normally

### Test Case 3: API Endpoint Protection

1. Log in as user without orders permission
2. Make API call: `GET /admin/orders`
3. **Expected:** 403 response with redirect information

```json
{
  "message": "Forbidden: You don't have permission to list orders",
  "required_permission": "orders-list",
  "redirect": "/app/access-denied?resource=orders&action=list"
}
```

### Test Case 4: Permission Endpoint

1. Log in as any user
2. Make API call: `GET /admin/users/me/permissions`
3. **Expected:** JSON response with user's permissions

```bash
curl -X GET "http://localhost:9000/admin/users/me/permissions" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Permission Format

Permissions follow this naming convention: `{resource}-{action}`

**Common Actions:**

- `list` - View list of resources
- `view` - View single resource details
- `create` - Create new resource
- `update` - Update existing resource
- `delete` - Delete resource
- `all` - All actions for a resource

**Example Permissions:**

- `orders-list` - Can list orders
- `orders-view` - Can view order details
- `orders-create` - Can create orders
- `orders-update` - Can update orders
- `orders-delete` - Can delete orders
- `products-all` - Can do everything with products

## File Structure

```
src/
├── api/
│   ├── middlewares.ts                              # API route protection
│   └── admin/
│       └── users/
│           └── me/
│               └── permissions/
│                   └── route.ts                    # GET /admin/users/me/permissions
├── admin/
│   ├── components/
│   │   ├── restricted-access.tsx                   # UI components for access control
│   │   └── permission-error-handler.tsx           # Global 403 handler
│   ├── lib/
│   │   └── use-permissions.ts                     # React hook for permissions
│   └── routes/
│       ├── access-denied/
│       │   └── page.tsx                           # Access denied page
│       └── orders/
│           └── page.tsx                           # Protected orders page
└── modules/
    └── role-management/
        └── utils.ts                                # Permission checking utilities
```

## Next Steps

1. **Test thoroughly** - Test with different user roles and permissions
2. **Add more protected routes** - Apply similar protection to other resources
3. **Enhance UI feedback** - Add loading states and better error messages
4. **Audit logging** - Log permission denials for security audit
5. **Role templates** - Create predefined role templates for common scenarios

## Troubleshooting

### Issue: 403 errors but no redirect

**Solution:** Check that the middleware is returning the redirect URL in the response

### Issue: Permission endpoint returns empty permissions

**Solution:**

1. Verify user has assigned roles
2. Verify roles have assigned permissions
3. Check database: `role_permission` and `user_role` tables

### Issue: Orders page still accessible without permission

**Solution:**

1. Clear browser cache
2. Restart Medusa dev server
3. Verify middleware is registered in `middlewares.ts`

### Issue: Access denied page shows wrong resource name

**Solution:** Check that the URL query parameters are being passed correctly

## Additional Resources

- [STEP3_PERMISSION_UI_RESTRICTIONS.md](./STEP3_PERMISSION_UI_RESTRICTIONS.md) - Original implementation guide
- [PERMISSION_SYSTEM_UPDATE.md](./PERMISSION_SYSTEM_UPDATE.md) - Permission system overview
- [ROLE_MANAGEMENT_GUIDE.md](./ROLE_MANAGEMENT_GUIDE.md) - Role management guide
