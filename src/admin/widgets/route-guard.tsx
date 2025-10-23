import { defineWidgetConfig } from "@medusajs/admin-sdk";
// import { RouteGuard } from "../lib/route-guard";

// DISABLED: Route guard is causing login issues
// The API interceptor and menu hiding will handle access control
// Re-enable this later after fixing authentication flow

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
    "inventory_item.details.before",
    "promotion.list.before",
    "promotion.details.before",
    "price_list.list.before",
    "price_list.details.before",
  ],
});

// Return null component to disable the widget
export const Component = () => null;
