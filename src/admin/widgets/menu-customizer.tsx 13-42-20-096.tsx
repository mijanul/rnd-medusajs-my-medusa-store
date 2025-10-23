/**
 * Menu Customizer Widget
 *
 * This widget hides menu items based on user permissions.
 * It runs on every page load to ensure proper access control.
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect, useRef } from "react";
import { useUserPermissions } from "../lib/menu-config";

const MenuCustomizer = () => {
  const { permissions, loading } = useUserPermissions();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Only initialize once per page load
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    console.log("🎨 Menu Customizer - Checking permissions for menu items");

    // Define protected routes and their required resource permissions
    const protectedRoutes = [
      { path: "/app/orders", resource: "orders" },
      { path: "/app/products", resource: "products" },
      { path: "/app/customers", resource: "customers" },
      { path: "/app/customer-groups", resource: "customers" },
      { path: "/app/inventory", resource: "inventory" },
      { path: "/app/promotions", resource: "promotions" },
      { path: "/app/pricing", resource: "price_lists" },
      { path: "/app/price-lists", resource: "price_lists" },
    ];

    const checkAndHideMenuItems = () => {
      // Find all navigation links
      const menuLinks = document.querySelectorAll('nav a[href*="/app/"]');

      console.log(`🔍 Found ${menuLinks.length} menu links to check`);

      menuLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        const linkText = link.textContent?.trim() || "Unknown";

        // Check if this link matches a protected route
        const matchedRoute = protectedRoutes.find((route) =>
          href.startsWith(route.path)
        );

        if (!matchedRoute) {
          // Not a protected route, keep visible
          return;
        }

        // Check if user has permission for this resource
        const hasPermission = hasResourcePermission(
          permissions,
          matchedRoute.resource
        );

        if (!hasPermission) {
          // Hide the entire menu item
          const menuItem =
            link.closest("li") ||
            link.closest("[role='menuitem']") ||
            link.parentElement;

          if (menuItem) {
            console.log(`🚫 Hiding menu item: "${linkText}"`);
            (menuItem as HTMLElement).style.display = "none";
          }
        } else {
          console.log(`✅ Showing menu item: "${linkText}"`);
        }
      });
    };

    // Run immediately
    checkAndHideMenuItems();

    // Run again after delays to catch dynamically loaded menus
    const timer1 = setTimeout(checkAndHideMenuItems, 500);
    const timer2 = setTimeout(checkAndHideMenuItems, 1000);

    // Observe DOM changes for dynamic menu rendering
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

  return null; // This widget doesn't render any visible UI
};

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

// Widget configuration - load on multiple zones to ensure it runs on all pages
export default defineWidgetConfig({
  zone: [
    "order.list.before",
    "order.details.before",
    "product.list.before",
    "product.details.before",
    "customer.list.before",
    "customer.details.before",
    "customer_group.list.before",
    "customer_group.details.before",
    "inventory_item.list.before",
    "promotion.list.before",
    "price_list.list.before",
  ],
});

export const Component = MenuCustomizer;
