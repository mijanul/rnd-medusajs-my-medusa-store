import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text } from "@medusajs/ui";

/**
 * Override product variant route to show disabled message
 */
const ProductVariantsDisabledPage = () => {
  return (
    <div className="flex flex-col gap-y-4 p-8">
      <div>
        <Heading level="h1">Product Variants</Heading>
        <Text className="text-ui-fg-subtle">
          Variant management has been disabled for this store.
        </Text>
      </div>

      <Container className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-6xl">🚫</div>
          <Heading level="h2">Variants Not Supported</Heading>
          <Text className="text-ui-fg-subtle max-w-md">
            This store has been configured to work without product variants.
            Each product is treated as a single SKU item with pricing managed
            through the Pincode Pricing system.
          </Text>
          <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
            <Text className="font-medium">To manage pricing:</Text>
            <Text className="text-sm text-ui-fg-subtle mt-1">
              Go to <strong>Pincode Pricing</strong> in the sidebar to upload
              product prices for different pincodes.
            </Text>
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Variants (Disabled)",
});

export default ProductVariantsDisabledPage;
