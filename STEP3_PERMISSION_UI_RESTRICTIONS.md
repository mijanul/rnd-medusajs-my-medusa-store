# Step 3: Permission-Based UI Restrictions

## Overview

This step implements permission-based access control in the admin UI:

1. ✅ API endpoint to get current user's permissions
2. ✅ Frontend hook for permission checking
3. ✅ Restricted access UI component
4. ✅ Permission gates for routes
5. ✅ Conditional rendering of action buttons

**Note:** Settings module is excluded for now (to be done manually after permission assignment).

---

## What Was Implemented

### 1. ✅ User Permissions API

**File:** `/src/api/admin/users/me/permissions/route.ts`

Endpoint to get current logged-in user's permissions:

```typescript
GET / admin / users / me / permissions;
```

**Response:**

```json
{
  "user_id": "01ABC123",
  "roles": ["role_admin"],
  "permissions": [
    {
      "id": "perm_pages_create",
      "name": "pages-create",
      "resource": "pages",
      "action": "create",
      "description": "Create new items in Pages"
    }
  ],
  "permissions_by_resource": {
    "pages": ["create", "delete", "list", "view", "update"],
    "products": ["view", "list"]
  },
  "has_permissions": true,
  "is_super_admin": false,
  "total_permissions": 15
}
```

### 2. ✅ Permission Hook

**File:** `/src/admin/lib/use-permissions.ts`

React hook for checking permissions in components:

```typescript
const { hasPermission, loading, isSuperAdmin } = useUserPermissions();

// Check single permission
if (hasPermission("pages", "create")) {
  // Show create button
}

// Check multiple permissions
if (
  hasPermissions([
    ["pages", "create"],
    ["pages", "update"],
  ])
) {
  // User has both permissions
}

// Check if user has any permission for resource
if (hasAnyPermission("pages")) {
  // User has at least one permission for pages
}
```

### 3. ✅ Restricted Access Component

**File:** `/src/admin/components/restricted-access.tsx`

UI component shown when user lacks permissions:

```typescript
<RestrictedAccess resource="pages" action="view" />
```

**Features:**

- Professional lock icon
- Clear message about missing permission
- Suggestion to contact administrator
- Customizable message

### 4. ✅ Permission Gates

Component to conditionally render based on permissions:

```typescript
<PermissionGate
  resource="pages"
  action="create"
  hasPermission={hasPermission}
  fallback={<CustomMessage />}
>
  <CreateButton />
</PermissionGate>
```

---

## How It Works

### Architecture Flow

```
User logs in
    ↓
Frontend calls /admin/users/me/permissions
    ↓
Backend:
  1. Gets user ID from auth context
  2. Fetches user's roles
  3. Fetches role permissions
  4. Returns full permission list
    ↓
Frontend:
  1. Stores permissions in hook
  2. Provides hasPermission() function
  3. Components check permissions
  4. Show/hide UI elements accordingly
```

### Permission Checking Logic

```typescript
// Super admin check
if (user.is_super_admin) return true;

// Resource + action check
if (permissions_by_resource[resource].includes(action)) return true;

// "all" action check
if (permissions_by_resource[resource].includes("all")) return true;

return false;
```

---

## Examples: Pages Module (Fully Implemented)

### List Page (`/pages`)

#### 1. Route-Level Protection

```typescript
const { hasPermission, loading } = useUserPermissions();

if (loading) {
  return <Container>Loading...</Container>;
}

if (!hasPermission("pages", "list") && !hasPermission("pages", "view")) {
  return <RestrictedAccess resource="pages" action="view" />;
}
```

#### 2. Create Button Protection

```typescript
{
  hasPermission("pages", "create") && (
    <Link to="/pages/create">
      <Button variant="primary">
        <Plus /> Create Page
      </Button>
    </Link>
  );
}
```

#### 3. Action Buttons Protection

```typescript
{
  /* Edit button - only if user has update permission */
}
{
  hasPermission("pages", "update") && (
    <Link to={`/pages/${page.id}`}>
      <Button variant="transparent" size="small">
        <PencilSquare />
      </Button>
    </Link>
  );
}

{
  /* Delete button - only if user has delete permission */
}
{
  hasPermission("pages", "delete") && (
    <Button onClick={() => handleDelete(page.id)}>
      <Trash />
    </Button>
  );
}
```

### Create Page (`/pages/create`)

```typescript
const { hasPermission, loading } = useUserPermissions();

if (loading) {
  return <Container>Loading...</Container>;
}

if (!hasPermission("pages", "create")) {
  return <RestrictedAccess resource="pages" action="create" />;
}

// Rest of the create form...
```

### Edit Page (`/pages/:id`)

```typescript
const { hasPermission, loading } = useUserPermissions();

if (loading) {
  return <Container>Loading...</Container>;
}

if (!hasPermission("pages", "update") && !hasPermission("pages", "view")) {
  return <RestrictedAccess resource="pages" action="update" />;
}

// Rest of the edit form...
```

---

## Applying to Other Modules

### Template for Any Module

#### List Page

```typescript
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";

const ModuleListPage = () => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) return <Container>Loading...</Container>;

  if (!hasPermission("module_name", "list")) {
    return <RestrictedAccess resource="module_name" action="list" />;
  }

  return (
    <Container>
      {hasPermission("module_name", "create") && <CreateButton />}

      <Table>
        {items.map((item) => (
          <TableRow>
            {/* ... */}
            <Actions>
              {hasPermission("module_name", "update") && <EditButton />}
              {hasPermission("module_name", "delete") && <DeleteButton />}
            </Actions>
          </TableRow>
        ))}
      </Table>
    </Container>
  );
};
```

#### Create/Edit Page

```typescript
const ModuleEditPage = () => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) return <Container>Loading...</Container>;

  if (!hasPermission("module_name", "update")) {
    return <RestrictedAccess resource="module_name" action="update" />;
  }

  return <Form>{/* ... */}</Form>;
};
```

---

## For Medusa Core Modules

To apply permission checks to core Medusa modules (Orders, Products, Inventory, Customers, Promotions, Price Lists):

### Example: Products Module

If you have custom routes for products at `src/admin/routes/products/`:

```typescript
// src/admin/routes/products/page.tsx
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";

const ProductsPage = () => {
  const { hasPermission, loading } = useUserPermissions();

  if (loading) return <Container>Loading...</Container>;

  if (
    !hasPermission("products", "list") &&
    !hasPermission("products", "view")
  ) {
    return <RestrictedAccess resource="products" action="view" />;
  }

  // Your products list...
};
```

### For Built-in Medusa Routes

If you want to hide sidebar items for built-in Medusa routes, you'll need to:

1. Create a custom sidebar configuration
2. Use the permission hook to filter menu items
3. Override the default admin config

**(This is more advanced and may require Medusa admin customization)**

---

## Resource Names Reference

Use these resource names when checking permissions:

| Module         | Resource Name                   |
| -------------- | ------------------------------- |
| Orders         | `orders`                        |
| Products       | `products`                      |
| Inventory      | `inventory`                     |
| Customers      | `customers`                     |
| Promotions     | `promotions`                    |
| Price Lists    | `price_lists`                   |
| Settings       | `settings` _(excluded for now)_ |
| Pages (Custom) | `pages`                         |

---

## Action Names Reference

| Action   | Description           | When to Check        |
| -------- | --------------------- | -------------------- |
| `list`   | View list of items    | List/index pages     |
| `view`   | View item details     | Detail/view pages    |
| `create` | Create new items      | Create buttons/pages |
| `update` | Update existing items | Edit buttons/pages   |
| `delete` | Delete items          | Delete buttons       |

---

## Testing Permission Restrictions

### Test Scenario 1: User with No Permissions

1. Create a test role with no permissions
2. Assign to a user
3. Login as that user
4. Navigate to `/pages`
5. **Expected:** See "Access Restricted" message

### Test Scenario 2: User with View-Only

1. Create role with only `pages-view` and `pages-list`
2. Assign to user
3. Login and navigate to `/pages`
4. **Expected:**
   - ✅ Can see pages list
   - ❌ No "Create Page" button
   - ❌ No Edit/Delete buttons

### Test Scenario 3: User with Create Permission

1. Add `pages-create` to role
2. **Expected:**
   - ✅ "Create Page" button appears
   - ✅ Can access `/pages/create`

### Test Scenario 4: Super Admin

1. Assign role with `all-all` permission
2. **Expected:**
   - ✅ Access to everything
   - ✅ All buttons visible

---

## API Usage

### Frontend: Get Current User Permissions

```typescript
const response = await fetch("/admin/users/me/permissions", {
  credentials: "include",
});

const data = await response.json();
console.log(data.permissions);
```

### Check Single Permission

```typescript
import { checkPermission } from "../lib/use-permissions";

const canCreate = await checkPermission("pages", "create");
if (canCreate) {
  // Perform action
}
```

---

## Files Created/Modified

### New Files

1. ✅ `/src/api/admin/users/me/permissions/route.ts` - Permissions API
2. ✅ `/src/admin/lib/use-permissions.ts` - Permission hook
3. ✅ `/src/admin/components/restricted-access.tsx` - UI components

### Modified Files (Pages Module)

1. ✅ `/src/admin/routes/pages/page.tsx` - List page with permissions
2. ✅ `/src/admin/routes/pages/create/page.tsx` - Create page with permissions
3. ✅ `/src/admin/routes/pages/[id]/page.tsx` - Edit page with permissions

---

## Features

### ✅ Route-Level Protection

- Checks permissions before rendering page
- Shows restricted access message if unauthorized
- Prevents access via direct URL

### ✅ UI Element Protection

- Hides create/edit/delete buttons based on permissions
- Conditional rendering of action buttons
- Clean UI without unauthorized options

### ✅ Loading States

- Shows loading indicator while fetching permissions
- Prevents flashing of unauthorized content

### ✅ Super Admin Support

- Users with `all-all` permission bypass all checks
- Full access to all features

### ✅ Flexible Permission Checks

- Check single permission: `hasPermission(resource, action)`
- Check multiple: `hasPermissions([[r1, a1], [r2, a2]])`
- Check any: `hasAnyPermission(resource)`

---

## Next Steps

### For You to Complete:

1. **Test the Pages module** with different permission combinations
2. **Assign permissions to your user** via role management UI
3. **Apply to other custom modules** (use Pages as template)
4. **Settings module** - Apply permissions manually after testing

### To Apply to Core Modules:

For each core Medusa module you want to protect:

1. Create custom admin routes (if needed)
2. Import `useUserPermissions` hook
3. Add permission checks at route level
4. Add permission checks to action buttons
5. Use resource names from the table above

---

## Troubleshooting

### Issue: Always seeing "Access Restricted"

**Cause:** User has no roles or permissions assigned
**Solution:** Assign a role with appropriate permissions via `/settings/role-management`

### Issue: Permission hook returns loading forever

**Cause:** API endpoint not responding
**Solution:** Check backend is running and `/admin/users/me/permissions` is accessible

### Issue: Buttons still showing

**Cause:** Permission check not added or incorrect resource/action name
**Solution:** Verify resource name matches database (e.g., "pages" not "page")

---

## Permission Check Patterns

### Pattern 1: Hide Feature Completely

```typescript
{
  hasPermission("pages", "create") && <CreateButton />;
}
```

### Pattern 2: Disable Feature

```typescript
<Button disabled={!hasPermission("pages", "delete")}>Delete</Button>
```

### Pattern 3: Show Different UI

```typescript
{
  hasPermission("pages", "update") ? <EditForm /> : <ReadOnlyView />;
}
```

### Pattern 4: Multiple Permission Check

```typescript
{
  hasPermissions([
    ["pages", "create"],
    ["pages", "update"],
  ]) && <AdvancedEditor />;
}
```

---

**Created:** October 21, 2025  
**Status:** Pages module fully protected ✅  
**Settings:** Excluded (to be done manually) ⏸️  
**Ready for:** Testing and applying to other modules 🚀
