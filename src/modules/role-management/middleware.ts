/**
 * Middleware for protecting routes with role-based permissions
 *
 * Usage in your API routes:
 *
 * import { requirePermission, requireRole } from "../../modules/role-management/middleware";
 *
 * export const GET = requirePermission("page-view")(async (req, res) => {
 *   // Your route logic here
 * });
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { userHasPermission, userHasRole, isSuperAdmin } from "./utils";

type RouteHandler = (req: MedusaRequest, res: MedusaResponse) => Promise<any>;

/**
 * Middleware to require a specific permission
 * @param permissionName - The required permission name (e.g., "page-edit")
 * @returns Wrapped route handler
 */
export function requirePermission(permissionName: string) {
  return function (handler: RouteHandler): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        // Get user ID from request (adjust based on your auth implementation)
        const userId = (req as any).user?.id || (req as any).auth?.actor_id;

        if (!userId) {
          return res.status(401).json({
            message: "Unauthorized: No user found",
          });
        }

        // Check if user has permission
        const hasPermission = await userHasPermission(
          req.scope,
          userId,
          permissionName
        );

        if (!hasPermission) {
          return res.status(403).json({
            message: `Forbidden: You don't have the required permission: ${permissionName}`,
          });
        }

        // User has permission, proceed
        return handler(req, res);
      } catch (error: any) {
        return res.status(500).json({
          message: "Error checking permissions",
          error: error.message,
        });
      }
    };
  };
}

/**
 * Middleware to require a specific role
 * @param roleSlug - The required role slug (e.g., "admin")
 * @returns Wrapped route handler
 */
export function requireRole(roleSlug: string) {
  return function (handler: RouteHandler): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        const userId = (req as any).user?.id || (req as any).auth?.actor_id;

        if (!userId) {
          return res.status(401).json({
            message: "Unauthorized: No user found",
          });
        }

        const hasRole = await userHasRole(req.scope, userId, roleSlug);

        if (!hasRole) {
          return res.status(403).json({
            message: `Forbidden: You don't have the required role: ${roleSlug}`,
          });
        }

        return handler(req, res);
      } catch (error: any) {
        return res.status(500).json({
          message: "Error checking role",
          error: error.message,
        });
      }
    };
  };
}

/**
 * Middleware to require super admin role
 * @returns Wrapped route handler
 */
export function requireSuperAdmin() {
  return function (handler: RouteHandler): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        const userId = (req as any).user?.id || (req as any).auth?.actor_id;

        if (!userId) {
          return res.status(401).json({
            message: "Unauthorized: No user found",
          });
        }

        const isSuperAdminUser = await isSuperAdmin(req.scope, userId);

        if (!isSuperAdminUser) {
          return res.status(403).json({
            message: "Forbidden: Super admin access required",
          });
        }

        return handler(req, res);
      } catch (error: any) {
        return res.status(500).json({
          message: "Error checking super admin status",
          error: error.message,
        });
      }
    };
  };
}

/**
 * Middleware to require any of the specified permissions
 * @param permissionNames - Array of permission names
 * @returns Wrapped route handler
 */
export function requireAnyPermission(permissionNames: string[]) {
  return function (handler: RouteHandler): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        const userId = (req as any).user?.id || (req as any).auth?.actor_id;

        if (!userId) {
          return res.status(401).json({
            message: "Unauthorized: No user found",
          });
        }

        // Check each permission
        for (const permissionName of permissionNames) {
          const hasPermission = await userHasPermission(
            req.scope,
            userId,
            permissionName
          );
          if (hasPermission) {
            return handler(req, res);
          }
        }

        return res.status(403).json({
          message: `Forbidden: You need at least one of: ${permissionNames.join(
            ", "
          )}`,
        });
      } catch (error: any) {
        return res.status(500).json({
          message: "Error checking permissions",
          error: error.message,
        });
      }
    };
  };
}
