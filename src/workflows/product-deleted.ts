import { Modules } from "@medusajs/framework/utils";

/**
 * Workflow hook that runs when a product is deleted
 * Cleans up associated pincode pricing data
 */
export default async function productDeletedWorkflow({
  container,
  data,
}: {
  container: any;
  data: { id: string };
}) {
  const PINCODE_PRICING_MODULE = "pincodePricing";

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      console.log("Pincode pricing service not found, skipping cleanup");
      return;
    }

    // Get all prices for this product
    const prices = await pricingService.listProductPincodePrices({
      product_id: data.id,
    });

    if (prices.length === 0) {
      console.log(`No pricing data found for deleted product ${data.id}`);
      return;
    }

    // Delete all pricing entries for this product
    const priceIds = prices.map((price: any) => price.id);
    await pricingService.deleteProductPincodePrices(priceIds);

    console.log(
      `✅ Deleted ${prices.length} pricing entries for product ${data.id}`
    );
  } catch (error) {
    console.error(
      `Error cleaning up pricing data for product ${data.id}:`,
      error
    );
    // Don't throw error - we don't want to block product deletion
  }
}
