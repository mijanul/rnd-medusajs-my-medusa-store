import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";

/**
 * Script to verify the generated prices
 * Run: yarn medusa exec ./src/scripts/verify-prices.ts
 */
export default async function verifyPrices({ container }: ExecArgs) {
  console.log("🔍 Verifying generated prices...\n");

  const pricingService = container.resolve(PINCODE_PRICING_MODULE);

  try {
    // Get all prices
    const allPrices = await pricingService.listProductPincodePrices(
      {},
      {
        relations: ["dealer"],
        take: 20,
      }
    );

    console.log(`Found ${allPrices.length} prices (showing first 20):\n`);

    // Display prices in a nice format
    console.log("Product ID\t\t\t\tPincode\t\tPrice (INR)\tDealer");
    console.log("-".repeat(100));

    for (const price of allPrices) {
      const priceInINR = (Number(price.price) / 100).toFixed(2);
      console.log(
        `${price.product_id.substring(0, 25)}...\t${
          price.pincode
        }\t\t₹${priceInINR}\t\t${price.dealer.name}`
      );
    }

    // Get statistics
    const allPricesForStats = await pricingService.listProductPincodePrices({});
    const prices = allPricesForStats.map((p) => Number(p.price) / 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    console.log("\n📊 Statistics:");
    console.log(`  Total prices: ${allPricesForStats.length}`);
    console.log(`  Min price: ₹${minPrice.toFixed(2)}`);
    console.log(`  Max price: ₹${maxPrice.toFixed(2)}`);
    console.log(`  Avg price: ₹${avgPrice.toFixed(2)}`);

    console.log("\n✅ Verification complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}
