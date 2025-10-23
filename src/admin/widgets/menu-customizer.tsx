import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useEffect, useRef } from "react";
import { useUserPermissions } from "../lib/menu-config";

import "../lib/api-interceptor";

const MenuCustomizer = () => {
  const { permissions, loading } = useUserPermissions();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

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

    const checkAndHideMenuItems = () => {
      const menuLinks = document.querySelectorAll('nav a[href*="/app/"]');

      menuLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        let matched: boolean = false;
        for (const route of protectedRoutes) {
          const isExactMatch = href === route.path;
          const isSubRoute = href.startsWith(route.path + "/");
          const matchesRoute = isExactMatch || isSubRoute;

          if (matchesRoute) {
            if (route.excludePath && href.includes(route.excludePath)) {
              continue;
            }

            matched = true;

            const hasPermission = hasResourcePermission(
              permissions,
              route.resource
            );

            if (!hasPermission) {
              const menuItem =
                link.closest("li") ||
                link.closest("[role='menuitem']") ||
                link.parentElement;
              if (menuItem) {
                (menuItem as HTMLElement).style.position = "absolute";
                (menuItem as HTMLElement).style.top = "-9999px";
              }
            } else {
            }
          }
        }
      });
    };

    checkAndHideMenuItems();

    const timer1 = setTimeout(checkAndHideMenuItems, 500);
    const timer2 = setTimeout(checkAndHideMenuItems, 1000);

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

  return null;
};

function hasResourcePermission(
  permissions: string[],
  resource: string
): boolean {
  if (permissions.includes("all-all")) {
    return true;
  }

  const normalizedResource = resource.replace(/-/g, "_");
  const alternateResource = resource.replace(/_/g, "-");

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

  const hasAny = resourcePermissions.some((perm) => permissions.includes(perm));

  return hasAny;
}

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
    "customer.details.side.before",
  ],
});

export default MenuCustomizer;
