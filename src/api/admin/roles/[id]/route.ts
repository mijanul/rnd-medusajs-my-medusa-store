import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

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
  const { id } = req.params;
  const body = req.body as any;
  const { name, slug, description, is_active } = body;

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if role exists
    const existingRole = await roleManagementService.getRoleById(id);
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== existingRole.slug) {
      const roleWithSlug = await roleManagementService.getRoleBySlug(slug);
      if (roleWithSlug && roleWithSlug.id !== id) {
        return res.status(400).json({
          message: "A role with this slug already exists",
        });
      }
    }

    // Update the role
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedRole = await roleManagementService.updateRole(id, updateData);

    res.json({
      message: "Role updated successfully",
      role: updatedRole,
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
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if role exists
    const existingRole = await roleManagementService.getRoleById(id);
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Delete the role (this will also delete associated role_permissions and user_roles)
    await roleManagementService.deleteRole(id);

    res.json({
      message: "Role deleted successfully",
      role_id: id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete role",
      error: error.message,
    });
  }
};
