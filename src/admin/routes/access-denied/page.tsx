import { Container, Heading, Text } from "@medusajs/ui";
import { useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useUserPermissions } from "../../lib/menu-config";

// Initialize the API interceptor immediately when this module loads
import "../../lib/api-interceptor";

/**
 * Access Denied Page
 * Shown when user tries to access a resource without proper permissions
 */
const AccessDeniedPage = () => {
  const [searchParams] = useSearchParams();
  const { permissions, loading } = useUserPermissions();
  const hasInitialized = useRef(false);

  const resource = searchParams.get("resource") || "this page";
  const action = searchParams.get("action") || "access";
  const permission = searchParams.get("permission") || `${resource}-${action}`;

  // Menu customizer logic - hide menu items based on permissions
  useEffect(() => {
    if (loading) return;

    // Only initialize once per page load
    if (hasInitialized.current) {
      // ...existing code...
      return;
    }

    hasInitialized.current = true;
    // ...existing code...

    // Define protected routes and their required resource permissions
    const protectedRoutes = [
      { path: "/app/orders", resource: "orders", exact: false },
      { path: "/app/products", resource: "products", exact: false },
      {
        path: "/app/customers",
        resource: "customers",
        excludePath: "customer-groups",
        exact: false,
      },
      { path: "/app/customer-groups", resource: "customers", exact: false },
      { path: "/app/inventory", resource: "inventory", exact: false },
      { path: "/app/promotions", resource: "promotions", exact: false },
      { path: "/app/pricing", resource: "price_lists", exact: false },
      { path: "/app/price-lists", resource: "price_lists", exact: false },
      { path: "/app/pages", resource: "pages", exact: false },
      { path: "/app/settings", resource: "settings", exact: false },
    ];

    const hasResourcePermission = (
      permissions: string[],
      resource: string
    ): boolean => {
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

      // Add both formats to handle inconsistencies
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
    };

    // Wait for the menu to be rendered
    const checkAndHideMenuItems = () => {
      // Find all navigation links
      const menuLinks = document.querySelectorAll('nav a[href*="/app/"]');

      // ...existing code...

      menuLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        // Check each protected route
        for (const route of protectedRoutes) {
          const isExactMatch = href === route.path;
          const isSubRoute = href.startsWith(route.path + "/");
          const matchesRoute = isExactMatch || isSubRoute;

          if (matchesRoute) {
            // If there's an exclude path, skip this link
            if (route.excludePath && href.includes(route.excludePath)) {
              continue;
            }

            // Check if user has permission for this resource
            const hasPermission = hasResourcePermission(
              permissions,
              route.resource
            );

            if (!hasPermission) {
              // Hide the entire menu item
              const menuItem =
                link.closest("li") ||
                link.closest("[role='menuitem']") ||
                link.parentElement;
              if (menuItem) {
                // ...existing code...
                (menuItem as HTMLElement).style.position = "absolute";
                (menuItem as HTMLElement).style.top = "-9999px";
              }
            }

            break; // Found matching route, no need to check others
          }
        }
      });
    };

    // Run immediately
    checkAndHideMenuItems();

    // Run again after short delays (in case menu loads async)
    const timer1 = setTimeout(checkAndHideMenuItems, 500);
    const timer2 = setTimeout(checkAndHideMenuItems, 1000);

    // Observe DOM changes to handle dynamic menu rendering
    const observer = new MutationObserver(checkAndHideMenuItems);
    const targetNode = document.querySelector("nav") || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      hasInitialized.current = false;
    };
  }, [permissions, loading]);

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6 max-w-lg text-center p-8">
        {/* Icon */}
        {/* <div className="flex items-center justify-center w-20 h-20 rounded-full bg-ui-bg-component shadow-elevation-card-rest">
          <LockClosedSolid className="text-ui-fg-muted w-10 h-10" />
        </div> */}

        {/* Content */}
        <div className="flex flex-col gap-3">
          <Heading level="h1" className="text-ui-fg-base text-2xl">
            Access Denied
          </Heading>

          <Text className="text-ui-fg-subtle text-lg">
            You don't have permission to {action} <strong>{resource}</strong>.
          </Text>

          <Text className="text-ui-fg-muted text-sm mt-2">
            If you believe this is an error, please contact your system
            administrator to request the necessary permissions for this
            resource.
          </Text>
        </div>

        {/* Actions */}
        {/* <div className="flex items-center gap-3 mt-4">
          <Button variant="secondary" onClick={handleGoBack}>
            <ArrowUturnLeft />
            Go Back
          </Button>
          <Button variant="primary" onClick={handleGoHome}>
            Go to Home
          </Button>
        </div> */}

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <Text className="text-xs text-ui-fg-muted">
            <strong>Required Permission:</strong> {permission}
          </Text>
        </div>
      </div>
    </Container>
  );
};

export default AccessDeniedPage;
