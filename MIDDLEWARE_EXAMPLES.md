# Role Management Middleware Examples

## Basic Usage

### Protect a route with a permission

```typescript
// src/api/admin/pages/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requirePermission } from "../../../modules/role-management/middleware";

// Only users with "page-view" permission can access this
export const GET = requirePermission("page-view")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Your route logic here
    res.json({ pages: [] });
  }
);

// Only users with "page-add" permission can access this
export const POST = requirePermission("page-add")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Your route logic here
    res.json({ message: "Page created" });
  }
);
```

### Protect a route with a role

```typescript
// src/api/admin/settings/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requireRole } from "../../../modules/role-management/middleware";

// Only users with "admin" role can access this
export const GET = requireRole("admin")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Your route logic here
    res.json({ settings: {} });
  }
);
```

### Require super admin access

```typescript
// src/api/admin/system/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requireSuperAdmin } from "../../../modules/role-management/middleware";

// Only super admins can access this
export const GET = requireSuperAdmin()(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Your route logic here
    res.json({ systemInfo: {} });
  }
);
```

### Require any of multiple permissions

```typescript
// src/api/admin/content/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requireAnyPermission } from "../../../modules/role-management/middleware";

// Users need either "page-view" OR "product-view" permission
export const GET = requireAnyPermission(["page-view", "product-view"])(
  async (req: MedusaRequest, res: MedusaResponse) => {
    // Your route logic here
    res.json({ content: [] });
  }
);
```

## Advanced Usage

### Check permissions manually in route logic

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  userHasPermission,
  getUserPermissions,
} from "../../../modules/role-management/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const userId = (req as any).auth?.actor_id;

  // Check specific permission
  const canEdit = await userHasPermission(req.scope, userId, "page-edit");

  if (canEdit) {
    // Return editable pages
    res.json({ pages: [], editable: true });
  } else {
    // Return read-only pages
    res.json({ pages: [], editable: false });
  }
};
```

### Get all user permissions

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  getUserPermissions,
  getUserRoles,
} from "../../../modules/role-management/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const userId = (req as any).auth?.actor_id;

  const permissions = await getUserPermissions(req.scope, userId);
  const roles = await getUserRoles(req.scope, userId);

  res.json({
    user_id: userId,
    roles,
    permissions,
  });
};
```

### Check if user is super admin

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { isSuperAdmin } from "../../../modules/role-management/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const userId = (req as any).auth?.actor_id;

  const isSuperAdminUser = await isSuperAdmin(req.scope, userId);

  if (isSuperAdminUser) {
    // Return all data including sensitive info
    res.json({ data: [], admin: true });
  } else {
    // Return limited data
    res.json({ data: [], admin: false });
  }
};
```

## Combining Permissions

### Require multiple permissions (AND logic)

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { userHasAllPermissions } from "../../../modules/role-management/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const userId = (req as any).auth?.actor_id;

  // User must have BOTH permissions
  const hasAllPerms = await userHasAllPermissions(req.scope, userId, [
    "page-add",
    "page-edit",
  ]);

  if (!hasAllPerms) {
    return res.status(403).json({
      message: "You need both page-add and page-edit permissions",
    });
  }

  // Your route logic here
  res.json({ message: "Success" });
};
```

## Protecting Existing Routes

### Example: Protect page management routes

```typescript
// src/api/admin/pages/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { requirePermission } from "../../../modules/role-management/middleware";

// List pages - requires "page-view"
export const GET = requirePermission("page-view")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: pages } = await query.graph({
      entity: "page",
      fields: ["id", "title", "slug", "is_published"],
    });

    res.json({ pages });
  }
);

// Create page - requires "page-add"
export const POST = requirePermission("page-add")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Create page logic...

    res.status(201).json({ message: "Page created" });
  }
);
```

```typescript
// src/api/admin/pages/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requirePermission } from "../../../../modules/role-management/middleware";

// Get page - requires "page-view"
export const GET = requirePermission("page-view")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params;
    // Get page logic...
    res.json({ page: {} });
  }
);

// Update page - requires "page-edit"
export const PUT = requirePermission("page-edit")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params;
    // Update page logic...
    res.json({ message: "Page updated" });
  }
);

// Delete page - requires "page-delete"
export const DELETE = requirePermission("page-delete")(
  async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params;
    // Delete page logic...
    res.json({ message: "Page deleted" });
  }
);
```

## Error Responses

The middleware returns standard HTTP status codes:

- **401 Unauthorized**: User is not authenticated
- **403 Forbidden**: User doesn't have required permission/role
- **500 Internal Server Error**: Error checking permissions

### Example error responses:

```json
// 401 - Not authenticated
{
  "message": "Unauthorized: No user found"
}

// 403 - Missing permission
{
  "message": "Forbidden: You don't have the required permission: page-edit"
}

// 403 - Missing role
{
  "message": "Forbidden: You don't have the required role: admin"
}

// 403 - Not super admin
{
  "message": "Forbidden: Super admin access required"
}
```

## Best Practices

1. **Use the most specific permission**: Instead of checking for "page-all", check for "page-edit" if that's what you need.

2. **Layer your security**: Use middleware for route protection AND check permissions in your business logic.

3. **Super admin bypass**: Super admins (with "all-all" permission) automatically pass all permission checks.

4. **Error handling**: Always handle permission errors gracefully in your frontend.

5. **Testing**: Test with different user roles to ensure permissions work as expected.

6. **Documentation**: Document which permissions are required for each route.

## Frontend Integration

When calling protected endpoints from your frontend:

```typescript
// Check if request failed due to permissions
try {
  const response = await fetch("/admin/pages", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 403) {
    // User doesn't have permission
    showError("You don't have permission to view pages");
  } else if (response.status === 401) {
    // User not authenticated
    redirectToLogin();
  }
} catch (error) {
  console.error("Error:", error);
}
```

## Next Steps

1. Apply middleware to your existing routes
2. Test with different user roles
3. Add frontend permission checks
4. Create custom permissions for your specific needs
5. Build an admin UI for permission management
