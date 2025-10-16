# Role Management System Documentation

## Overview

This document describes the role-based access control (RBAC) system implemented for the Medusa store. The system provides granular permission management through roles.

## Architecture

### Database Schema

#### 1. **role** table

Stores user roles with basic information.

```sql
- id (PK, text): Unique identifier
- name (text, unique): Display name (e.g., "Super Admin")
- slug (text, unique): URL-friendly identifier (e.g., "super-admin")
- description (text, nullable): Description of the role
- is_active (boolean): Whether the role is active
- created_at (timestamptz): Creation timestamp
- updated_at (timestamptz): Last update timestamp
```

#### 2. **permission** table

Stores available permissions in the system.

```sql
- id (PK, text): Unique identifier
- name (text, unique): Permission name (e.g., "page-edit")
- resource (text): Resource type (e.g., "page", "product", "order", "all")
- action (text): Action type (e.g., "view", "add", "edit", "delete", "all")
- description (text, nullable): Description of the permission
- created_at (timestamptz): Creation timestamp
- updated_at (timestamptz): Last update timestamp
```

#### 3. **role_permission** table

Join table mapping permissions to roles (many-to-many).

```sql
- id (PK, text): Unique identifier
- role_id (FK, text): References role(id)
- permission_id (FK, text): References permission(id)
- created_at (timestamptz): Creation timestamp
- UNIQUE constraint on (role_id, permission_id)
```

#### 4. **user_role** table

Join table assigning roles to users (many-to-many).

```sql
- id (PK, text): Unique identifier
- user_id (FK, text): References user(id)
- role_id (FK, text): References role(id)
- created_at (timestamptz): Creation timestamp
- UNIQUE constraint on (user_id, role_id)
```

## Default Roles

The system comes with 4 pre-configured roles:

### 1. Super Admin (`super-admin`)

- **ID**: `role_super_admin`
- **Permissions**: All (`all-all`)
- **Description**: Full system access with all permissions
- **Use Case**: System administrators with unrestricted access

### 2. Admin (`admin`)

- **ID**: `role_admin`
- **Permissions**:
  - `page-all`: Full page management
  - `product-all`: Full product management
  - `order-all`: Full order management
  - `user-view`: View users
  - `user-edit`: Edit users
  - `role-view`: View roles
- **Description**: Administrative access to manage most resource-management
- **Use Case**: Store administrators who manage day-to-day operations

### 3. Editor (`editor`)

- **ID**: `role_editor`
- **Permissions**:
  - `page-all`: Full page management
  - `product-view`: View products
  - `product-edit`: Edit products
  - `order-view`: View orders
- **Description**: Can manage content and basic resource-management
- **Use Case**: Content managers who edit pages and products

### 4. Viewer (`viewer`)

- **ID**: `role_viewer`
- **Permissions**:
  - `page-view`: View pages
  - `product-view`: View products
  - `order-view`: View orders
- **Description**: Read-only access to view resource-management
- **Use Case**: Users who need to view data without making changes

## Permission Naming Convention

Permissions follow the `{resource}-{action}` pattern:

### Resource Management

- `all`: All resource-management
- `page`: Content pages
- `product`: Products
- `order`: Orders
- `user`: Users
- `role`: Roles and permissions

### Actions

- `all`: All actions
- `view`: Read/view access
- `add`: Create new items
- `edit`: Modify existing items
- `delete`: Remove items

### Examples

- `page-add`: Permission to create new pages
- `product-edit`: Permission to edit products
- `order-view`: Permission to view orders
- `all-all`: Permission to do everything (super admin)

## API Endpoints

### Role Management

#### List All Roles

```http
GET /admin/roles
```

Returns all roles in the system.

#### Get Specific Role

```http
GET /admin/roles/:id
```

Returns a specific role with its assigned permissions.

#### Create Role

```http
POST /admin/roles
Content-Type: application/json

{
  "name": "Content Manager",
  "slug": "content-manager",
  "description": "Manages website content",
  "is_active": true
}
```

#### Update Role

```http
PUT /admin/roles/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "is_active": true
}
```

#### Delete Role

```http
DELETE /admin/roles/:id
```

### Permission Management

#### List All Permissions

```http
GET /admin/permissions
```

Returns all available permissions.

#### Create Permission

```http
POST /admin/permissions
Content-Type: application/json

{
  "name": "brand-edit",
  "resource": "brand",
  "action": "edit",
  "description": "Can edit brands"
}
```

### Role-Permission Assignment

#### Assign Permissions to Role

```http
POST /admin/roles/:id/permissions
Content-Type: application/json

{
  "permission_ids": ["perm_page_edit", "perm_page_delete"]
}
```

#### Remove Permissions from Role

```http
DELETE /admin/roles/:id/permissions
Content-Type: application/json

{
  "permission_ids": ["perm_page_delete"]
}
```

### User-Role Assignment

#### Get User Roles

```http
GET /admin/users/:id/roles
```

Returns all roles assigned to a user.

#### Assign Roles to User

```http
POST /admin/users/:id/roles
Content-Type: application/json

{
  "role_ids": ["role_editor", "role_viewer"]
}
```

#### Remove Roles from User

```http
DELETE /admin/users/:id/roles
Content-Type: application/json

{
  "role_ids": ["role_viewer"]
}
```

## Usage Examples

### Example 1: Create a Custom Role

```typescript
// 1. Create the role
POST /admin/roles
{
  "name": "Marketing Manager",
  "slug": "marketing-manager",
  "description": "Manages marketing content and campaigns"
}

// 2. Assign permissions to the role
POST /admin/roles/role_marketing_mgr/permissions
{
  "permission_ids": [
    "perm_page_all",
    "perm_product_view",
    "perm_product_edit"
  ]
}

// 3. Assign role to user
POST /admin/users/user_123/roles
{
  "role_ids": ["role_marketing_mgr"]
}
```

### Example 2: Check User Permissions

```typescript
// Get user's roles
GET / admin / users / user_123 / roles;

// For each role, get permissions
GET / admin / roles / role_id;

// Check if user has specific permission
// Implement in your middleware/service
```

## Migration

The system is set up through a migration file that:

1. Creates all 4 tables (role, permission, role_permission, user_role)
2. Inserts default roles (super-admin, admin, editor, viewer)
3. Inserts default permissions for common resource-management
4. Assigns appropriate permissions to each role

To apply the migration:

```bash
# Generate migration
npx medusa migrations generate

# Run migration
npx medusa migrations run
```

## Best Practices

### 1. Permission Granularity

- Keep permissions as granular as possible
- Use resource-action pattern consistently
- Avoid creating redundant permissions

### 2. Role Design

- Create roles based on job functions
- Don't create too many roles (5-10 is ideal)
- Combine permissions logically

### 3. User Assignment

- Users can have multiple roles
- Permissions are additive (union of all role permissions)
- Always assign at least one role to users

### 4. Security

- Never hardcode role IDs in frontend
- Always check permissions on the backend
- Log permission changes for audit

### 5. Maintenance

- Regularly review and clean up unused roles
- Document custom roles and their purposes
- Test permission changes in development first

## Future Enhancements

1. **Permission Hierarchy**: Implement parent-child permission relationships
2. **Resource-Specific Permissions**: Add permissions for specific resource IDs
3. **Time-Based Roles**: Roles that expire after a certain time
4. **Role Templates**: Pre-configured role templates for common use cases
5. **Audit Logging**: Track all role and permission changes
6. **Permission Middleware**: Automatic route protection based on permissions
7. **Admin UI**: Visual interface for managing roles and permissions

## Troubleshooting

### Issue: User has role but can't access resource

- Check if role is active (`is_active = true`)
- Verify role has required permissions
- Check if permission resource and action match

### Issue: Permission not working

- Ensure permission is assigned to the role
- Check role_permission table for mapping
- Verify user has the role assigned

### Issue: Migration fails

- Check if tables already exist
- Verify database connection
- Check for foreign key constraints

## Support

For questions or issues, refer to:

- Medusa documentation: https://docs.medusajs.com
- Project README: /README.md
- Module README: /src/modules/role-management/README.md
