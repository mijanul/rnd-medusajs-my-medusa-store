import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/roles - List all roles
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

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
  });

  res.json({ roles });
};

// POST /admin/roles - Create a new role
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const body = req.body as any;
  const { name, slug, description, is_active = true } = body;

  if (!name || !slug) {
    return res.status(400).json({
      message: "Name and slug are required",
    });
  }

  try {
    // Note: In production, use proper create methods from the service
    res.status(201).json({
      message: "Role creation requires service implementation",
      role: { name, slug, description, is_active },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create role",
      error: error.message,
    });
  }
};
