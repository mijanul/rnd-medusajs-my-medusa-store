# ✅ Complete RBAC Menu Protection - All Resources

## What Was Fixed

### 1. Correct Permission Format

**Your Database Structure**:

```
permission.name = "customers-list"  ← Not "perm_customers_list"
permission.name = "orders-view"
permission.name = "pages-create"
```

**Old Code** (Wrong):

```tsx
const customerPermissions = [
  "customers-list", // ✅ This was correct
  // But only for customers!
];
```

**New Code** (Correct & Dynamic):

```tsx
function hasResourcePermission(permissions, resource) {
  // Check for: "resource-list", "resource-view", etc.
  const resourcePermissions = [
    `${resource}-list`,
    `${resource}-view`,
    `${resource}-create`,
    `${resource}-update`,
    `${resource}-delete`,
    `${resource}-all`,
  ];

  return resourcePermissions.some((perm) => permissions.includes(perm));
}
```

---

### 2. Protection for ALL Resources

**Protected Resources** (menu items hidden if no permission):

- ✅ Orders (`orders-list`, `orders-view`, etc.)
- ✅ Products (`products-list`, `products-view`, etc.)
- ✅ Customers (`customers-list`, `customers-view`, etc.)
- ✅ Customer Groups (uses `customers-*` permissions)
- ✅ Inventory (`inventory-list`, `inventory-view`, etc.)
- ✅ Promotions (`promotions-list`, `promotions-view`, etc.)
- ✅ Pricing/Price Lists (`price_lists-list`, etc.)
- ✅ Pages (`pages-list`, `pages-view`, etc.)

**NOT Protected** (everyone can see):

- ⚪ Settings - As you requested, no permission check

---

### 3. Smart Route Mapping

```tsx
const protectedRoutes = [
  { path: "/app/orders", resource: "orders" },
  { path: "/app/products", resource: "products" },
  {
    path: "/app/customers",
    resource: "customers",
    excludePath: "customer-groups",
  },
  { path: "/app/customer-groups", resource: "customers" },
  { path: "/app/inventory", resource: "inventory" },
  { path: "/app/promotions", resource: "promotions" },
  { path: "/app/pricing", resource: "price_lists" },
  { path: "/app/pages", resource: "pages" },
  // Settings NOT included - everyone can access
];
```

**Key Features**:

- **Exclude Path**: Customers route has `excludePath: "customer-groups"` to avoid hiding customer-groups by mistake
- **Single Resource Check**: Customer Groups uses `customers` resource (both use same permissions)
- **Settings Exempt**: Explicitly skipped in the code

---

## How It Works

### Example: User with Only Pages Permission

**User Permissions**: `["pages-list", "pages-view", "pages-create"]`

**What Happens**:

```
Menu loads
    ↓
Widget checks each menu item:

Orders → hasResourcePermission(permissions, "orders")
         → Looking for: orders-list, orders-view, etc.
         → Found: NONE
         → Result: 🚫 HIDE

Products → hasResourcePermission(permissions, "products")
           → Looking for: products-list, products-view, etc.
           → Found: NONE
           → Result: 🚫 HIDE

Customers → hasResourcePermission(permissions, "customers")
            → Looking for: customers-list, customers-view, etc.
            → Found: NONE
            → Result: 🚫 HIDE

Pages → hasResourcePermission(permissions, "pages")
        → Looking for: pages-list, pages-view, etc.
        → Found: pages-list, pages-view, pages-create ✅
        → Result: ✅ SHOW

Settings → Explicitly skipped (no permission check)
           → Result: ✅ SHOW (always visible)
```

**User Sees**:

- ✅ Pages menu item
- ✅ Settings menu item
- ❌ All other items hidden

---

### Example: Admin with Multiple Permissions

**User Role**: Admin
**Role Permissions** (from your role_permission table):

- `pages-create`
- `pages-delete`
- `pages-list`
- `pages-update`
- `pages-view`

**What Happens**:

```
Orders → No orders-* permission → 🚫 HIDE
Products → No products-* permission → 🚫 HIDE
Customers → No customers-* permission → 🚫 HIDE
Pages → Has pages-list ✅ → ✅ SHOW
Settings → Always visible → ✅ SHOW
```

---

## Database Schema Reference

Your actual data structure:

### Permission Table

```
id                  | name            | resource | action | description
--------------------|-----------------|----------|--------|------------------
perm_customers_list | customers-list  | customers| list   | List all...
perm_orders_view    | orders-view     | orders   | view   | View item...
perm_pages_create   | pages-create    | pages    | create | Create new...
```

**Code Uses**: The `name` column → `"customers-list"`, `"orders-view"`, etc.

### Role Permission Table (Mapping)

```
role_id                     | permission_id
----------------------------|------------------
01K82P7KV5646X8MAKDYHQHYKT | perm_pages_create
01K82P7KV5646X8MAKDYHQHYKT | perm_pages_list
01K82P7KV5646X8MAKDYHQHYKT | perm_pages_view
```

### User Role Table (Assignment)

```
user_id                         | role_id
--------------------------------|---------------------------
user_01K7E7FCHWQ52N5ZY3B4XBY7DY | 01K82P7KV5646X8MAKDYHQHYKT
```

**Current Setup**: User `mijanul@theqa.in` has role `Admin` which has 5 page permissions.

---

## What Menu Items Will Show

Based on your current database:

### For User: mijanul@theqa.in (Admin Role)

**Permissions**:

- `pages-create`
- `pages-delete`
- `pages-list`
- `pages-update`
- `pages-view`

**Menu Items Visible**:

- ✅ **Pages** - Has pages-list permission
- ✅ **Settings** - No permission required (as requested)

**Menu Items Hidden**:

- 🚫 **Orders** - No orders-\* permission
- 🚫 **Products** - No products-\* permission
- 🚫 **Customers** - No customers-\* permission
- 🚫 **Customer Groups** - No customers-\* permission
- 🚫 **Inventory** - No inventory-\* permission
- 🚫 **Promotions** - No promotions-\* permission
- 🚫 **Pricing** - No price_lists-\* permission

---

## Console Output Examples

### When Widget Loads:

```
🔑 Menu Customizer - User Permissions: ["pages-list", "pages-view", "pages-create", "pages-update", "pages-delete"]

🔍 Checking orders permissions: false
   Looking for: orders-list, orders-view, etc.
   User has: []
🚫 Hiding orders menu item

🔍 Checking products permissions: false
   Looking for: products-list, products-view, etc.
   User has: []
🚫 Hiding products menu item

🔍 Checking customers permissions: false
   Looking for: customers-list, customers-view, etc.
   User has: []
🚫 Hiding customers menu item

🔍 Checking pages permissions: true
✅ Showing pages menu item
```

---

## How to Add Permissions

### Give User Access to Customers

1. **Create role_permission mapping**:

```sql
INSERT INTO role_permission (role_id, permission_id)
VALUES
  ('01K82P7KV5646X8MAKDYHQHYKT', 'perm_customers_list'),
  ('01K82P7KV5646X8MAKDYHQHYKT', 'perm_customers_view');
```

2. **Restart browser** (or hard refresh)

3. **Result**: Customers menu item will now be visible!

---

## How to Add New Protected Resource

Example: Protect a new "Reports" section

### Step 1: Add to protectedRoutes

```tsx
const protectedRoutes = [
  // ... existing routes
  { path: "/app/reports", resource: "reports" },
];
```

### Step 2: Create permissions in database

```sql
-- Add to permission table
INSERT INTO permission (id, name, resource, action, description)
VALUES
  ('perm_reports_list', 'reports-list', 'reports', 'list', 'List all reports'),
  ('perm_reports_view', 'reports-view', 'reports', 'view', 'View report details');

-- Assign to role
INSERT INTO role_permission (role_id, permission_id)
VALUES ('YOUR_ROLE_ID', 'perm_reports_list');
```

### Step 3: Done!

Widget will automatically:

- Check for `reports-list`, `reports-view`, etc.
- Hide menu item if user lacks permissions
- Show menu item if user has ANY reports-\* permission

---

## Files Modified

```
✅ src/admin/widgets/menu-customizer.tsx
   - Changed hasCustomersPermission() → hasResourcePermission(permissions, resource)
   - Added protectedRoutes array with all resources
   - Excluded settings from protection
   - Added smart route matching with excludePath
   - Dynamic permission checking based on resource name
```

---

## Testing Checklist

### Test 1: Current User (Has Only Pages Permission)

```bash
1. Login as: mijanul@theqa.in
2. Check menu:
   ✅ Should see: Pages, Settings
   ❌ Should NOT see: Orders, Products, Customers, Inventory, Promotions
3. Check console for:
   "🚫 Hiding orders menu item"
   "🚫 Hiding customers menu item"
   "✅ Showing pages menu item"
```

### Test 2: Add Customers Permission

```sql
-- Run in database:
INSERT INTO role_permission (role_id, permission_id, created_at, updated_at)
VALUES
  ('01K82P7KV5646X8MAKDYHQHYKT', 'perm_customers_list', NOW(), NOW());
```

```bash
1. Hard refresh browser (Cmd+Shift+R)
2. Check menu:
   ✅ Should NOW see: Pages, Settings, Customers
3. Check console:
   "✅ Showing customers menu item"
```

### Test 3: Settings Always Visible

```bash
1. Login as ANY user (even with NO permissions)
2. Check menu:
   ✅ Settings should ALWAYS be visible
3. Console should not show any settings-related checks
```

---

## Summary

✅ **All resources protected**: Orders, Products, Customers, Inventory, Promotions, Price Lists, Pages

✅ **Settings excluded**: Everyone can access settings (no permission check)

✅ **Dynamic permission checking**: Uses correct format `resource-action` (e.g., `pages-list`)

✅ **Smart route matching**: Handles edge cases like customer-groups

✅ **Debug logging**: Console shows exactly what's happening

✅ **Works on all pages**: Multiple zones ensure widget loads everywhere

---

**Ready to test!** 🚀

Your current user will see:

- ✅ Pages (has permission)
- ✅ Settings (no permission needed)
- 🚫 Everything else (no permission)
