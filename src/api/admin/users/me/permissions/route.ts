import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/users/me/permissions
 * Get current authenticated user's permissions
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Get current user from auth context
    const userId = (req as any).auth?.actor_id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - No user found in session",
        permissions: [],
      });
    }

    // Get user's roles
    const { data: userRoles } = await query.graph({
      entity: "user_role",
      fields: ["role_id"],
      filters: { user_id: userId },
    });

    if (!userRoles || userRoles.length === 0) {
      // User has no roles assigned, return empty permissions
      return res.json({
        user_id: userId,
        roles: [],
        permissions: [],
        has_permissions: false,
      });
    }

    const roleIds = userRoles.map((ur: any) => ur.role_id);

    // Get permissions for all user's roles
    const { data: rolePermissions } = await query.graph({
      entity: "role_permission",
      fields: ["permission_id"],
      filters: { role_id: roleIds },
    });

    if (!rolePermissions || rolePermissions.length === 0) {
      return res.json({
        user_id: userId,
        roles: roleIds,
        permissions: [],
        has_permissions: false,
      });
    }

    const permissionIds = Array.from(
      new Set(rolePermissions.map((rp: any) => rp.permission_id))
    );

    // Get full permission details
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: { id: permissionIds },
    });

    // Check for super admin (has "all-all" permission)
    const isSuperAdmin = permissions.some(
      (p: any) =>
        p.name === "all-all" || (p.resource === "all" && p.action === "all")
    );

    // Group permissions by resource for easy lookup
    const permissionsByResource = permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm.action);
      return acc;
    }, {});

    res.json({
      user_id: userId,
      roles: roleIds,
      permissions: permissions,
      permissions_by_resource: permissionsByResource,
      has_permissions: permissions.length > 0,
      is_super_admin: isSuperAdmin,
      total_permissions: permissions.length,
    });
  } catch (error: any) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({
      message: "Failed to fetch user permissions",
      error: error.message,
      permissions: [],
    });
  }
};
