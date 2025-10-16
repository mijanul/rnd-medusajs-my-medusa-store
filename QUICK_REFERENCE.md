# Role Management - Quick Reference Card

## 🎯 Default Roles

| Role        | Slug          | ID                 | Description           |
| ----------- | ------------- | ------------------ | --------------------- |
| Super Admin | `super-admin` | `role_super_admin` | Full system access    |
| Admin       | `admin`       | `role_admin`       | Administrative access |
| Editor      | `editor`      | `role_editor`      | Content management    |
| Viewer      | `viewer`      | `role_viewer`      | Read-only access      |

## 🔑 Permission Format

`{resource}-{action}`

**Resources**: all, page, product, order, user, role
**Actions**: all, view, add, edit, delete

**Examples**: `page-edit`, `product-all`, `all-all`

## 📡 API Endpoints

```
GET    /admin/roles                    List roles
POST   /admin/roles                    Create role
GET    /admin/roles/:id                Get role
GET    /admin/permissions              List permissions
POST   /admin/roles/:id/permissions    Assign permissions
GET    /admin/users/:id/roles          Get user roles
POST   /admin/users/:id/roles          Assign role to user
```

## 🛡️ Middleware Usage

```typescript
import {
  requirePermission,
  requireRole,
  requireSuperAdmin,
} from "./modules/role-management/middleware";

// By permission
export const GET = requirePermission("page-view")(handler);

// By role
export const GET = requireRole("admin")(handler);

// Super admin only
export const GET = requireSuperAdmin()(handler);
```

## 🔧 Utility Functions

```typescript
import {
  userHasPermission,
  userHasRole,
  getUserPermissions,
  isSuperAdmin,
} from "./modules/role-management/utils";

// Check permission
const canEdit = await userHasPermission(container, userId, "page-edit");

// Check role
const isAdmin = await userHasRole(container, userId, "admin");

// Get all permissions
const perms = await getUserPermissions(container, userId);

// Check super admin
const isSuperAdm = await isSuperAdmin(container, userId);
```

## 🚀 Quick Actions

### Assign Super Admin

```bash
POST /admin/users/{user_id}/roles
{ "role_ids": ["role_super_admin"] }
```

### Create Custom Role

```bash
POST /admin/roles
{
  "name": "Manager",
  "slug": "manager",
  "description": "Team manager"
}
```

### Assign Permissions

```bash
POST /admin/roles/{role_id}/permissions
{ "permission_ids": ["perm_page_all"] }
```

## 📊 Default Permission Distribution

**Super Admin**: all-all (1 permission = everything)

**Admin**: 6 permissions

- page-all, product-all, order-all
- user-view, user-edit, role-view

**Editor**: 4 permissions

- page-all, product-view, product-edit, order-view

**Viewer**: 3 permissions

- page-view, product-view, order-view

## ✅ Verification

```bash
npx medusa exec ./src/scripts/verify-roles.ts
```

## 📖 Documentation

- **IMPLEMENTATION_SUMMARY.md** - Complete overview
- **ROLE_MANAGEMENT_GUIDE.md** - Full documentation
- **MIDDLEWARE_EXAMPLES.md** - Code examples
- **ROLE_MANAGEMENT_SETUP.md** - Setup details

## 🔍 Permission IDs

```
perm_all_all          # Super admin
perm_page_view        perm_page_add
perm_page_edit        perm_page_delete
perm_page_all
perm_product_view     perm_product_add
perm_product_edit     perm_product_delete
perm_product_all
perm_order_view       perm_order_edit
perm_order_all
perm_user_view        perm_user_add
perm_user_edit        perm_user_delete
perm_user_all
perm_role_view        perm_role_add
perm_role_edit        perm_role_delete
perm_role_all
```

## 💡 Common Patterns

### Protect Route

```typescript
export const DELETE = requirePermission("page-delete")(async (req, res) => {
  // Route logic
});
```

### Manual Check

```typescript
const hasAccess = await userHasPermission(req.scope, userId, "page-edit");
if (!hasAccess) {
  return res.status(403).json({ message: "Forbidden" });
}
```

### Get User Context

```typescript
const roles = await getUserRoles(req.scope, userId);
const permissions = await getUserPermissions(req.scope, userId);
```

## ⚠️ Important Notes

- Super admin bypasses all checks (`all-all` permission)
- Users can have multiple roles
- Permissions are additive (union of all role permissions)
- Always check permissions on backend
- Soft deletes enabled on all tables

## 🎯 Status Codes

- `401` - Not authenticated
- `403` - Missing permission/role
- `500` - Permission check error

---

**Quick Start**: Assign super-admin role → Protect routes → Test with different roles

For detailed examples, see **MIDDLEWARE_EXAMPLES.md**
