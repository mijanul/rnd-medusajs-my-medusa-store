import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/permissions - List all permissions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

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
  });

  res.json({ permissions });
};

// POST /admin/permissions - Create a new permission
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any;
  const { name, resource, action, description } = body;

  if (!name || !resource || !action) {
    return res.status(400).json({
      message: "Name, resource, and action are required",
    });
  }

  try {
    res.status(201).json({
      message: "Permission creation requires service implementation",
      permission: { name, resource, action, description },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create permission",
      error: error.message,
    });
  }
};
