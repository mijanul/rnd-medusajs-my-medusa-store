import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// POST /admin/roles/:id/permissions - Assign permissions to a role
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;
  const body = req.body as any;
  const { permission_ids } = body;

  if (!permission_ids || !Array.isArray(permission_ids)) {
    return res.status(400).json({
      message: "permission_ids array is required",
    });
  }

  // Verify role exists
  const { data: roles } = await query.graph({
    entity: "role",
    fields: ["id"],
    filters: { id },
  });

  if (!roles || roles.length === 0) {
    return res.status(404).json({ message: "Role not found" });
  }

  try {
    res.status(201).json({
      message: "Permission assignment requires service implementation",
      role_id: id,
      permission_ids,
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
    res.json({
      message: "Permission removal requires service implementation",
      role_id: id,
      permission_ids,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to remove permissions",
      error: error.message,
    });
  }
};
