import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Script to show prices organized by product
 * Run: yarn medusa exec ./src/scripts/show-prices-by-product.ts
 */
export default async function showPricesByProduct({ container }: ExecArgs) {
  console.log("📋 Prices organized by product:\n");

  const pricingService = container.resolve(PINCODE_PRICING_MODULE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Get all products
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: {
        deleted_at: null,
      },
    });

    console.log(`Found ${products.length} products\n`);
    console.log("=".repeat(100));

    for (const product of products) {
      console.log(`\n📦 Product: ${product.title}`);
      console.log("-".repeat(100));

      // Get all prices for this product
      const prices = await pricingService.listProductPincodePrices(
        {
          product_id: product.id,
        },
        {
          relations: ["dealer"],
          order: { pincode: "ASC" },
        }
      );

      if (prices.length === 0) {
        console.log("  No prices found");
        continue;
      }

      // Calculate statistics for this product
      const priceValues = prices.map((p) => Number(p.price) / 100);
      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      const avgPrice =
        priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;

      console.log(`  Total prices: ${prices.length}`);
      console.log(
        `  Price range: ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`
      );
      console.log(`  Average price: ₹${avgPrice.toFixed(2)}`);
      console.log("\n  Pincode\t\tPrice (INR)");
      console.log("  " + "-".repeat(60));

      for (const price of prices) {
        const priceInINR = (Number(price.price) / 100).toFixed(2);
        console.log(`  ${price.pincode}\t\t₹${priceInINR}`);
      }
    }

    console.log("\n" + "=".repeat(100));
    console.log("\n✅ Complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}
