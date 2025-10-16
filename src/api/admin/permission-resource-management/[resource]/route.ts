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
  const { permissions } = body;

  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      message: "Permissions array is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Get existing permissions for this resource
    const existingPermissions =
      await roleManagementService.getPermissionsByResource(resource);

    // Delete all existing permissions for this resource
    for (const perm of existingPermissions) {
      await roleManagementService.deletePermission(perm.id);
    }

    // Create new permissions
    const createdPermissions: any[] = [];
    for (const perm of permissions) {
      const created = await roleManagementService.createPermission({
        name: `${resource}-${perm.action}`,
        resource: resource,
        action: perm.action,
        description: perm.description || "",
      });
      createdPermissions.push(created);
    }

    res.json({
      message: "Permissions updated successfully",
      resource,
      permissions: createdPermissions,
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
