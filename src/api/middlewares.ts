import { defineMiddlewares } from "@medusajs/medusa";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Helper to check permission using the /me/permissions logic
 */
async function checkPermission(
  req: any,
  res: any,
  permissionName: string
): Promise<boolean> {
  const userId = req.auth_context?.actor_id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized: No user found" });
    return false;
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Get user's roles
    const { data: userRoles } = await query.graph({
      entity: "user_role",
      fields: ["role_id"],
      filters: { user_id: userId },
    });

    if (!userRoles || userRoles.length === 0) {
      res.status(403).json({
        type: "not_allowed",
        message: `You don't have permission: ${permissionName}`,
      });
      return false;
    }

    const roleIds = userRoles.map((ur: any) => ur.role_id);

    // Get permissions for all user's roles
    const { data: rolePermissions } = await query.graph({
      entity: "role_permission",
      fields: ["permission_id"],
      filters: { role_id: roleIds },
    });

    if (!rolePermissions || rolePermissions.length === 0) {
      res.status(403).json({
        type: "not_allowed",
        message: `You don't have permission: ${permissionName}`,
      });
      return false;
    }

    const permissionIds = Array.from(
      new Set(rolePermissions.map((rp: any) => rp.permission_id))
    );

    // Get full permission details
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: { id: permissionIds },
    });

    // Check if user has the required permission (case-insensitive)
    const hasPermission = permissions.some(
      (perm: any) => perm.name.toLowerCase() === permissionName.toLowerCase()
    );

    if (!hasPermission) {
      res.status(403).json({
        type: "not_allowed",
        message: `You don't have permission: ${permissionName}`,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Permission check error:", error);
    res
      .status(500)
      .json({ message: "Internal server error checking permissions" });
    return false;
  }
}

/**
 * Global middleware configuration for admin routes
 * This properly intercepts requests and checks permissions BEFORE passing to core handlers
 */
export default defineMiddlewares({
  routes: [
    // ========== ORDERS PROTECTION ==========
    {
      matcher: "/admin/orders",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "orders-list")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/orders",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "orders-create")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/orders/:id",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "orders-view")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/orders/:id",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "orders-update")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/orders/:id",
      method: "DELETE",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "orders-delete")) {
            next();
          }
        },
      ],
    },

    // ========== PRODUCTS PROTECTION ==========
    {
      matcher: "/admin/products",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "products-list")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/products",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "products-create")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/products/:id",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "products-view")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/products/:id",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "products-update")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/products/:id",
      method: "DELETE",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "products-delete")) {
            next();
          }
        },
      ],
    },

    // ========== CUSTOMERS PROTECTION ==========
    {
      matcher: "/admin/customers",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "customers-list")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/customers",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "customers-create")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/customers/:id",
      method: "GET",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "customers-view")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/customers/:id",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "customers-update")) {
            next();
          }
        },
      ],
    },
    {
      matcher: "/admin/customers/:id",
      method: "DELETE",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (await checkPermission(req, res, "customers-delete")) {
            next();
          }
        },
      ],
    },

    // ========== DISABLE PRODUCT VARIANTS ==========
    // Block variant creation endpoint
    {
      matcher: "/admin/products/:id/variants",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          return res.status(403).json({
            message:
              "Variant creation is disabled. This store uses single-SKU products only.",
            type: "not_allowed",
          });
        },
      ],
    },
    // Block variant update/delete endpoints
    {
      matcher: "/admin/products/:id/variants/:variantId",
      method: ["POST", "DELETE"],
      middlewares: [
        async (req: any, res: any, next: any) => {
          return res.status(403).json({
            message:
              "Variant operations are disabled. This store uses single-SKU products only.",
            type: "not_allowed",
          });
        },
      ],
    },
    // Remove variants/options from product creation
    {
      matcher: "/admin/products",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (req.body && typeof req.body === "object") {
            // Remove variants and options from request
            delete req.body.variants;
            delete req.body.options;
          }
          next();
        },
      ],
    },
    // Remove variants/options from product updates
    {
      matcher: "/admin/products/:id",
      method: "POST",
      middlewares: [
        async (req: any, res: any, next: any) => {
          if (req.body && typeof req.body === "object") {
            // Remove variants and options from request
            delete req.body.variants;
            delete req.body.options;
          }
          next();
        },
      ],
    },
    // ========== PINCODE PRICING CSV UPLOAD - INCREASED BODY LIMIT ==========
    // Large CSV files are read as text on frontend and sent as JSON payload
    // Need to allow large JSON payloads (500MB) for CSV data containing many products/pincodes
    {
      matcher: "/admin/pincode-pricing/upload",
      method: "POST",
      bodyParser: {
        sizeLimit: "500mb",
      },
    },
  ],
});
