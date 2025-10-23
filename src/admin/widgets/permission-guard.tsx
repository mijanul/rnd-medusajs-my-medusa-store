import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserPermissions } from "../lib/use-permissions";
import { Container } from "@medusajs/ui";
import { RestrictedAccess } from "../components/restricted-access";

/**
 * Global Permission Guard Widget
 * This widget checks permissions for Medusa's core routes
 * and blocks access if user doesn't have permission
 */
const PermissionGuard = () => {
  const location = useLocation();
  const { hasPermission, loading } = useUserPermissions();

  // Define route-to-permission mapping for core Medusa routes
  const routePermissions: Record<string, { resource: string; action: string }> =
    {
      "/orders": { resource: "orders", action: "list" },
      "/products": { resource: "products", action: "list" },
      "/customers": { resource: "customers", action: "list" },
      "/inventory": { resource: "inventory", action: "list" },
      "/promotions": { resource: "promotions", action: "list" },
      "/price-lists": { resource: "price_lists", action: "list" },
    };

  useEffect(() => {
    if (loading) return;

    // Check if current path matches any protected route
    const currentPath = location.pathname;

    for (const [route, permission] of Object.entries(routePermissions)) {
      // Check if current path starts with the protected route
      if (currentPath.startsWith(route)) {
        const allowed = hasPermission(permission.resource, permission.action);

        if (!allowed) {
          // Block access - could redirect to a "no access" page
          console.warn(
            `Access denied to ${route}: missing ${permission.resource}-${permission.action}`
          );
          // Optionally redirect to dashboard
          // navigate("/");
        }
      }
    }
  }, [location.pathname, hasPermission, loading]);

  // Check current route
  const currentPath = location.pathname;
  let blockedRoute = null;

  for (const [route, permission] of Object.entries(routePermissions)) {
    if (currentPath.startsWith(route)) {
      const allowed = hasPermission(permission.resource, permission.action);
      if (!allowed && !loading) {
        blockedRoute = permission;
        break;
      }
    }
  }

  // If access is blocked, show restricted access message
  if (blockedRoute) {
    return (
      <Container className="p-8">
        <RestrictedAccess
          resource={blockedRoute.resource}
          action={blockedRoute.action}
        />
      </Container>
    );
  }

  // Don't render anything if access is allowed
  return null;
};

export const config = defineWidgetConfig({
  zone: "order.list.before", // This will inject on orders page
});

export default PermissionGuard;
