import { defineMiddlewares } from "@medusajs/framework/http";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { userHasPermission } from "../modules/role-management/utils";

/**
 * Generic permission checker factory
 * Creates middleware to check user permissions and return 403 if unauthorized
 *
 * @param resourceName - Display name for error messages (e.g., "customers", "orders")
 * @param permissionResource - Permission resource name to check (e.g., "customers", "orders")
 */
function createPermissionChecker(
  resourceName: string,
  permissionResource: string
) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    try {
      // Get user ID from auth context
      // @ts-ignore
      const userId = req.auth_context?.actor_id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      // Determine required permission based on HTTP method
      let requiredAction = "view";

      switch (req.method) {
        case "GET":
          // Check if it's a detail view (has ID) or list view
          const urlParts = req.url.split("/").filter(Boolean);
          const lastPart = urlParts[urlParts.length - 1];
          // If last part looks like an ID (not a query string), it's a detail view
          requiredAction =
            lastPart && !lastPart.includes("?") && lastPart.length > 10
              ? "view"
              : "list";
          break;
        case "POST":
          requiredAction = "create";
          break;
        case "PUT":
        case "PATCH":
          requiredAction = "update";
          break;
        case "DELETE":
          requiredAction = "delete";
          break;
      }

      // Check if user has the required permission
      const hasPermission = await userHasPermission(
        req.scope,
        userId,
        `${permissionResource}-${requiredAction}`
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: You don't have permission to ${requiredAction} ${resourceName}`,
          required_permission: `${permissionResource}-${requiredAction}`,
          redirect: `/app/access-denied?resource=${resourceName}&action=${requiredAction}`,
        });
      }

      next();
    } catch (error: any) {
      console.error(`Error checking ${resourceName} permissions:`, error);
      return res.status(500).json({
        message: "Error checking permissions",
        error: error.message,
      });
    }
  };
}

// Create permission checkers for each resource
const checkCustomerPermission = createPermissionChecker(
  "customers",
  "customers"
);
const checkOrderPermission = createPermissionChecker("orders", "orders");
const checkDraftOrderPermission = createPermissionChecker(
  "draft-orders",
  "orders"
);
const checkProductPermission = createPermissionChecker("products", "products");
const checkInventoryPermission = createPermissionChecker(
  "inventory",
  "inventory"
);
const checkPromotionPermission = createPermissionChecker(
  "promotions",
  "promotions"
);
const checkPriceListPermission = createPermissionChecker(
  "price-lists",
  "price_lists"
);

/**
 * Apply middleware to all protected routes
 */
export default defineMiddlewares({
  routes: [
    // Customer routes
    {
      matcher: "/admin/customers*",
      middlewares: [checkCustomerPermission],
    },
    {
      matcher: "/admin/customer-groups*",
      middlewares: [checkCustomerPermission],
    },
    // Order routes
    {
      matcher: "/admin/orders*",
      middlewares: [checkOrderPermission],
    },
    {
      matcher: "/admin/draft-orders*",
      middlewares: [checkDraftOrderPermission],
    },
    // Product routes
    {
      matcher: "/admin/products*",
      middlewares: [checkProductPermission],
    },
    {
      matcher: "/admin/product-categories*",
      middlewares: [checkProductPermission],
    },
    {
      matcher: "/admin/product-collections*",
      middlewares: [checkProductPermission],
    },
    {
      matcher: "/admin/product-tags*",
      middlewares: [checkProductPermission],
    },
    {
      matcher: "/admin/product-types*",
      middlewares: [checkProductPermission],
    },
    // Inventory routes
    {
      matcher: "/admin/inventory-items*",
      middlewares: [checkInventoryPermission],
    },
    {
      matcher: "/admin/stock-locations*",
      middlewares: [checkInventoryPermission],
    },
    {
      matcher: "/admin/reservations*",
      middlewares: [checkInventoryPermission],
    },
    // Promotion routes
    {
      matcher: "/admin/promotions*",
      middlewares: [checkPromotionPermission],
    },
    {
      matcher: "/admin/campaigns*",
      middlewares: [checkPromotionPermission],
    },
    // Price list routes
    {
      matcher: "/admin/price-lists*",
      middlewares: [checkPriceListPermission],
    },
    {
      matcher: "/admin/price-preferences*",
      middlewares: [checkPriceListPermission],
    },
  ],
});
