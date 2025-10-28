import { ExecArgs } from "@medusajs/framework/types";

/**
 * Manual script to sync ALL prices from standard Medusa pricing (currency-based)
 * to pincode pricing table.
 *
 * Usage:
 *   npx medusa exec ./src/scripts/sync-prices-to-pincode.ts
 *
 * This will:
 * 1. Get all products and their variants with INR prices
 * 2. Create/update pincode prices for all dealer-pincode combinations
 */
export default async function syncPricesToPincode({ container }: ExecArgs) {
  const PINCODE_PRICING_MODULE = "pincodePricing";

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    console.log("🔄 Starting price sync to pincode table...\n");

    // Get all products with their variants and prices
    const products = await remoteQuery({
      entryPoint: "product",
      fields: [
        "id",
        "handle",
        "title",
        "variants.*",
        "variants.price_set.*",
        "variants.price_set.prices.*",
      ],
    });

    console.log(`📦 Found ${products.length} products\n`);

    // Get all dealers
    const dealers = await pricingService.listDealers({ is_active: true });

    if (dealers.length === 0) {
      console.log("⚠️ No active dealers found. Create dealers first.");
      return;
    }

    console.log(`🏪 Found ${dealers.length} active dealers\n`);

    // Get all unique pincodes
    const pincodeSet = new Set<string>();
    for (const dealer of dealers) {
      const pincodeDealers = await pricingService.listPincodeDealers({
        dealer_id: dealer.id,
        is_serviceable: true,
      });
      pincodeDealers.forEach((pd: any) => pincodeSet.add(pd.pincode));
    }

    console.log(`📍 Found ${pincodeSet.size} unique pincodes\n`);

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Process each product
    for (const product of products) {
      console.log(`\n📦 Processing: ${product.title}`);

      if (!product.variants || product.variants.length === 0) {
        console.log(`  ⚠️ No variants found, skipping`);
        continue;
      }

      // Use the first variant's price (or you can loop through all variants)
      const variant = product.variants[0];

      // Find INR price
      const inrPrice = variant.price_set?.prices?.find(
        (p: any) => p.currency_code === "inr"
      );

      if (!inrPrice) {
        console.log(`  ℹ️ No INR price found, skipping`);
        continue;
      }

      // Convert from minor units to major units
      const priceAmount = Number(inrPrice.amount) / 100;
      console.log(`  💰 Price: ₹${priceAmount}`);

      let productCreated = 0;
      let productUpdated = 0;

      // Create prices for each dealer-pincode combination
      for (const dealer of dealers) {
        const dealerPincodes = await pricingService.listPincodeDealers({
          dealer_id: dealer.id,
          is_serviceable: true,
        });

        for (const pincodeDealer of dealerPincodes) {
          try {
            // Check if price already exists
            const existing = await pricingService.listProductPincodePrices({
              product_id: product.id,
              pincode: pincodeDealer.pincode,
              dealer_id: dealer.id,
            });

            if (existing.length > 0) {
              // Update existing price
              await pricingService.updateProductPincodePrices([
                {
                  id: existing[0].id,
                  price: priceAmount,
                },
              ]);
              productUpdated++;
              totalUpdated++;
            } else {
              // Create new price
              await pricingService.createProductPincodePrices({
                product_id: product.id,
                sku: variant.sku || product.handle,
                pincode: pincodeDealer.pincode,
                dealer_id: dealer.id,
                price: priceAmount,
                is_active: true,
              });
              productCreated++;
              totalCreated++;
            }
          } catch (error) {
            totalSkipped++;
          }
        }
      }

      console.log(`  ✅ ${productCreated} created, ${productUpdated} updated`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ SYNC COMPLETE");
    console.log("=".repeat(50));
    console.log(`Total Created: ${totalCreated}`);
    console.log(`Total Updated: ${totalUpdated}`);
    console.log(`Total Skipped: ${totalSkipped}`);
  } catch (error) {
    console.error("\n❌ Error syncing prices:", error);
    throw error;
  }
}
