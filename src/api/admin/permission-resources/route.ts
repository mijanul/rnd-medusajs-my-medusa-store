import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

// GET /admin/permission-resources - List all unique resources with their permissions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Get all permissions
    const permissions = await roleManagementService.listPermissions({});

    // Group permissions by resource
    const resourceMap = new Map<string, any>();

    permissions.forEach((perm: any) => {
      if (!resourceMap.has(perm.resource)) {
        resourceMap.set(perm.resource, {
          resource: perm.resource,
          permissions: [],
          permissionCount: 0,
        });
      }
      const resourceData = resourceMap.get(perm.resource);
      resourceData.permissions.push(perm);
      resourceData.permissionCount = resourceData.permissions.length;
    });

    const resources = Array.from(resourceMap.values());

    res.json({ resources });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
};

// POST /admin/permission-resources - Create a new resource with permissions
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any;
  const { resource, permissions } = body;

  if (!resource || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      message: "Resource and permissions array are required",
    });
  }

  try {
    const roleManagementService = req.scope.resolve(ROLE_MANAGEMENT_MODULE);

    // Create each permission
    const createdPermissions: any[] = [];
    for (const perm of permissions) {
      const created = await roleManagementService.createPermissions({
        name: `${resource}-${perm.action}`,
        resource: resource,
        action: perm.action,
        description: perm.description || "",
      });
      createdPermissions.push(created);
    }

    res.status(201).json({
      message: "Resource created successfully",
      resource: resource,
      permissions: createdPermissions,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create resource",
      error: error.message,
    });
  }
};
