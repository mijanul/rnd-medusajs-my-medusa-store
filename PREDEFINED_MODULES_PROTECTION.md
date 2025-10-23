# Protecting Medusa Predefined Modules with RBAC

This guide shows how to add role-based access control (RBAC) to Medusa's predefined modules like Orders, Products, and Customers at both UI and API levels.

## 📋 Table of Contents

1. [Overview](#overview)
2. [UI-Level Protection](#ui-level-protection)
3. [API-Level Protection](#api-level-protection)
4. [Testing](#testing)
5. [Advanced Patterns](#advanced-patterns)

## Overview

Medusa's predefined modules (Orders, Products, Customers, etc.) are built-in but can be extended with custom access controls. We achieve this by:

1. **UI Level**: Creating route overrides that check permissions before rendering
2. **API Level**: Creating middleware routes that intercept API calls

## UI-Level Protection

### How It Works

Medusa Admin SDK allows you to override routes by creating files in `src/admin/routes/` that match the path of existing routes.

### File Structure

```
src/admin/routes/
├── orders/
│   └── page.tsx          # Override orders list page
├── products/
│   └── page.tsx          # Override products list page
└── customers/
    └── page.tsx          # Override customers list page
```

### Example: Orders Page Protection

```tsx
// src/admin/routes/orders/page.tsx
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container } from "@medusajs/ui";
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";

const OrdersPage = () => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) {
    return <Container>Loading...</Container>;
  }

  // Check permission
  if (!hasPermission("orders", "list") && !hasPermission("orders", "view")) {
    return <RestrictedAccess resource="orders" action="view" />;
  }

  // Let Medusa render the default page
  return null;
};

export const config = defineRouteConfig({
  label: "Orders",
});

export default OrdersPage;
```

### What Happens?

1. User navigates to `/orders`
2. Your custom `OrdersPage` component loads first
3. It checks permissions using `useUserPermissions` hook
4. If no permission → shows `RestrictedAccess` component
5. If has permission → returns `null`, letting Medusa's default orders page render

### Permissions Checked

For each module, the following permissions are typically checked:

- **Orders**: `orders-list`, `orders-view`
- **Products**: `products-list`, `products-view`
- **Customers**: `customers-list`, `customers-view`

## API-Level Protection

### How It Works

Create custom API routes in `src/api/admin/` that intercept requests before they reach Medusa's core handlers.

### File Structure

```
src/api/admin/
├── orders/
│   ├── route.ts          # List & Create orders
│   └── [id]/
│       └── route.ts      # View, Update, Delete order
├── products/
│   ├── route.ts          # List & Create products
│   └── [id]/
│       └── route.ts      # View, Update, Delete product
└── customers/
    ├── route.ts          # List & Create customers
    └── [id]/
        └── route.ts      # View, Update, Delete customer
```

### Example: Orders API Protection

```typescript
// src/api/admin/orders/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requirePermission } from "../../../modules/role-management/middleware";

export const GET = requirePermission("orders-list")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Permission check passed, allow access
    res.status(200).json({
      message: "Access granted",
    });
  }
);

export const POST = requirePermission("orders-create")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    res.status(200).json({
      message: "Access granted",
    });
  }
);
```

### Permission Mapping

| Endpoint               | Method | Permission Required |
| ---------------------- | ------ | ------------------- |
| `/admin/orders`        | GET    | `orders-list`       |
| `/admin/orders`        | POST   | `orders-create`     |
| `/admin/orders/:id`    | GET    | `orders-view`       |
| `/admin/orders/:id`    | POST   | `orders-update`     |
| `/admin/orders/:id`    | DELETE | `orders-delete`     |
| `/admin/products`      | GET    | `products-list`     |
| `/admin/products`      | POST   | `products-create`   |
| `/admin/products/:id`  | GET    | `products-view`     |
| `/admin/products/:id`  | POST   | `products-update`   |
| `/admin/products/:id`  | DELETE | `products-delete`   |
| `/admin/customers`     | GET    | `customers-list`    |
| `/admin/customers`     | POST   | `customers-create`  |
| `/admin/customers/:id` | GET    | `customers-view`    |
| `/admin/customers/:id` | POST   | `customers-update`  |
| `/admin/customers/:id` | DELETE | `customers-delete`  |

## Testing

### 1. Verify Permissions Exist

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

This should show:

```
✓ orders: 5 permissions (create, delete, list, view, update)
✓ products: 5 permissions (create, delete, list, view, update)
✓ customers: 5 permissions (create, delete, list, view, update)
```

### 2. Test UI Restrictions

1. Login as a user WITHOUT `orders-list` permission
2. Navigate to `/orders` in admin
3. Should see "Access Restricted" message
4. Login as a user WITH `orders-list` permission
5. Should see the normal orders page

### 3. Test API Restrictions

```bash
# Without permission - should get 403
curl -X GET http://localhost:9000/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
# {
#   "message": "Forbidden: You don't have the required permission: orders-list"
# }
```

### 4. Create Test Users with Different Roles

```typescript
// Create role with limited access
const viewerRole = {
  name: "Order Viewer",
  slug: "order-viewer",
  permissions: ["orders-list", "orders-view"],
};

// Create role with full access
const managerRole = {
  name: "Order Manager",
  slug: "order-manager",
  permissions: [
    "orders-list",
    "orders-view",
    "orders-create",
    "orders-update",
    "orders-delete",
  ],
};
```

## Advanced Patterns

### 1. Hierarchical Permissions

Some users can view but not edit:

```typescript
// In your API route
export const GET = requirePermission("orders-view")(async (req, res) => {
  // Return orders data
  const orders = await getOrders();

  // Check if user can edit
  const canEdit = await userHasPermission(
    req.scope,
    req.auth_context?.actor_id,
    "orders-update"
  );

  res.json({
    orders,
    canEdit, // Frontend can disable edit buttons
  });
});
```

### 2. Conditional UI Elements

```tsx
// In your component
const OrdersList = () => {
  const { hasPermission } = useUserPermissions();

  return (
    <Container>
      {orders.map((order) => (
        <OrderCard key={order.id}>
          <OrderDetails order={order} />

          {/* Only show edit button if user has permission */}
          {hasPermission("orders", "update") && (
            <Button onClick={() => editOrder(order.id)}>Edit</Button>
          )}

          {/* Only show delete button if user has permission */}
          {hasPermission("orders", "delete") && (
            <Button onClick={() => deleteOrder(order.id)}>Delete</Button>
          )}
        </OrderCard>
      ))}
    </Container>
  );
};
```

### 3. Multiple Permission Check

Require multiple permissions:

```typescript
import { requireAnyPermission } from "../../../modules/role-management/middleware";

// User needs EITHER orders-view OR products-view
export const GET = requireAnyPermission(["orders-view", "products-view"])(
  async (req, res) => {
    // Your logic
  }
);
```

### 4. Custom Middleware Chain

```typescript
import {
  checkPermission,
  attachUserPermissions,
} from "../../../modules/role-management/middleware-advanced";

export const GET = [
  attachUserPermissions(),
  checkPermission("orders-view"),
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Access user permissions via req.userPermissions
    // or use req.hasPermission(resource, action)

    if (req.hasPermission("orders", "update")) {
      // Return editable version
    } else {
      // Return read-only version
    }
  },
];
```

## Best Practices

### ✅ DO:

1. **Always protect both UI and API** - UI protection alone is not secure
2. **Use specific permissions** - `orders-list` instead of just `orders`
3. **Check permissions early** - Before loading data or rendering UI
4. **Provide clear feedback** - Use `RestrictedAccess` component with helpful messages
5. **Test thoroughly** - Test with different user roles

### ❌ DON'T:

1. **Don't rely only on UI restrictions** - API must be protected too
2. **Don't hardcode user IDs** - Always get from auth context
3. **Don't skip loading states** - Show loading while checking permissions
4. **Don't ignore errors** - Handle permission check failures gracefully
5. **Don't forget edge cases** - What if permission system is down?

## Extending to Other Modules

To add restrictions to other Medusa modules (Inventory, Promotions, Settings, etc.):

1. **Create permissions** (if not exist):

   ```typescript
   // In seed-roles.ts, add to RESOURCES array
   { name: "inventory", description: "Inventory" },
   ```

2. **Create UI override**:

   ```bash
   # Create file structure
   mkdir -p src/admin/routes/inventory
   touch src/admin/routes/inventory/page.tsx
   ```

3. **Create API middleware**:

   ```bash
   # Create file structure
   mkdir -p src/api/admin/inventory
   touch src/api/admin/inventory/route.ts
   ```

4. **Test and verify**:
   ```bash
   npx medusa exec ./src/scripts/verify-permissions.ts
   ```

## Troubleshooting

### Permission Check Always Fails

- Check if permissions exist in database
- Verify user has role assigned
- Check role has permissions assigned
- Look at browser console for errors
- Check API logs for permission query errors

### UI Shows Access Denied but API Works

- Check `useUserPermissions` hook implementation
- Verify permission names match exactly
- Check for case sensitivity issues
- Clear browser cache

### API Shows 403 but User Has Permission

- Check middleware is using correct permission name
- Verify auth token is valid
- Check database for role-permission relationships
- Enable debug logging in middleware

## Quick Reference

```bash
# Verify all permissions
npx medusa exec ./src/scripts/verify-permissions.ts

# Seed new permissions
npx medusa exec ./src/scripts/seed-roles.ts

# Check role assignments
npx medusa exec ./src/scripts/verify-roles.ts

# Test permission system
npx medusa exec ./src/scripts/test-permission-case-insensitive.ts
```

## Summary

You now have:

✅ **UI Protection** - Orders, Products, Customers pages check permissions
✅ **API Protection** - All CRUD endpoints protected with middleware
✅ **Reusable Components** - `RestrictedAccess`, `PermissionGate`
✅ **Flexible Middleware** - Basic and advanced permission checks
✅ **Documentation** - Clear examples and patterns

The same pattern can be applied to any Medusa module or custom resource!
