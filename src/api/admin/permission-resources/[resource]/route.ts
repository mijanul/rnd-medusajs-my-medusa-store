import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// GET /admin/permission-resources/:resource - Get all permissions for a resource
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

// PUT /admin/permission-resources/:resource - Update all permissions for a resource
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
    const allPermissions = await roleManagementService.listPermissions({});
    const existingPermissions = allPermissions.filter(
      (p: any) => p.resource === resource
    );

    // Delete all existing permissions for this resource
    for (const perm of existingPermissions) {
      await roleManagementService.deletePermissions(perm.id);
    }

    // Create new permissions
    const createdPermissions: any[] = [];
    for (const perm of permissions) {
      const created = await roleManagementService.createPermissions({
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

// DELETE /admin/permission-resources/:resource - Delete all permissions for a resource
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { resource } = req.params;

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // First get all permissions for this resource
    const allPermissions = await roleManagementService.listPermissions({});
    const permissions = allPermissions.filter(
      (p: any) => p.resource === resource
    );

    // Delete all permissions for the resource
    for (const perm of permissions) {
      await roleManagementService.deletePermissions(perm.id);
    }

    res.json({
      message: `Deleted ${permissions.length} permissions for resource: ${resource}`,
      deletedCount: permissions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete resource permissions",
      error: error.message,
    });
  }
};
