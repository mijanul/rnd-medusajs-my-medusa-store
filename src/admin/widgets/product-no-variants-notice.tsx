import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Text } from "@medusajs/ui";

/**
 * Widget to hide/disable variant section in product create/edit
 * Shown on product details page
 */
const ProductVariantDisabledWidget = () => {
  return (
    <Container className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
      <Text className="text-ui-fg-base font-medium">ℹ️ Variants Disabled</Text>
      <Text className="text-ui-fg-subtle text-sm mt-2">
        This store does not use product variants. Each product is a single SKU
        item. Manage pricing through the Pincode Pricing module.
      </Text>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.before",
});

export default ProductVariantDisabledWidget;
