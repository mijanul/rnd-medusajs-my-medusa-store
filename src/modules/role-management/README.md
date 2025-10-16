# Role Management Module

This module handles role-based access control (RBAC) for the Medusa store.

## Features

- **Roles**: Define different user roles (e.g., super-admin, admin, editor, viewer)
- **Permissions**: Granular permissions based on resource-action pattern
- **Role-Permission Mapping**: Flexible assignment of permissions to roles
- **User-Role Assignment**: Assign one or multiple roles to users

## Models

### Role

- Represents a user role (e.g., super-admin, admin, editor)
- Has a unique name and slug
- Can be activated/deactivated

### Permission

- Represents a specific permission
- Uses resource-action pattern (e.g., page-add, product-edit, all-all)
- Resource: The entity (page, product, order, all)
- Action: The operation (view, add, edit, delete, all)

### RolePermission

- Maps permissions to roles (many-to-many relationship)

### UserRole

- Assigns roles to users (many-to-many relationship)

## Usage

```typescript
const roleManagementService = container.resolve(ROLE_MANAGEMENT_MODULE);

// Create a role
const role = await roleManagementService.createRoles({
  name: "Content Editor",
  slug: "content-editor",
  description: "Can manage content pages",
  is_active: true,
});

// Create permissions
const permission = await roleManagementService.createPermissions({
  name: "page-edit",
  resource: "page",
  action: "edit",
  description: "Can edit pages",
});

// Assign permission to role
await roleManagementService.createRolePermissions({
  role_id: role.id,
  permission_id: permission.id,
});

// Assign role to user
await roleManagementService.createUserRoles({
  user_id: "user_123",
  role_id: role.id,
});
```

## Default Roles

- **super-admin**: Full system access
- **admin**: Administrative access
- **editor**: Content management access
- **viewer**: Read-only access
