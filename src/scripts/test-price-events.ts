import { ExecArgs } from "@medusajs/framework/types";

/**
 * Test script to understand what data is in price events
 */
export default async function testPriceEvents({ container }: ExecArgs) {
  console.log("🔍 Testing Price Event Data Structure\n");

  const remoteQuery = container.resolve("remoteQuery");
  const variantId = "variant_01K8N5JT1PSH9YB9RBHB1VWN9R";

  // Get variant with prices
  const variants = await remoteQuery({
    entryPoint: "product_variant",
    fields: [
      "id",
      "product_id",
      "sku",
      "title",
      "product.*",
      "price_set.*",
      "price_set.prices.*",
    ],
    variables: { id: variantId },
  });

  if (!variants || variants.length === 0) {
    console.log("❌ Variant not found");
    return;
  }

  const variant = variants[0];

  console.log("Variant Info:");
  console.log("- ID:", variant.id);
  console.log("- Product ID:", variant.product_id);
  console.log("- SKU:", variant.sku);
  console.log("- Price Set ID:", variant.price_set?.id);

  console.log("\nPrices:");
  variant.price_set?.prices?.forEach((p: any) => {
    console.log(`\nPrice Object:`);
    console.log("- ID:", p.id);
    console.log("- Amount:", p.amount);
    console.log("- Currency:", p.currency_code);
    console.log("- Price Set ID:", p.price_set_id);
  });

  console.log("\n💡 The subscriber should listen to:");
  console.log("   - product_variant.updated (has variant ID directly)");
  console.log("   - Then fetch the prices via price_set\n");
}
