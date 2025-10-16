import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// POST /admin/roles/:id/permissions - Assign permissions to a role
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const body = req.body as any;
  const { permission_ids } = body;

  if (!permission_ids || !Array.isArray(permission_ids)) {
    return res.status(400).json({
      message: "permission_ids array is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Verify role exists
    const role = await roleManagementService.getRoleById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Verify all permissions exist
    for (const permId of permission_ids) {
      const permission = await roleManagementService.getPermissionById(permId);
      if (!permission) {
        return res.status(404).json({
          message: `Permission with id ${permId} not found`,
        });
      }
    }

    // Assign permissions to role
    const assigned = await roleManagementService.assignPermissionsToRole(
      id,
      permission_ids
    );

    res.status(201).json({
      message: "Permissions assigned successfully",
      role_id: id,
      assigned_count: assigned.length,
      assignments: assigned,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to assign permissions",
      error: error.message,
    });
  }
};

// DELETE /admin/roles/:id/permissions - Remove permissions from a role
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const body = req.body as any;
  const { permission_ids } = body;

  if (!permission_ids || !Array.isArray(permission_ids)) {
    return res.status(400).json({
      message: "permission_ids array is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Verify role exists
    const role = await roleManagementService.getRoleById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Remove permissions from role
    const removed = await roleManagementService.removePermissionsFromRole(
      id,
      permission_ids
    );

    res.json({
      message: "Permissions removed successfully",
      role_id: id,
      removed_count: removed.length,
      removals: removed,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to remove permissions",
      error: error.message,
    });
  }
};
