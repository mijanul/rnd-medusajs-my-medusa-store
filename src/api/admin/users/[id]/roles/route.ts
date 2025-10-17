import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// GET /admin/users/:id/roles - Get roles assigned to a user
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { data: userRoles } = await query.graph({
    entity: "user_role",
    fields: ["role_id"],
    filters: { user_id: id },
  });

  const roleIds = userRoles.map((ur: any) => ur.role_id);

  let roles: any[] = [];
  if (roleIds.length > 0) {
    const { data: rolesData } = await query.graph({
      entity: "role",
      fields: ["id", "name", "slug", "description", "is_active"],
      filters: { id: roleIds },
    });
    roles = rolesData;
  }

  res.json({
    user_id: id,
    roles,
  });
};

// POST /admin/users/:id/roles - Assign roles to a user (replaces existing roles)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const body = req.body as any;
  const { role_ids } = body;

  if (!role_ids || !Array.isArray(role_ids)) {
    return res.status(400).json({
      message: "role_ids array is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Verify all roles exist and are active
    for (const roleId of role_ids) {
      const role = await roleManagementService.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({
          message: `Role with id ${roleId} not found`,
        });
      }
      if (!role.is_active) {
        return res.status(400).json({
          message: `Role ${role.name} is not active`,
        });
      }
    }

    // Get current roles
    const currentUserRoles = await roleManagementService.getUserRoles(id);
    const currentRoleIds = currentUserRoles.map((ur: any) => ur.role_id);

    // Determine roles to remove and add
    const rolesToRemove = currentRoleIds.filter(
      (roleId: string) => !role_ids.includes(roleId)
    );
    const rolesToAdd = role_ids.filter(
      (roleId: string) => !currentRoleIds.includes(roleId)
    );

    // Remove old roles
    if (rolesToRemove.length > 0) {
      await roleManagementService.removeRolesFromUser(id, rolesToRemove);
    }

    // Add new roles
    let assigned: any[] = [];
    if (rolesToAdd.length > 0) {
      assigned = await roleManagementService.assignRolesToUser(id, rolesToAdd);
    }

    res.status(200).json({
      message: "Roles updated successfully",
      user_id: id,
      total_roles: role_ids.length,
      added_count: rolesToAdd.length,
      removed_count: rolesToRemove.length,
      assignments: assigned,
    });
  } catch (error: any) {
    console.error("Error assigning roles:", error);
    res.status(500).json({
      message: "Failed to assign roles",
      error: error.message,
    });
  }
};

// DELETE /admin/users/:id/roles - Remove roles from a user
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const body = req.body as any;
  const { role_ids } = body;

  if (!role_ids || !Array.isArray(role_ids)) {
    return res.status(400).json({
      message: "role_ids array is required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Remove roles from user
    const removed = await roleManagementService.removeRolesFromUser(
      id,
      role_ids
    );

    res.json({
      message: "Roles removed successfully",
      user_id: id,
      removed_count: removed.length,
      removals: removed,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to remove roles",
      error: error.message,
    });
  }
};
