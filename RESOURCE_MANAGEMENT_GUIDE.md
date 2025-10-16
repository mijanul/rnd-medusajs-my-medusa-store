# Resource Management System - Implementation Guide

## Overview

This document describes the comprehensive Resource Management System implementation following industry best practices for RBAC (Role-Based Access Control).

## System Architecture

### Database Schema

The `permission` model stores individual permissions with the following fields:

```typescript
{
  id: string (primary key)
  name: string (unique) - Format: "resource:action"
  resource: string - The resource name (e.g., "product", "order", "blog")
  action: string - The action/privilege (e.g., "list", "view", "create", "edit", "delete")
  description: string (nullable) - Human-readable description
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
}
```

### Standard CRUD Actions

Following industry best practices, the system provides 5 standard actions that cover most use cases:

1. **list** - View list of items (read-only collection view)
2. **view** - View item details (read-only single item view)
3. **create** - Create new items (write operation)
4. **edit** - Edit existing items (update operation)
5. **delete** - Delete items (delete operation)

These map to the standard CRUD operations:

- **C**reate → `create`
- **R**ead → `list` and `view`
- **U**pdate → `edit`
- **D**elete → `delete`

## API Endpoints

### 1. List All Resources

**GET** `/admin/permission-resource-management`

Returns all resources grouped by resource name with their permissions.

**Response:**

```json
{
  "resources": [
    {
      "resource": "product",
      "permissions": [...],
      "permissionCount": 5,
      "createdAt": "2025-10-16T...",
      "updatedAt": "2025-10-16T..."
    }
  ],
  "total": 10,
  "standardActions": [
    { "action": "list", "description": "View list of items", "order": 1 },
    ...
  ]
}
```

### 2. Create New Resource

**POST** `/admin/permission-resource-management`

Creates a new resource with selected permissions.

**Request Body:**

```json
{
  "resource": "blog",
  "actions": [
    { "action": "list", "description": "View list of blog posts" },
    { "action": "view", "description": "View blog post details" },
    { "action": "create", "description": "Create new blog posts" },
    { "action": "edit", "description": "Edit existing blog posts" },
    { "action": "delete", "description": "Delete blog posts" }
  ]
}
```

**Validation Rules:**

- Resource name is required and must be unique
- Resource name must match regex: `/^[a-z0-9_-]+$/i` (letters, numbers, hyphens, underscores only)
- At least one action is required
- All actions must have valid action names (no empty strings)
- No duplicate actions allowed
- Permission names are auto-generated as `resource:action`

**Response:**

```json
{
  "message": "Resource \"blog\" created successfully with 5 permission(s)",
  "resource": "blog",
  "permissions": [...]
}
```

**Error Responses:**

- `400` - Validation error (invalid format, missing fields, duplicates)
- `409` - Resource already exists
- `500` - Server error

### 3. Get Resource Permissions

**GET** `/admin/permission-resource-management/:resource`

Retrieves all permissions for a specific resource.

**Response:**

```json
{
  "resource": "blog",
  "permissions": [
    {
      "id": "perm_123",
      "name": "blog:list",
      "resource": "blog",
      "action": "list",
      "description": "View list of blog posts",
      "created_at": "2025-10-16T...",
      "updated_at": "2025-10-16T..."
    },
    ...
  ]
}
```

### 4. Update Resource Permissions

**PUT** `/admin/permission-resource-management/:resource`

Updates permissions for a resource (intelligent diff-based update).

**Request Body:**

```json
{
  "actions": [
    { "action": "list", "description": "View list of blog posts" },
    { "action": "view", "description": "View blog post details" },
    { "action": "publish", "description": "Publish blog posts" }
  ]
}
```

**Smart Update Logic:**

- **Creates** new permissions for actions that don't exist
- **Updates** descriptions for existing actions if changed
- **Deletes** permissions for actions no longer in the list
- Maintains referential integrity (auto-deletes role_permissions)

**Response:**

```json
{
  "message": "Permissions updated successfully (1 created, 2 updated, 1 deleted)",
  "resource": "blog",
  "permissions": [...],
  "changes": {
    "created": 1,
    "updated": 2,
    "deleted": 1
  }
}
```

**Error Responses:**

- `400` - Validation error (duplicate actions, invalid format)
- `404` - Resource not found
- `500` - Server error

### 5. Delete Resource

**DELETE** `/admin/permission-resource-management/:resource`

Deletes all permissions for a resource and related role_permissions.

**Response:**

```json
{
  "message": "Resource deleted successfully",
  "resource": "blog",
  "deletedCount": 5
}
```

## Frontend Implementation

### Create Resource Page

**Path:** `/rbac-manager/resource-management/create`

**Features:**

1. **Resource Name Input**

   - Real-time validation
   - Format enforcement (alphanumeric, hyphens, underscores)
   - Clear error messages

2. **Standard Permissions Section**

   - All 5 standard actions displayed with checkboxes
   - Enabled by default for quick setup
   - Customizable descriptions for each action
   - Visual status badges (Enabled/Disabled)

3. **Custom Permissions Section**

   - Add unlimited custom actions
   - Action name and description fields
   - Remove custom actions individually
   - Empty state with call-to-action

4. **Best Practices Info Box**

   - Guidelines for effective permission management
   - Industry standards reference

5. **Real-time Validation**

   - Duplicate action detection
   - Empty field validation
   - At-least-one-permission requirement

6. **Status Display**
   - Permission count badge
   - Resource name badge
   - Disabled state management

### Edit Resource Page

**Path:** `/rbac-manager/resource-management/:resource`

**Features:**

1. **Load existing permissions** for the resource
2. **Add new permissions** dynamically
3. **Edit action names and descriptions**
4. **Remove permissions** (with validation)
5. **Auto-generate permission names** (resource:action format)
6. **Duplicate detection** before saving
7. **Smart update** (diff-based, only changed permissions)

### List Resources Page

**Path:** `/rbac-manager/resource-management`

**Features:**

1. **Grid/Table view** of all resources
2. **Permission count** for each resource
3. **Filter/Search** functionality
4. **Edit** and **Delete** actions
5. **Create new resource** button
6. **Timestamps** display (created/updated)

## Best Practices Implemented

### 1. Naming Conventions

- **Resource names**: lowercase, singular, alphanumeric (e.g., `product`, `blog-post`)
- **Action names**: lowercase, verb-based (e.g., `list`, `create`, `publish`)
- **Permission names**: `resource:action` format (e.g., `product:create`, `blog:publish`)

### 2. Validation

- **Client-side validation** for immediate feedback
- **Server-side validation** for security
- **Uniqueness constraints** on resource and permission names
- **Format validation** using regex patterns
- **Duplicate detection** across actions

### 3. User Experience

- **Default selections** (all standard actions enabled by default)
- **Clear visual feedback** (badges, colors, states)
- **Helpful descriptions** and placeholders
- **Best practices guidance** in UI
- **Confirmation dialogs** for destructive actions
- **Toast notifications** for all operations

### 4. Data Integrity

- **Cascading deletes** (automatically remove role_permissions when deleting permissions)
- **Atomic operations** (all-or-nothing updates)
- **Smart diff updates** (only modify what changed)
- **Referential integrity** maintained at database and service level

### 5. Security

- **Input sanitization** on both client and server
- **SQL injection prevention** through ORM
- **Authorization checks** (admin-only routes)
- **Rate limiting** considerations
- **Audit trail** (timestamps on all records)

### 6. Scalability

- **Efficient queries** (grouped operations, bulk creates)
- **Indexed fields** (unique constraints on name)
- **Pagination-ready** (API supports filtering)
- **Cacheable responses** (GET endpoints)

## Usage Examples

### Example 1: Create a Blog Resource

```typescript
// User selects: list, view, create, edit, publish (custom)
POST /admin/permission-resource-management
{
  "resource": "blog",
  "actions": [
    { "action": "list", "description": "View all blog posts" },
    { "action": "view", "description": "View blog post details" },
    { "action": "create", "description": "Create new blog posts" },
    { "action": "edit", "description": "Edit existing blog posts" },
    { "action": "publish", "description": "Publish blog posts to public" }
  ]
}

// Creates 5 permissions:
// - blog:list
// - blog:view
// - blog:create
// - blog:edit
// - blog:publish
```

### Example 2: Update Product Resource

```typescript
// Add "export" action, remove "delete"
PUT /admin/permission-resource-management/product
{
  "actions": [
    { "action": "list", "description": "View product list" },
    { "action": "view", "description": "View product details" },
    { "action": "create", "description": "Create products" },
    { "action": "edit", "description": "Edit products" },
    { "action": "export", "description": "Export product data" }
  ]
}

// Smart update:
// - Keeps: list, view, create, edit (no changes)
// - Creates: export (new)
// - Deletes: delete (removed)
```

### Example 3: Assign Permissions to Role

```typescript
// After creating resource permissions, assign to roles
// This is handled by the Role Management system
const productPermissions = await listPermissions({ resource: "product" });
const editorRole = await getRoleBySlug("editor");

await assignPermissionsToRole(
  editorRole.id,
  productPermissions.map((p) => p.id)
);
```

## Integration Points

### 1. Role Management

- Permissions are assigned to roles via `role_permissions` table
- When a resource is deleted, all role assignments are automatically removed
- Roles can have permissions from multiple resources

### 2. User Management

- Users are assigned roles via `user_roles` table
- User permissions are computed from all assigned roles
- Permission checks use resource:action format

### 3. Middleware

- The RBAC middleware checks permissions for protected routes
- Format: `req.user.hasPermission("product:create")`
- Supports resource-level and action-level checks

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "message": "Human-readable error message",
  "error": "Technical error details (dev mode only)"
}
```

Common HTTP status codes:

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Future Enhancements

1. **Bulk Operations**

   - Create multiple resources at once
   - Bulk permission updates

2. **Templates**

   - Predefined resource templates (e.g., "E-commerce Product", "Blog System")
   - Save custom templates

3. **Permission Inheritance**

   - Parent-child resource relationships
   - Inherited permissions

4. **Advanced Actions**

   - Conditional permissions (time-based, attribute-based)
   - Permission scopes (own vs all)

5. **Analytics**

   - Permission usage statistics
   - Unused permission detection
   - Role coverage analysis

6. **Import/Export**
   - Export permissions as JSON/YAML
   - Import from file or another system

## Testing

### Unit Tests

```typescript
describe("Resource Management", () => {
  it("should create resource with standard actions", async () => {
    const response = await POST("/admin/permission-resource-management", {
      resource: "test-resource",
      actions: STANDARD_ACTIONS,
    });
    expect(response.status).toBe(201);
    expect(response.body.permissions).toHaveLength(5);
  });

  it("should prevent duplicate resource names", async () => {
    await createResource("product");
    const response = await createResource("product");
    expect(response.status).toBe(409);
  });

  it("should validate resource name format", async () => {
    const response = await createResource("Invalid Name!");
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("letters, numbers");
  });
});
```

### Integration Tests

- Test full CRUD workflow
- Test permission-role-user chain
- Test cascading deletes
- Test concurrent updates

## Conclusion

This Resource Management System provides a robust, scalable, and user-friendly solution for managing permissions in a RBAC system. It follows industry best practices, provides excellent UX, maintains data integrity, and is built for extensibility.

The system supports both standard CRUD operations and custom actions, allowing flexibility while maintaining consistency. The smart update mechanism ensures efficient database operations, and comprehensive validation prevents data corruption.

With clear documentation, consistent error handling, and intuitive UI, administrators can easily manage complex permission structures for their applications.
