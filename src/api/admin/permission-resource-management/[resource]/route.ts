import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// GET /admin/permission-resource-management/:resource - Get all permissions for a resource
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { resource } = req.params;

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Get all permissions and filter by resource
    const allPermissions = await roleManagementService.listPermissions({});
    const permissions = allPermissions.filter(
      (p: any) => p.resource === resource
    );

    res.json({
      resource,
      permissions,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch permissions for resource",
      error: error.message,
    });
  }
};

// PUT /admin/permission-resource-management/:resource - Update all permissions for a resource
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const { resource } = req.params;
  const body = req.body as any;
  const { actions = [] } = body;

  if (!Array.isArray(actions)) {
    return res.status(400).json({
      message: "Actions array is required",
    });
  }

  if (actions.length === 0) {
    return res.status(400).json({
      message: "At least one action is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if resource exists
    const existingPermissions =
      await roleManagementService.getPermissionsByResource(resource);

    if (existingPermissions.length === 0) {
      return res.status(404).json({
        message: `Resource "${resource}" not found`,
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

    // Map existing permissions by action for comparison
    const existingMap = new Map(
      existingPermissions.map((p: any) => [p.action, p])
    );

    const toDelete: any[] = [];
    const toCreate: any[] = [];
    const toUpdate: any[] = [];

    // Determine what needs to be deleted
    for (const existing of existingPermissions) {
      if (!validActions.has(existing.action)) {
        toDelete.push(existing);
      }
    }

    // Determine what needs to be created or updated
    for (const actionData of actions) {
      const action = actionData.action?.trim();
      if (!action) continue;

      const existing = existingMap.get(action);
      if (existing) {
        // Check if description changed
        if (
          existing.description !==
          (actionData.description || `${action} permission for ${resource}`)
        ) {
          toUpdate.push({
            id: existing.id,
            description:
              actionData.description || `${action} permission for ${resource}`,
          });
        }
      } else {
        toCreate.push({
          action,
          description:
            actionData.description || `${action} permission for ${resource}`,
        });
      }
    }

    // Execute changes
    const results = {
      deleted: 0,
      created: 0,
      updated: 0,
    };

    // Delete removed permissions
    for (const perm of toDelete) {
      await roleManagementService.deletePermission(perm.id);
      results.deleted++;
    }

    // Create new permissions
    const createdPermissions: any[] = [];
    for (const permData of toCreate) {
      const action = permData.action.trim().toLowerCase();
      const created = await roleManagementService.createPermission({
        name: `${resource.trim().toLowerCase()}-${action}`,
        resource: resource.trim(),
        action: action,
        description: permData.description,
      });
      createdPermissions.push(created);
      results.created++;
    }

    // Update existing permissions
    for (const permData of toUpdate) {
      await roleManagementService.updatePermission(permData.id, {
        description: permData.description,
      });
      results.updated++;
    }

    // Get final state
    const finalPermissions =
      await roleManagementService.getPermissionsByResource(resource);

    res.json({
      message: `Permissions updated successfully (${results.created} created, ${results.updated} updated, ${results.deleted} deleted)`,
      resource,
      permissions: finalPermissions,
      changes: results,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to update permissions",
      error: error.message,
    });
  }
};

// DELETE /admin/permission-resource-management/:resource - Delete all permissions for a resource
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { resource } = req.params;
  console.log(
    `[DEBUG] DELETE /admin/permission-resource-management/${resource}`
  );

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Get all permissions for this resource
    const permissions = await roleManagementService.getPermissionsByResource(
      resource
    );

    console.log(
      `[DEBUG] Found ${permissions.length} permissions for resource: ${resource}`
    );

    // Delete all permissions for the resource (this will also handle related role_permissions)
    const deleted = await roleManagementService.deletePermissionsByResource(
      resource
    );

    res.json({
      message: `Deleted ${deleted.length} permissions for resource: ${resource}`,
      deletedCount: deleted.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete resource permissions",
      error: error.message,
    });
  }
};
