import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/roles/:id - Get a specific role with its permissions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { data: roles } = await query.graph({
    entity: "role",
    fields: [
      "id",
      "name",
      "slug",
      "description",
      "is_active",
      "created_at",
      "updated_at",
    ],
    filters: { id },
  });

  if (!roles || roles.length === 0) {
    return res.status(404).json({ message: "Role not found" });
  }

  // Get permissions for this role
  const { data: rolePermissions } = await query.graph({
    entity: "role_permission",
    fields: ["permission_id"],
    filters: { role_id: id },
  });

  const permissionIds = rolePermissions.map((rp: any) => rp.permission_id);

  let permissions: any[] = [];
  if (permissionIds.length > 0) {
    const { data: perms } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: { id: permissionIds },
    });
    permissions = perms;
  }

  res.json({
    role: roles[0],
    permissions,
  });
};

// PUT /admin/roles/:id - Update a role
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;
  const body = req.body as any;
  const { name, slug, description, is_active } = body;

  const { data: existingRoles } = await query.graph({
    entity: "role",
    fields: ["id"],
    filters: { id },
  });

  if (!existingRoles || existingRoles.length === 0) {
    return res.status(404).json({ message: "Role not found" });
  }

  try {
    // Note: In production, use proper update methods from the service
    res.json({
      message: "Role update functionality requires service implementation",
      role_id: id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to update role",
      error: error.message,
    });
  }
};

// DELETE /admin/roles/:id - Delete a role
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  try {
    // Note: In production, use proper delete methods from the service
    res.json({
      message: "Role deletion functionality requires service implementation",
      role_id: id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete role",
      error: error.message,
    });
  }
};
