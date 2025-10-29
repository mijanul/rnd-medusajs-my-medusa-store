import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";

/**
 * Analyze Current Database State
 *
 * This script documents the current state of the pricing system
 * before we begin migration.
 */
export default async function analyzeCurrentState({ container }: ExecArgs) {
  console.log("🔍 ANALYZING CURRENT DATABASE STATE");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    // 1. Count products
    console.log("📦 Products:");
    const products = await remoteQuery({
      entryPoint: "product",
      fields: ["id", "title", "handle"],
    });
    console.log(`   Total products: ${products.length}`);
    if (products.length > 0) {
      console.log(`   Sample: ${products[0].title} (${products[0].handle})`);
    }

    // 2. Count dealers
    console.log("\n🏢 Dealers:");
    const dealers = await pricingService.listDealers({});
    console.log(`   Total dealers: ${dealers.length}`);
    dealers.slice(0, 3).forEach((d: any) => {
      console.log(`   - ${d.name} (${d.code})`);
    });

    // 3. Count pincodes
    console.log("\n📍 Pincodes:");
    const pincodeDealers = await pricingService.listPincodeDealers({});
    const uniquePincodes = new Set(pincodeDealers.map((pd: any) => pd.pincode));
    console.log(`   Total unique pincodes: ${uniquePincodes.size}`);
    console.log(
      `   Sample pincodes: ${Array.from(uniquePincodes).slice(0, 5).join(", ")}`
    );

    // 4. Count pincode prices
    console.log("\n💰 Pincode Prices:");
    const pincodePrices = await pricingService.listProductPincodePrices({});
    console.log(`   Total price entries: ${pincodePrices.length}`);

    // Group by product
    const pricesByProduct: any = {};
    pincodePrices.forEach((p: any) => {
      if (!pricesByProduct[p.product_id]) {
        pricesByProduct[p.product_id] = [];
      }
      pricesByProduct[p.product_id].push(p);
    });

    console.log(
      `   Products with prices: ${Object.keys(pricesByProduct).length}`
    );
    console.log(
      `   Avg prices per product: ${(
        pincodePrices.length / Object.keys(pricesByProduct).length
      ).toFixed(2)}`
    );

    // 5. Price statistics
    console.log("\n📊 Price Statistics:");
    const prices = pincodePrices.map((p: any) => Number(p.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    console.log(`   Min price: ₹${minPrice.toFixed(2)}`);
    console.log(`   Max price: ₹${maxPrice.toFixed(2)}`);
    console.log(`   Avg price: ₹${avgPrice.toFixed(2)}`);

    // 6. Sample data
    console.log("\n📋 Sample Price Entries:");
    const samplePrices = pincodePrices.slice(0, 5);
    console.log("   Product ID | Pincode | Price | Active");
    console.log("   " + "-".repeat(50));
    samplePrices.forEach((p: any) => {
      const productId = p.product_id.substring(0, 15) + "...";
      const price = `₹${Number(p.price).toFixed(2)}`;
      const active = p.is_active ? "✅" : "❌";
      console.log(
        `   ${productId} | ${p.pincode} | ${price.padEnd(10)} | ${active}`
      );
    });

    // 7. Medusa standard prices (for comparison)
    console.log("\n🏷️ Medusa Standard Prices (for comparison):");
    const variants = await remoteQuery({
      entryPoint: "product_variant",
      fields: ["id", "sku", "product_id", "price_set.*", "price_set.prices.*"],
      variables: {
        take: 5,
      },
    });

    variants.forEach((v: any) => {
      const inrPrice = v.price_set?.prices?.find(
        (p: any) => p.currency_code === "inr"
      );
      if (inrPrice) {
        console.log(
          `   Variant ${v.sku}: ₹${Number(inrPrice.amount).toFixed(
            2
          )} (standard price)`
        );
      }
    });

    // 8. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY:");
    console.log("=".repeat(60));
    console.log(`Products: ${products.length}`);
    console.log(`Dealers: ${dealers.length}`);
    console.log(`Unique Pincodes: ${uniquePincodes.size}`);
    console.log(`Pincode Prices: ${pincodePrices.length}`);
    console.log(`Products with Prices: ${Object.keys(pricesByProduct).length}`);
    console.log(
      `Price Range: ₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`
    );

    // 9. Migration estimates
    console.log("\n🎯 MIGRATION ESTIMATES:");
    console.log("=".repeat(60));

    // Estimate regions (assume ~100 pincodes per region)
    const estimatedRegions = Math.ceil(uniquePincodes.size / 100);
    console.log(`Estimated Regions to Create: ${estimatedRegions}`);
    console.log(`Estimated Prices to Migrate: ${pincodePrices.length}`);
    console.log(
      `Estimated Migration Time: ${(pincodePrices.length / 1000).toFixed(
        2
      )} minutes (at 1000/min)`
    );

    console.log("\n✅ Analysis complete!");
    console.log("\nNext steps:");
    console.log("1. Review the summary above");
    console.log(
      "2. Create backup: npx medusa exec ./src/scripts/backup-database.ts"
    );
    console.log("3. Create migration: Day 2 - Database Schema");
  } catch (error) {
    console.error("\n❌ Error analyzing state:", error);
    throw error;
  }
}
