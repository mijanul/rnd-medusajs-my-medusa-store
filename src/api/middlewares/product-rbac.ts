/**
 * Middleware to protect core Medusa product routes with RBAC
 *
 * This applies role-based access control to all product-related API endpoints:
 * - GET /admin/products (list) → Requires "product-list" or "product-view" permission
 * - GET /admin/products/:id (view) → Requires "product-view" permission
 * - POST /admin/products (create) → Requires "product-create" permission
 * - POST /admin/products/:id (update) → Requires "product-update" permission
 * - DELETE /admin/products/:id (delete) → Requires "product-delete" permission
 */

import {
  defineMiddlewares,
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
import { userHasPermission } from "../../modules/role-management/utils";

/**
 * Middleware to check product permissions based on HTTP method and path
 */
async function checkProductPermission(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Get user ID from auth context
    // @ts-ignore - auth_context exists on authenticated requests
    const userId = req.auth_context?.actor_id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - Authentication required",
      });
    }

    // Determine required permission based on HTTP method and path
    const method = req.method;
    const path = req.path;
    let requiredPermission = "";

    // Map HTTP methods to permission actions
    if (method === "GET") {
      // List all products
      if (path === "/admin/products" || path === "/admin/products/") {
        requiredPermission = "product-list";
        // Also allow if user has product-view permission
        const hasList = await userHasPermission(
          req.scope,
          userId,
          "product-list"
        );
        const hasView = await userHasPermission(
          req.scope,
          userId,
          "product-view"
        );

        if (hasList || hasView) {
          return next();
        }
        requiredPermission = "product-list or product-view";
      } else {
        // View specific product
        requiredPermission = "product-view";
      }
    } else if (method === "POST") {
      // Check if it's create or update
      if (path === "/admin/products" || path === "/admin/products/") {
        requiredPermission = "product-create";
      } else {
        // Update existing product
        requiredPermission = "product-update";
      }
    } else if (method === "DELETE") {
      requiredPermission = "product-delete";
    } else if (method === "PUT" || method === "PATCH") {
      requiredPermission = "product-update";
    }

    // Check if user has the required permission
    const hasPermission = await userHasPermission(
      req.scope,
      userId,
      requiredPermission
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: You don't have permission to perform this action on products`,
        required_permission: requiredPermission,
        hint: "Contact your administrator to grant you the necessary permissions",
      });
    }

    // User has permission, continue to the route handler
    next();
  } catch (error) {
    console.error("Error in product permission middleware:", error);
    return res.status(500).json({
      message: "Internal server error while checking permissions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Define middleware for all product routes
 * This will be automatically applied to all /admin/products/* routes
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products*", // Matches all product routes
      method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      middlewares: [checkProductPermission],
    },
  ],
});
