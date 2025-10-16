import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

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

// POST /admin/users/:id/roles - Assign roles to a user
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
    res.status(201).json({
      message: "Role assignment requires service implementation",
      user_id: id,
      role_ids,
    });
  } catch (error: any) {
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
    res.json({
      message: "Role removal requires service implementation",
      user_id: id,
      role_ids,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to remove roles",
      error: error.message,
    });
  }
};
