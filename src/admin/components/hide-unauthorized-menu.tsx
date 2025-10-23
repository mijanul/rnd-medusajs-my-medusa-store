import { useEffect } from "react";
import { useUserPermissions } from "../lib/use-permissions";

/**
 * Component to hide sidebar menu items based on user permissions
 * This is a UX enhancement - the real security is at the API level
 *
 * Usage: Add this component to your root layout or main app component
 */
export const HideUnauthorizedMenuItems = () => {
  const { hasPermission, loading } = useUserPermissions();

  useEffect(() => {
    if (loading) return;

    // Define menu items to hide based on permissions
    const menuItemsToCheck = [
      { href: "/orders", permission: { resource: "orders", action: "list" } },
      {
        href: "/products",
        permission: { resource: "products", action: "list" },
      },
      {
        href: "/customers",
        permission: { resource: "customers", action: "list" },
      },
      {
        href: "/inventory",
        permission: { resource: "inventory", action: "list" },
      },
      {
        href: "/promotions",
        permission: { resource: "promotions", action: "list" },
      },
      {
        href: "/price-lists",
        permission: { resource: "price_lists", action: "list" },
      },
    ];

    // Hide menu items for which user doesn't have permission
    menuItemsToCheck.forEach(({ href, permission }) => {
      if (!hasPermission(permission.resource, permission.action)) {
        // Find the link in the sidebar
        const link = document.querySelector(`a[href*="${href}"]`);
        if (link?.parentElement) {
          link.parentElement.style.display = "none";
        }
      }
    });

    // Re-show items when permissions change (e.g., after role update)
    return () => {
      menuItemsToCheck.forEach(({ href }) => {
        const link = document.querySelector(`a[href*="${href}"]`);
        if (link?.parentElement) {
          link.parentElement.style.display = "";
        }
      });
    };
  }, [hasPermission, loading]);

  // This component doesn't render anything
  return null;
};
