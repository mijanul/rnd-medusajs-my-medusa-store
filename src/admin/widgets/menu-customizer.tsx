/**
 * Menu Customizer Widget
 *
 * This widget:
 * 1. Initializes the global API interceptor for 403 redirects
 * 2. Hides menu items based on user permissions
 *
 * It runs on EVERY page load to ensure proper access control.
 * Uses multiple zones to ensure it loads regardless of which page user lands on.
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect, useRef } from "react";
import { useUserPermissions } from "../lib/menu-config";

// Initialize the API interceptor immediately when this module loads
import "../lib/api-interceptor";

const MenuCustomizer = () => {
  const { permissions, loading } = useUserPermissions();
  // Prevent multiple executions with a ref
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Only initialize once per page load (prevent duplicates if widget loads multiple times)
    if (hasInitialized.current) {
      console.log("🔄 Menu Customizer already initialized, skipping...");
      return;
    }

    hasInitialized.current = true;

    // DEBUG: Log permissions when loaded
    console.log("🔑 Menu Customizer - User Permissions:", permissions);

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

    // Wait for the menu to be rendered
    const checkAndHideMenuItems = () => {
      // Find all navigation links
      const menuLinks = document.querySelectorAll('nav a[href*="/app/"]');

      console.log(`🔍 Found ${menuLinks.length} menu links to check`);

      menuLinks.forEach((link, index) => {
        const href = link.getAttribute("href");
        if (!href) return;

        const linkText = link.textContent?.trim() || "Unknown";

        console.log(`\n📋 Link ${index + 1}: "${linkText}" → ${href}`);

        // Check each protected route
        let matched = false;
        for (const route of protectedRoutes) {
          // Use exact match or startsWith for better precision
          // This prevents /app/orders from catching /app/orders/drafts
          const isExactMatch = href === route.path;
          const isSubRoute = href.startsWith(route.path + "/");
          const matchesRoute = isExactMatch || isSubRoute;

          if (matchesRoute) {
            console.log(
              `   🔍 Checking route: ${route.path} (exact: ${isExactMatch}, sub: ${isSubRoute})`
            );

            // If there's an exclude path, skip this link
            if (route.excludePath && href.includes(route.excludePath)) {
              console.log(
                `   ⏭️  Excluded due to excludePath: ${route.excludePath}`
              );
              continue;
            }

            matched = true;

            console.log(
              `   🎯 Matched route: ${route.path} (resource: ${route.resource})`
            );

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
                console.log(`   🚫 HIDING menu item: "${linkText}"`);
                (menuItem as HTMLElement).style.display = "none";
              }
            } else {
              console.log(`   ✅ SHOWING menu item: "${linkText}"`);
            }

            break; // Found matching route, no need to check others
          }
        }

        if (!matched) {
          console.log(`   ⚠️  No matching route found - leaving visible`);
        }
      });
    };

    // Run immediately
    checkAndHideMenuItems();

    // Run again after a short delay (in case menu loads async)
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
      // Reset on cleanup so it can reinitialize on next page
      hasInitialized.current = false;
    };
  }, [permissions, loading]);

  // This widget doesn't render any visible UI
  return null;
};

/**
 * Check if user has permission for a specific resource
 * @param permissions - Array of user's permissions (e.g., ["pages-list", "orders-view"])
 * @param resource - Resource name (e.g., "customers", "orders", "products")
 * @returns true if user has ANY permission for that resource
 */
function hasResourcePermission(
  permissions: string[],
  resource: string
): boolean {
  // Super admin has all permissions
  if (permissions.includes("all-all")) {
    console.log(`      👑 Super admin detected - has all permissions`);
    return true;
  }

  // Normalize resource name (handle both price_lists and price-lists)
  const normalizedResource = resource.replace(/-/g, "_");
  const alternateResource = resource.replace(/_/g, "-");

  // Check for any permission related to this resource
  // Format: "resource-action" (e.g., "customers-list", "orders-create")
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

  const hasAny = resourcePermissions.some((perm) => permissions.includes(perm));

  // DEBUG: Detailed logging
  if (hasAny) {
    const found = resourcePermissions.filter((perm) =>
      permissions.includes(perm)
    );
    console.log(`      ✅ Has ${resource} permission:`, found);
  } else {
    console.log(`      ❌ No ${resource} permission found`);
    console.log(`      📝 Looking for:`, resourcePermissions.slice(0, 6)); // Show first 6
    console.log(`      📦 User permissions:`, permissions);
  }

  return hasAny;
}

// Widget configuration - inject into multiple zones to ensure it loads on all pages
// This ensures the widget runs regardless of which page the user lands on (e.g., /app/settings)
export const config = defineWidgetConfig({
  zone: [
    // List pages - most commonly accessed
    "order.list.before",
    "product.list.before",
    "customer.list.before",
    "customer_group.list.before",
    "promotion.list.before",
    "location.list.before",
    "inventory_item.list.before",
    "price_list.list.before",
    "sales_channel.list.before",
    "api_key.list.before",
    "user.list.before",
    "order.details.before",
    "product.details.before",
    "customer.details.before",
    "customer_group.details.before",
  ],
});

export default MenuCustomizer;
