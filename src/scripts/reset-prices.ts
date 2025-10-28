import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Script to delete all existing prices and add random prices in INR
 * Run: yarn medusa exec ./src/scripts/reset-prices.ts
 */
export default async function resetPrices({ container }: ExecArgs) {
  console.log("🔄 Starting price reset...");

  const pricingService = container.resolve(PINCODE_PRICING_MODULE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // 1. Delete all existing prices
    console.log("\n📦 Step 1: Deleting all existing prices...");
    const existingPrices = await pricingService.listProductPincodePrices({});
    console.log(`Found ${existingPrices.length} existing prices`);

    for (const price of existingPrices) {
      await pricingService.softDeleteProductPincodePrices([price.id]);
    }
    console.log("✅ All existing prices deleted");

    // 2. Get all products
    console.log("\n📦 Step 2: Fetching all products...");
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle"],
      filters: {
        deleted_at: null,
      },
    });
    console.log(`Found ${products.length} products`);

    if (products.length === 0) {
      console.log("⚠️ No products found. Please create products first.");
      return;
    }

    // 3. Get all pincodes from pincode_dealer
    console.log("\n📦 Step 3: Fetching all pincodes...");
    const pincodeDealers = await pricingService.listPincodeDealers({
      is_serviceable: true,
    });
    console.log(`Found ${pincodeDealers.length} pincode-dealer combinations`);

    if (pincodeDealers.length === 0) {
      console.log(
        "⚠️ No pincodes found. Please run seed-pincode-pricing first."
      );
      return;
    }

    // Get unique pincodes
    const uniquePincodes = [...new Set(pincodeDealers.map((pd) => pd.pincode))];
    console.log(`Found ${uniquePincodes.length} unique pincodes`);

    // 4. Get dealers for each pincode
    console.log("\n📦 Step 4: Organizing dealers by pincode...");
    const pincodeToDealer = new Map();
    for (const pd of pincodeDealers) {
      if (!pincodeToDealer.has(pd.pincode)) {
        pincodeToDealer.set(pd.pincode, []);
      }
      pincodeToDealer.get(pd.pincode).push(pd.dealer_id);
    }

    // 5. Generate random prices for each product-pincode combination
    console.log(
      "\n📦 Step 5: Generating random prices for products in each pincode..."
    );

    const pricesData: Array<{
      product_id: string;
      sku: string;
      pincode: string;
      dealer_id: string;
      price: number;
      is_active: boolean;
    }> = [];
    let count = 0;

    for (const product of products) {
      // Generate a base price for this product (in INR)
      const basePrice = Math.floor(Math.random() * (9999 - 499 + 1) + 499); // Random between ₹499 and ₹9999

      console.log(`\n  Product: ${product.title} (Base: ₹${basePrice})`);

      for (const pincode of uniquePincodes) {
        const dealers = pincodeToDealer.get(pincode) || [];

        // Pick one random dealer for this pincode
        const randomDealer =
          dealers[Math.floor(Math.random() * dealers.length)];

        // Add some variance to the price (+/- 10%)
        const variance = Math.floor(basePrice * 0.1);
        const finalPrice =
          basePrice + Math.floor(Math.random() * (variance * 2 + 1)) - variance;

        // Convert to paise (smallest unit)
        const priceInPaise = finalPrice * 100;

        pricesData.push({
          product_id: product.id,
          sku: product.handle, // Using handle as SKU
          pincode: pincode,
          dealer_id: randomDealer,
          price: priceInPaise,
          is_active: true,
        });

        count++;

        // Batch insert every 100 records
        if (pricesData.length >= 100) {
          await pricingService.createProductPincodePrices(pricesData);
          console.log(`    ✓ Inserted ${count} prices so far...`);
          pricesData.length = 0; // Clear array
        }
      }
    }

    // Insert remaining prices
    if (pricesData.length > 0) {
      await pricingService.createProductPincodePrices(pricesData);
    }

    console.log(`\n✅ Successfully generated ${count} random prices!`);
    console.log("\n📊 Summary:");
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Pincodes: ${uniquePincodes.length}`);
    console.log(`  - Total prices: ${count}`);
    console.log(
      `  - Price range: ₹499 - ₹9999 (with ±10% variance per pincode)`
    );
    console.log("\n✨ Price reset complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}
