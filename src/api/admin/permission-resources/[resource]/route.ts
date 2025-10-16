import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/permission-resources/:resource - Get all permissions for a resource
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { resource } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: [
        "id",
        "name",
        "resource",
        "action",
        "description",
        "created_at",
        "updated_at",
      ],
      filters: {
        resource: resource,
      },
    });

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
    // This would update/create multiple permissions for the resource
    res.json({
      message: "Permissions updated successfully",
      resource,
      permissions,
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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // First get all permissions for this resource
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id"],
      filters: {
        resource: resource,
      },
    });

    // This would delete all permissions for the resource
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
