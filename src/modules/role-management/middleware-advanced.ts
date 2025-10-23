/**
 * Advanced middleware utilities for API route protection
 * Handles integration with Medusa's core services
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { userHasPermission, getUserPermissions } from "./utils";

type RouteHandler = (req: MedusaRequest, res: MedusaResponse) => Promise<any>;
type NextFunction = () => void;
type MiddlewareFunction = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) => Promise<void>;

/**
 * Express-style middleware for permission checking
 * Use this when you want to chain multiple middlewares
 */
export function checkPermission(permissionName: string): MiddlewareFunction {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    try {
      // @ts-ignore - auth_context is available in authenticated admin routes
      const userId = req.auth_context?.actor_id;

      if (!userId) {
        res.status(401).json({
          type: "unauthorized",
          message: "Authentication required",
        });
        return;
      }

      const hasPermission = await userHasPermission(
        req.scope,
        userId,
        permissionName
      );

      if (!hasPermission) {
        res.status(403).json({
          type: "forbidden",
          message: `Missing required permission: ${permissionName}`,
          required_permission: permissionName,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        type: "server_error",
        message: "Error checking permissions",
        error: error.message,
      });
    }
  };
}

/**
 * Middleware that attaches user permissions to the request object
 * Useful when you need to check permissions within your route logic
 */
export function attachUserPermissions(): MiddlewareFunction {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    try {
      // @ts-ignore - auth_context is available in authenticated admin routes
      const userId = req.auth_context?.actor_id;

      if (!userId) {
        // @ts-ignore - adding custom property
        req.userPermissions = [];
        next();
        return;
      }

      const permissions = await getUserPermissions(req.scope, userId);

      // @ts-ignore - adding custom property
      req.userPermissions = permissions;

      // @ts-ignore - adding custom method
      req.hasPermission = (resource: string, action: string) => {
        return permissions.some(
          (p: any) =>
            p.resource.toLowerCase() === resource.toLowerCase() &&
            p.action.toLowerCase() === action.toLowerCase()
        );
      };

      next();
    } catch (error: any) {
      res.status(500).json({
        type: "server_error",
        message: "Error loading user permissions",
        error: error.message,
      });
    }
  };
}

/**
 * Enhanced permission middleware with fallback to default handler
 * This allows the Medusa default handler to execute if permission check passes
 */
export function requirePermissionWithFallback(
  permissionName: string,
  fallbackHandler?: RouteHandler
) {
  return function (handler?: RouteHandler): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        // @ts-ignore
        const userId = req.auth_context?.actor_id;

        if (!userId) {
          return res.status(401).json({
            type: "unauthorized",
            message: "Authentication required",
          });
        }

        const hasPermission = await userHasPermission(
          req.scope,
          userId,
          permissionName
        );

        if (!hasPermission) {
          return res.status(403).json({
            type: "forbidden",
            message: `Missing required permission: ${permissionName}`,
            required_permission: permissionName,
          });
        }

        // If custom handler provided, use it
        if (handler) {
          return handler(req, res);
        }

        // If fallback handler provided, use it
        if (fallbackHandler) {
          return fallbackHandler(req, res);
        }

        // Otherwise, just pass through
        return res.status(200).json({
          message: "Permission check passed",
        });
      } catch (error: any) {
        return res.status(500).json({
          type: "server_error",
          message: "Error checking permissions",
          error: error.message,
        });
      }
    };
  };
}

/**
 * Conditional permission check - returns different responses based on permission
 * Useful for read-only vs read-write scenarios
 */
export function conditionalPermission(
  viewPermission: string,
  editPermission: string
) {
  return function (
    viewHandler: RouteHandler,
    editHandler: RouteHandler
  ): RouteHandler {
    return async (req: MedusaRequest, res: MedusaResponse) => {
      try {
        // @ts-ignore
        const userId = req.auth_context?.actor_id;

        if (!userId) {
          return res.status(401).json({
            type: "unauthorized",
            message: "Authentication required",
          });
        }

        const hasEditPermission = await userHasPermission(
          req.scope,
          userId,
          editPermission
        );

        if (hasEditPermission) {
          return editHandler(req, res);
        }

        const hasViewPermission = await userHasPermission(
          req.scope,
          userId,
          viewPermission
        );

        if (hasViewPermission) {
          return viewHandler(req, res);
        }

        return res.status(403).json({
          type: "forbidden",
          message: `Missing required permission: ${viewPermission} or ${editPermission}`,
        });
      } catch (error: any) {
        return res.status(500).json({
          type: "server_error",
          message: "Error checking permissions",
          error: error.message,
        });
      }
    };
  };
}
