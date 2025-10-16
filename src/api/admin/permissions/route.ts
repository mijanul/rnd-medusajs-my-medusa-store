import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

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
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Check if permission with same name already exists
    const allPermissions = await roleManagementService.listPermissions({});
    const existingPermission = allPermissions.find((p: any) => p.name === name);

    if (existingPermission) {
      return res.status(400).json({
        message: "A permission with this name already exists",
      });
    }

    const permission = await roleManagementService.createPermission({
      name,
      resource,
      action,
      description: description || "",
    });

    res.status(201).json({
      message: "Permission created successfully",
      permission,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create permission",
      error: error.message,
    });
  }
};
