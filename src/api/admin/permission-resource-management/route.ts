import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// Standard CRUD actions following industry best practices
export const STANDARD_ACTIONS = [
  { action: "list", description: "View list of items", order: 1 },
  { action: "view", description: "View item details", order: 2 },
  { action: "create", description: "Create new items", order: 3 },
  { action: "edit", description: "Edit existing items", order: 4 },
  { action: "delete", description: "Delete items", order: 5 },
];

// GET /admin/permission-resource-management - List all unique resources with their permissions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Get all permissions
    const permissions = await roleManagementService.listPermissions({});

    // Group permissions by resource
    const resourceMap = new Map<string, any>();

    permissions.forEach((perm: any) => {
      if (!resourceMap.has(perm.resource)) {
        resourceMap.set(perm.resource, {
          resource: perm.resource,
          permissions: [],
          permissionCount: 0,
          createdAt: perm.created_at,
          updatedAt: perm.updated_at,
        });
      }
      const resourceData = resourceMap.get(perm.resource);
      resourceData.permissions.push(perm);
      resourceData.permissionCount = resourceData.permissions.length;

      // Update timestamps to show the most recent
      if (new Date(perm.updated_at) > new Date(resourceData.updatedAt)) {
        resourceData.updatedAt = perm.updated_at;
      }
    });

    const resources = Array.from(resourceMap.values()).sort((a, b) =>
      a.resource.localeCompare(b.resource)
    );

    res.json({
      resources,
      total: resources.length,
      standardActions: STANDARD_ACTIONS,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
};

// POST /admin/permission-resource-management - Create a new resource with permissions
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any;
  const { resource, actions = [] } = body;

  // Validation
  if (!resource || typeof resource !== "string") {
    return res.status(400).json({
      message: "Resource name is required and must be a string",
    });
  }

  // Validate resource name format (alphanumeric, hyphens, underscores only)
  const resourceNameRegex = /^[a-z0-9_-]+$/i;
  if (!resourceNameRegex.test(resource)) {
    return res.status(400).json({
      message:
        "Resource name can only contain letters, numbers, hyphens, and underscores",
    });
  }

  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({
      message: "At least one action is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if resource already exists
    const existingPermissions =
      await roleManagementService.getPermissionsByResource(resource);
    if (existingPermissions.length > 0) {
      return res.status(409).json({
        message: `Resource "${resource}" already exists`,
      });
    }

    // Validate actions
    const validActions = new Set(
      actions.map((a: any) => a.action?.trim()).filter(Boolean)
    );
    if (validActions.size === 0) {
      return res.status(400).json({
        message: "All actions must have a valid action name",
      });
    }

    // Check for duplicate actions
    if (validActions.size !== actions.length) {
      return res.status(400).json({
        message: "Duplicate actions are not allowed",
      });
    }

    // Create each permission
    const createdPermissions: any[] = [];
    for (const permData of actions) {
      const action = permData.action?.trim();
      if (!action) continue;

      const created = await roleManagementService.createPermission({
        name: `${resource.toLowerCase().trim()}-${action}`,
        resource: resource.trim(),
        action: action,
        description:
          permData.description || `${action} permission for ${resource}`,
      });
      createdPermissions.push(created);
    }

    res.status(201).json({
      message: `Resource "${resource}" created successfully with ${createdPermissions.length} permission(s)`,
      resource: resource,
      permissions: createdPermissions,
    });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.message?.includes("unique") || error.code === "23505") {
      return res.status(409).json({
        message: "A permission with this name already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create resource",
      error: error.message,
    });
  }
};
