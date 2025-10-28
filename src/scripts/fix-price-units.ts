import { ExecArgs } from "@medusajs/framework/types";

/**
 * Fix price units - Convert from wrong units to correct units
 *
 * This script fixes prices that were entered incorrectly:
 * - Current: 2200 (showing as ₹22.00)
 * - Should be: 220000 (to show as ₹2,200.00)
 *
 * Usage:
 *   npx medusa exec ./src/scripts/fix-price-units.ts
 */
export default async function fixPriceUnits({ container }: ExecArgs) {
  const PINCODE_PRICING_MODULE = "pincodePricing";
  const PRICING_MODULE = "pricingService";

  try {
    console.log("🔧 FIXING PRICE UNITS");
    console.log("=".repeat(60));

    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    // Get your specific product
    const productId = "prod_01K8N5JT03JVFG160G07ZMHBRE";
    const variantId = "variant_01K8N5JT1PSH9YB9RBHB1VWN9R";

    console.log("\n1️⃣ Checking current prices...\n");

    // Get variant with prices
    const variants = await remoteQuery({
      entryPoint: "product_variant",
      fields: [
        "id",
        "product_id",
        "sku",
        "title",
        "product.title",
        "price_set.*",
        "price_set.prices.*",
      ],
      variables: { id: variantId },
    });

    if (!variants || variants.length === 0) {
      console.log("❌ Variant not found!");
      return;
    }

    const variant = variants[0];
    console.log(`Product: ${variant.product.title}`);
    console.log(`Variant: ${variant.title}`);

    const inrPrice = variant.price_set?.prices?.find(
      (p: any) => p.currency_code === "inr"
    );

    if (!inrPrice) {
      console.log("❌ No INR price found!");
      return;
    }

    const currentAmount = Number(inrPrice.amount);
    const displayAmount = currentAmount / 100;

    console.log(
      `\nCurrent Amount: ${currentAmount} (displaying as ₹${displayAmount})`
    );

    // Determine the multiplier
    console.log("\n2️⃣ What should the price be?");
    console.log("   Options:");
    console.log(
      `   a) ₹${displayAmount} (keep as is) - Amount: ${currentAmount}`
    );
    console.log(
      `   b) ₹${displayAmount * 100} (multiply by 100) - Amount: ${
        currentAmount * 100
      }`
    );
    console.log("\n   Since you mentioned ₹2,200.00, I'll assume option b)\n");

    const correctAmount = currentAmount * 100;
    const correctDisplay = correctAmount / 100;

    console.log("3️⃣ Updating prices...\n");

    // Note: For standard price, update via admin panel
    console.log("⚠️ Standard price needs manual update:");
    console.log(`   Current: ${currentAmount}`);
    console.log(`   Should be: ${correctAmount}`);
    console.log(
      `   Go to admin panel → Product → Variant → Change price to: ${correctAmount}`
    );
    console.log("");

    // Update pincode prices
    const pincodePrices = await pricingService.listProductPincodePrices({
      product_id: productId,
    });

    console.log(`\n4️⃣ Updating ${pincodePrices.length} pincode prices...\n`);

    let updated = 0;
    for (const price of pincodePrices) {
      try {
        const newPrice = Number(price.price) * 100;
        await pricingService.updateProductPincodePrices([
          {
            id: price.id,
            price: newPrice,
          },
        ]);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating price ${price.id}:`, error.message);
      }
    }

    console.log(`✅ Updated ${updated} pincode prices`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ PRICE FIX COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nNew price: ₹${correctDisplay}`);
    console.log("\n💡 Verify by running:");
    console.log("   npx medusa exec ./src/scripts/check-pricing-setup.ts");
  } catch (error) {
    console.error("\n❌ Error fixing prices:", error);
    throw error;
  }
}
