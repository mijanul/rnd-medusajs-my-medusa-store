import { ExecArgs } from "@medusajs/framework/types";

/**
 * Test script to manually trigger price sync for a specific variant
 * This simulates what the subscriber does
 *
 * Usage:
 *   npx medusa exec ./src/scripts/test-manual-sync.ts
 */
export default async function testManualSync({ container }: ExecArgs) {
  const PINCODE_PRICING_MODULE = "pincodePricing";
  const variantId = "variant_01K8N5JT1PSH9YB9RBHB1VWN9R";

  try {
    console.log("🧪 MANUAL PRICE SYNC TEST");
    console.log("=".repeat(60));

    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    console.log(`\n1️⃣ Fetching variant: ${variantId}\n`);

    // Get the variant with its prices and product info
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
      console.log(`❌ Variant not found`);
      return;
    }

    const variant = variants[0];
    const product = variant.product;

    console.log(`Product: ${product.title}`);
    console.log(`Variant: ${variant.title}`);
    console.log(`SKU: ${variant.sku || "N/A"}`);

    // Find INR price
    const inrPrice = variant.price_set?.prices?.find(
      (p: any) => p.currency_code === "inr"
    );

    if (!inrPrice) {
      console.log(`\n❌ No INR price found`);
      return;
    }

    // Use the price amount directly (no conversion needed)
    const priceAmount = Number(inrPrice.amount);

    console.log(`\n2️⃣ Current Price:`);
    console.log(`   Amount: ${inrPrice.amount}`);
    console.log(`   Display Amount: ₹${priceAmount}`);

    // Get all dealers
    const dealers = await pricingService.listDealers({ is_active: true });

    if (dealers.length === 0) {
      console.log("\n❌ No active dealers found");
      return;
    }

    console.log(`\n3️⃣ Found ${dealers.length} active dealers`);

    // Get all unique pincodes
    const pincodeSet = new Set<string>();
    for (const dealer of dealers) {
      const pincodeDealers = await pricingService.listPincodeDealers({
        dealer_id: dealer.id,
        is_serviceable: true,
      });
      pincodeDealers.forEach((pd: any) => pincodeSet.add(pd.pincode));
    }

    console.log(`   ${pincodeSet.size} unique pincodes`);

    console.log(`\n4️⃣ Syncing prices...\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Sync prices for each dealer-pincode combination
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
            updated++;
            process.stdout.write(".");
          } else {
            // Create new price
            await pricingService.createProductPincodePrices({
              product_id: product.id,
              sku: variant.sku || product.handle,
              pincode: pincodeDealer.pincode,
              price: priceAmount,
              is_active: true,
            } as any);
            created++;
            process.stdout.write("+");
          }
        } catch (error) {
          console.error(`\n❌ Error: ${error.message}`);
          skipped++;
        }
      }
    }

    console.log("\n");
    console.log("=".repeat(60));
    console.log("✅ SYNC COMPLETE");
    console.log("=".repeat(60));
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\nAll pincode prices now: ₹${priceAmount}`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}
