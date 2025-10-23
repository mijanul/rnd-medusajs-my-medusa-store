/**
 * Route Guard Component
 * Checks permissions when navigating to protected routes
 * Shows access denied UI inline if user doesn't have permission
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Container, Heading, Text, Button } from "@medusajs/ui";
import { ArrowUturnLeft, LockClosedSolid } from "@medusajs/icons";

// Define protected routes and their required resources
const protectedRoutes = [
  { path: "/app/orders", resource: "orders" },
  { path: "/app/products", resource: "products" },
  { path: "/app/customers", resource: "customers" },
  { path: "/app/customer-groups", resource: "customer_groups" },
  { path: "/app/inventory", resource: "inventory" },
  { path: "/app/promotions", resource: "promotions" },
  { path: "/app/price-lists", resource: "price_lists" },
  { path: "/app/pages", resource: "pages" },
  { path: "/app/settings", resource: "settings" },
];

/**
 * Hook to check if user has permission for a specific resource
 * Returns permission state that can be used to conditionally render content
 */
function useRouteGuard() {
  const location = useLocation();
  const [permissionState, setPermissionState] = useState<{
    loading: boolean;
    hasPermission: boolean;
    resource?: string;
    action?: string;
  }>({
    loading: true,
    hasPermission: true,
  });

  useEffect(() => {
    // Reset state when location changes
    setPermissionState({ loading: true, hasPermission: true });

    // Check if current route is protected
    const currentRoute = protectedRoutes.find(
      (route) =>
        location.pathname === route.path ||
        location.pathname.startsWith(route.path + "/")
    );

    if (!currentRoute) {
      // Not a protected route, allow access
      setPermissionState({ loading: false, hasPermission: true });
      return;
    }

    console.log(
      `🛡️ Route guard checking: ${location.pathname} (resource: ${currentRoute.resource})`
    );

    // Fetch user permissions
    fetch("/admin/users/me/permissions")
      .then((res) => {
        // If unauthorized (401), user is not logged in yet - allow access
        // The login flow will handle authentication
        if (res.status === 401) {
          console.log(
            `⚠️ User not authenticated yet - allowing access for login flow`
          );
          setPermissionState({ loading: false, hasPermission: true });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        // If data is null (from 401 response), skip permission check
        if (data === null) {
          return;
        }

        const permissions = data.permissions?.map((p: any) => p.name) || [];

        console.log(`🔐 User permissions:`, permissions);

        // Check if user has permission for this resource
        const hasPermission = hasResourcePermission(
          permissions,
          currentRoute.resource
        );

        console.log(
          `🎯 Has ${currentRoute.resource} permission: ${hasPermission}`
        );

        if (!hasPermission) {
          console.log(`🚫 Access denied for: ${location.pathname}`);
          setPermissionState({
            loading: false,
            hasPermission: false,
            resource: currentRoute.resource,
            action: "access",
          });
        } else {
          setPermissionState({ loading: false, hasPermission: true });
        }
      })
      .catch((error) => {
        console.error("❌ Error checking permissions:", error);
        // On error, allow access to prevent blocking the app
        setPermissionState({ loading: false, hasPermission: true });
      });
  }, [location.pathname]);

  return permissionState;
}

/**
 * Check if user has permission for a specific resource
 */
function hasResourcePermission(
  permissions: string[],
  resource: string
): boolean {
  // Super admin has all permissions
  if (permissions.includes("all-all")) {
    return true;
  }

  // Normalize resource name (handle both price_lists and price-lists)
  const normalizedResource = resource.replace(/-/g, "_");
  const alternateResource = resource.replace(/_/g, "-");

  // Check for any permission related to this resource
  const actions = ["list", "view", "create", "update", "delete", "all"];
  const resourcePermissions: string[] = [];

  actions.forEach((action) => {
    resourcePermissions.push(`${resource}-${action}`);
    if (normalizedResource !== resource) {
      resourcePermissions.push(`${normalizedResource}-${action}`);
    }
    if (alternateResource !== resource) {
      resourcePermissions.push(`${alternateResource}-${action}`);
    }
  });

  return resourcePermissions.some((perm) => permissions.includes(perm));
}

/**
 * Route Guard Component
 * Checks permissions and shows access denied UI if needed
 */
export const RouteGuard = () => {
  const { loading, hasPermission, resource, action } = useRouteGuard();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // If has permission, don't block the page
  if (hasPermission) {
    return null;
  }

  // Show access denied UI inline
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-lg text-center p-8">
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-ui-bg-component shadow-elevation-card-rest">
            <LockClosedSolid className="text-ui-fg-muted w-10 h-10" />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3">
            <Heading level="h1" className="text-ui-fg-base text-2xl">
              Access Denied
            </Heading>

            <Text className="text-ui-fg-subtle text-lg">
              You don't have permission to {action || "access"}{" "}
              <strong>{resource || "this page"}</strong>.
            </Text>

            <Text className="text-ui-fg-muted text-sm mt-2">
              If you believe this is an error, please contact your system
              administrator to request the necessary permissions for this
              resource.
            </Text>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ArrowUturnLeft />
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/app")}
            >
              Go to Home
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <Text className="text-xs text-ui-fg-muted">
              <strong>Required Permission:</strong> {resource}-list or{" "}
              {resource}
              -view
            </Text>
          </div>
        </div>
      </Container>
    </div>
  );
};
