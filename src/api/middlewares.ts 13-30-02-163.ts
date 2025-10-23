import { defineMiddlewares } from "@medusajs/framework/http";
import { authenticate } from "@medusajs/medusa";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { userHasPermission } from "../modules/role-management/utils";

/**
 * Generic permission checker factory
 * Creates a middleware function for a specific resource
 * @param resourceName - Display name for error messages and redirects (e.g., "orders", "draft-orders")
 * @param permissionResource - Permission resource name to check (e.g., "orders" for both orders and draft-orders)
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
      // Note: draft-orders uses "orders" permission resource
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
// Draft orders use the same "orders" permission but show "draft-orders" in error messages
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
const checkSettingsPermission = createPermissionChecker("settings", "settings");
const checkPagePermission = createPermissionChecker("pages", "pages");

/**
 * Settings permission checker that excludes /me endpoints
 * We don't want to block /admin/users/me or /admin/users/me/permissions
 */
const checkSettingsPermissionExcludingMe = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // Allow /admin/users/me and /admin/users/me/* endpoints without permission check
  if (req.url.includes("/users/me")) {
    return next();
  }
  // Apply normal settings permission check for other routes
  return checkSettingsPermission(req, res, next);
};

/**
 * Middleware to check customer permissions (keeping for backward compatibility)
 * Note: User is already authenticated by Medusa's built-in auth middleware
 */
async function checkCustomerPermissionLegacy(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Get user ID from auth context (should already be set by Medusa's auth)
    // @ts-ignore
    const userId = req.auth_context?.actor_id;

    // If no user at this point, they're not authenticated (shouldn't happen for /admin routes)
    // But if it does, return 401 to trigger login
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
      `customers-${requiredAction}`
    );

    // If user doesn't have permission, return 403 (Forbidden)
    // This is different from 401 (Unauthorized) - user IS logged in, just doesn't have access
    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: You don't have permission to ${requiredAction} customers`,
        required_permission: `customers-${requiredAction}`,
        redirect:
          "/app/access-denied?resource=customers&action=" + requiredAction,
      });
    }

    // User has permission, continue
    next();
  } catch (error: any) {
    console.error("Error checking customer permissions:", error);
    return res.status(500).json({
      message: "Error checking permissions",
      error: error.message,
    });
  }
}

/**
 * Middleware to check customer group permissions
 * Note: User is already authenticated by Medusa's built-in auth middleware
 */
async function checkCustomerGroupPermission(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Get user ID from auth context (should already be set by Medusa's auth)
    // @ts-ignore
    const userId = req.auth_context?.actor_id;

    // If no user at this point, they're not authenticated (shouldn't happen for /admin routes)
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

    // Check if user has the required permission for customer groups
    // Using "customers" resource permissions
    const hasPermission = await userHasPermission(
      req.scope,
      userId,
      `customers-${requiredAction}`
    );

    // If user doesn't have permission, return 403 (Forbidden)
    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: You don't have permission to ${requiredAction} customer groups`,
        required_permission: `customers-${requiredAction}`,
        redirect:
          "/app/access-denied?resource=customer-groups&action=" +
          requiredAction,
      });
    }

    // User has permission, continue
    next();
  } catch (error: any) {
    console.error("Error checking customer group permissions:", error);
    return res.status(500).json({
      message: "Error checking permissions",
      error: error.message,
    });
  }
}

/**
 * Apply middleware to all protected routes
 * Note: Medusa should handle authentication automatically for /admin/* routes
 * But we add permission checks on top
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
      middlewares: [checkCustomerGroupPermission],
    },
    // Order routes
    {
      matcher: "/admin/orders*",
      middlewares: [checkOrderPermission],
    },
    {
      matcher: "/admin/draft-orders*",
      middlewares: [checkDraftOrderPermission], // Uses "orders" permission
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
    // Settings routes
    {
      matcher: "/admin/stores*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/regions*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/currencies*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/shipping-options*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/shipping-profiles*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/fulfillment*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/payment-providers*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/payment-collections*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/tax-rates*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/tax-regions*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/users*",
      middlewares: [checkSettingsPermissionExcludingMe],
    },
    {
      matcher: "/admin/invites*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/api-keys*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/publishable-api-keys*",
      middlewares: [checkSettingsPermission],
    },
    {
      matcher: "/admin/sales-channels*",
      middlewares: [checkSettingsPermission],
    },
    // Pages routes (custom module)
    {
      matcher: "/admin/pages*",
      middlewares: [checkPagePermission],
    },
  ],
});
