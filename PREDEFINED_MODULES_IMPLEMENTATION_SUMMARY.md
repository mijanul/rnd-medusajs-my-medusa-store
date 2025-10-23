# 🎯 RBAC for Predefined Modules - Implementation Summary

## ✅ What Has Been Implemented

### 1. UI-Level Protection

**Files Created:**

- `/src/admin/routes/orders/page.tsx` - Orders list page with permission check
- `/src/admin/routes/products/page.tsx` - Products list page with permission check
- `/src/admin/routes/customers/page.tsx` - Customers list page with permission check

**How it works:**

- Each page checks permissions using `useUserPermissions` hook
- If user lacks permission, shows `RestrictedAccess` component
- If user has permission, renders normal Medusa page

**Protected Resources:**

- ✅ Orders (requires `orders-list` or `orders-view`)
- ✅ Products (requires `products-list` or `products-view`)
- ✅ Customers (requires `customers-list` or `customers-view`)

### 2. API-Level Protection

**Files Created:**

**Orders:**

- `/src/api/admin/orders/route.ts` - List & Create
- `/src/api/admin/orders/[id]/route.ts` - View, Update, Delete

**Products:**

- `/src/api/admin/products/route.ts` - List & Create
- `/src/api/admin/products/[id]/route.ts` - View, Update, Delete

**Customers:**

- `/src/api/admin/customers/route.ts` - List & Create
- `/src/api/admin/customers/[id]/route.ts` - View, Update, Delete

**Protected Endpoints:**

| Resource  | Endpoint               | Method | Permission Required |
| --------- | ---------------------- | ------ | ------------------- |
| Orders    | `/admin/orders`        | GET    | `orders-list`       |
| Orders    | `/admin/orders`        | POST   | `orders-create`     |
| Orders    | `/admin/orders/:id`    | GET    | `orders-view`       |
| Orders    | `/admin/orders/:id`    | POST   | `orders-update`     |
| Orders    | `/admin/orders/:id`    | DELETE | `orders-delete`     |
| Products  | `/admin/products`      | GET    | `products-list`     |
| Products  | `/admin/products`      | POST   | `products-create`   |
| Products  | `/admin/products/:id`  | GET    | `products-view`     |
| Products  | `/admin/products/:id`  | POST   | `products-update`   |
| Products  | `/admin/products/:id`  | DELETE | `products-delete`   |
| Customers | `/admin/customers`     | GET    | `customers-list`    |
| Customers | `/admin/customers`     | POST   | `customers-create`  |
| Customers | `/admin/customers/:id` | GET    | `customers-view`    |
| Customers | `/admin/customers/:id` | POST   | `customers-update`  |
| Customers | `/admin/customers/:id` | DELETE | `customers-delete`  |

### 3. Advanced Middleware

**File Created:**

- `/src/modules/role-management/middleware-advanced.ts`

**Functions:**

- `checkPermission()` - Express-style middleware
- `attachUserPermissions()` - Adds permissions to request object
- `requirePermissionWithFallback()` - With custom fallback handlers
- `conditionalPermission()` - Different handlers based on permission

### 4. Documentation

**Files Created:**

- `PREDEFINED_MODULES_PROTECTION.md` - Complete guide with examples
- `PREDEFINED_MODULES_TEST_GUIDE.md` - Testing checklist and scenarios
- `/src/api/admin/orders/EXAMPLES.ts` - Advanced usage examples

## 🚀 Quick Start

### Step 1: Ensure Permissions Exist

```bash
npx medusa exec ./src/scripts/seed-roles.ts
```

### Step 2: Verify Permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

Expected output:

```
✓ orders: 5 permissions
✓ products: 5 permissions
✓ customers: 5 permissions
```

### Step 3: Assign Permissions to Roles

Option A: Via SQL

```sql
-- Give "manager" role all order permissions
INSERT INTO role_permission (id, role_id, permission_id, created_at, updated_at)
SELECT
  'rp_' || gen_random_uuid()::text,
  (SELECT id FROM role WHERE slug = 'manager'),
  id,
  NOW(),
  NOW()
FROM permission
WHERE resource = 'orders';
```

Option B: Via Admin UI

1. Go to `/roles` in admin panel
2. Edit a role
3. Check the desired permissions
4. Save

### Step 4: Test

1. Login as user with restricted access
2. Try to access `/orders` → Should show "Access Restricted"
3. Try API call → Should get 403 Forbidden
4. Assign permissions to user's role
5. Refresh page → Should now work

## 📊 Permission Matrix

### Standard Permissions (Already Created)

Each resource has 5 standard permissions:

| Action   | Description              | Used For                         |
| -------- | ------------------------ | -------------------------------- |
| `list`   | View list of items       | List pages, search, filters      |
| `view`   | View single item details | Detail pages, view mode          |
| `create` | Create new items         | Create forms, POST endpoints     |
| `update` | Modify existing items    | Edit forms, PUT/PATCH endpoints  |
| `delete` | Remove items             | Delete buttons, DELETE endpoints |

### Custom Permissions (Optional)

You can add more granular permissions:

```typescript
// In seed-roles.ts, add to permission array:
{
  name: "orders-export",
  resource: "orders",
  action: "export",
  description: "Export orders to CSV/Excel"
},
{
  name: "orders-view-financials",
  resource: "orders",
  action: "view-financials",
  description: "View cost, margin, and financial data"
},
{
  name: "orders-update-status",
  resource: "orders",
  action: "update-status",
  description: "Change order status (pending, processing, etc.)"
}
```

## 🎨 UI Patterns

### Pattern 1: Hide Elements Based on Permission

```tsx
import { useUserPermissions } from "../lib/use-permissions";

const OrdersList = () => {
  const { hasPermission } = useUserPermissions();

  return (
    <div>
      {/* Only show create button if user can create */}
      {hasPermission("orders", "create") && (
        <Button onClick={handleCreate}>Create Order</Button>
      )}

      {/* Only show delete button if user can delete */}
      {hasPermission("orders", "delete") && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
};
```

### Pattern 2: Show Read-Only View

```tsx
const OrderDetail = ({ orderId }) => {
  const { hasPermission } = useUserPermissions();
  const canEdit = hasPermission("orders", "update");

  return (
    <div>
      {canEdit ? (
        <Input value={orderData} onChange={handleChange} />
      ) : (
        <Text>{orderData}</Text>
      )}
    </div>
  );
};
```

### Pattern 3: Entire Page Protection

```tsx
const OrdersPage = () => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) return <Loading />;

  if (!hasPermission("orders", "list")) {
    return <RestrictedAccess resource="orders" action="view" />;
  }

  return <OrdersContent />;
};
```

## 🔒 API Patterns

### Pattern 1: Simple Permission Check

```typescript
import { requirePermission } from "../../../modules/role-management/middleware";

export const GET = requirePermission("orders-list")(async (req, res) => {
  // Your logic here
  res.json({ orders: [] });
});
```

### Pattern 2: Multiple Permission Options

```typescript
import { requireAnyPermission } from "../../../modules/role-management/middleware";

export const GET = requireAnyPermission(["orders-list", "orders-view"])(
  async (req, res) => {
    res.json({ orders: [] });
  }
);
```

### Pattern 3: Conditional Response

```typescript
export const GET = requirePermission("orders-view")(async (req, res) => {
  const userId = req.auth_context?.actor_id;
  const canEdit = await userHasPermission(req.scope, userId, "orders-update");

  res.json({
    orders: [],
    canEdit, // Frontend uses this to show/hide buttons
  });
});
```

### Pattern 4: Field-Level Protection

```typescript
export const GET = requirePermission("orders-view")(async (req, res) => {
  const userId = req.auth_context?.actor_id;
  const canSeeFinancials = await userHasPermission(
    req.scope,
    userId,
    "orders-view-financials"
  );

  const order = await getOrder(req.params.id);

  if (!canSeeFinancials) {
    delete order.cost;
    delete order.margin;
  }

  res.json(order);
});
```

## 🧪 Testing Scenarios

### Test 1: No Access

- User has NO permissions for orders
- ❌ Cannot see `/orders` page
- ❌ Cannot call any `/admin/orders` endpoints
- ✅ Should see "Access Restricted" message

### Test 2: View Only

- User has `orders-list` and `orders-view` permissions
- ✅ Can see `/orders` page
- ✅ Can call GET endpoints
- ❌ Cannot create/update/delete
- ❌ Should get 403 on POST/DELETE endpoints

### Test 3: Full Access

- User has all order permissions
- ✅ Can see all pages
- ✅ Can call all endpoints
- ✅ Can perform all operations

## 🔧 Extending to Other Modules

To add protection to other modules (e.g., Inventory, Promotions):

### 1. Ensure Permissions Exist

```bash
# Check if permissions exist
npx medusa exec ./src/scripts/verify-permissions.ts

# If not, add to seed-roles.ts:
{ name: "inventory", description: "Inventory" }
```

### 2. Create UI Override

```bash
mkdir -p src/admin/routes/inventory
```

Create `src/admin/routes/inventory/page.tsx`:

```tsx
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";

const InventoryPage = () => {
  const { hasPermission, loading } = useUserPermissions();
  if (loading) return <div>Loading...</div>;
  if (!hasPermission("inventory", "list")) {
    return <RestrictedAccess resource="inventory" action="view" />;
  }
  return null;
};

export default InventoryPage;
```

### 3. Create API Protection

```bash
mkdir -p src/api/admin/inventory
```

Create `src/api/admin/inventory/route.ts`:

```typescript
import { requirePermission } from "../../../modules/role-management/middleware";

export const GET = requirePermission("inventory-list")(async (req, res) => {
  res.json({ message: "Access granted" });
});
```

## 📝 Common Issues & Solutions

### Issue: Permission check always fails

**Solutions:**

1. Verify permissions exist: `npx medusa exec ./src/scripts/verify-permissions.ts`
2. Check user has role assigned: Query `user_role` table
3. Check role has permissions: Query `role_permission` table
4. Check permission names match exactly (case-insensitive)

### Issue: UI works but API doesn't (or vice versa)

**Solution:** Both need to be protected independently:

- UI: Create route override in `src/admin/routes/`
- API: Create middleware in `src/api/admin/`

### Issue: Getting "actor_id undefined"

**Solution:** Ensure you're accessing authenticated routes:

- Check JWT token is valid
- Verify auth middleware is applied
- Use `req.auth_context?.actor_id` with optional chaining

## 📚 Next Steps

1. **Add more granular permissions** for specific actions
2. **Implement audit logging** to track who accesses what
3. **Create permission templates** for common roles
4. **Build permission management UI** for admins
5. **Add data-level restrictions** (e.g., users can only see their region's orders)

## 🎉 Summary

You now have:

✅ **UI Protection** - Orders, Products, Customers pages check permissions
✅ **API Protection** - All CRUD endpoints protected with middleware  
✅ **Reusable Components** - `RestrictedAccess`, `PermissionGate`
✅ **Flexible Middleware** - Basic and advanced permission checks
✅ **Complete Documentation** - Examples, tests, patterns
✅ **Extensible System** - Easy to add more modules

The same pattern works for ANY resource - custom modules, Medusa modules, or new features you build!
