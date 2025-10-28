import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Subscriber that listens to product deletion events
 * and cleans up associated pincode pricing data
 */
export default async function handleProductDeleted({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const PINCODE_PRICING_MODULE = "pincodePricing";

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      console.log("Pincode pricing service not found, skipping cleanup");
      return;
    }

    const productId = data.id;

    // Get all prices for this product
    const prices = await pricingService.listProductPincodePrices({
      product_id: productId,
    });

    if (prices.length === 0) {
      console.log(`No pricing data found for deleted product ${productId}`);
      return;
    }

    // Delete all pricing entries for this product
    const priceIds = prices.map((price: any) => price.id);
    await pricingService.deleteProductPincodePrices(priceIds);

    console.log(
      `✅ Deleted ${prices.length} pricing entries for product ${productId}`
    );
  } catch (error) {
    console.error(
      `Error cleaning up pricing data for product ${data.id}:`,
      error
    );
    // Log error but don't throw - we don't want to block product deletion
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
};
