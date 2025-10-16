import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// GET /admin/permission-resources - List all unique resources with their permissions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
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
    });

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
    // This would create multiple permissions at once
    // For now, returning placeholder response
    res.status(201).json({
      message: "Resource creation requires service implementation",
      resource: { resource, permissions },
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create resource",
      error: error.message,
    });
  }
};
