import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

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
  const body = req.body as any;
  const { name, slug, description, is_active = true } = body;

  if (!name || !slug) {
    return res.status(400).json({
      message: "Name and slug are required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if slug already exists
    const existingRole = await roleManagementService.getRoleBySlug(slug);
    if (existingRole) {
      return res.status(400).json({
        message: "A role with this slug already exists",
      });
    }

    const role = await roleManagementService.createRole({
      name,
      slug,
      description: description || "",
      is_active,
    });

    res.status(201).json({
      message: "Role created successfully",
      role,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create role",
      error: error.message,
    });
  }
};
