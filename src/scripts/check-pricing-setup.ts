import { ExecArgs } from "@medusajs/framework/types";

/**
 * Quick check script to verify your pricing setup
 *
 * Usage:
 *   npx medusa exec ./src/scripts/check-pricing-setup.ts
 */
export default async function checkPricingSetup({ container }: ExecArgs) {
  const PINCODE_PRICING_MODULE = "pincodePricing";

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    console.log("🔍 PRICING SETUP CHECK");
    console.log("=".repeat(60));

    // 1. Check dealers
    console.log("\n1️⃣ DEALERS:");
    const dealers = await pricingService.listDealers({ is_active: true });
    console.log(`   Found ${dealers.length} active dealers`);
    dealers.forEach((d: any) => {
      console.log(`   - ${d.name} (${d.code})`);
    });

    if (dealers.length === 0) {
      console.log("\n   ⚠️ WARNING: No dealers found!");
      console.log(
        "   You need to create dealers first for pincode pricing to work."
      );
      console.log("\n   Quick fix: Create a default dealer");
      console.log("   Run this in your database or create via API:");
      console.log(`
   INSERT INTO dealer (id, code, name, is_active, created_at, updated_at)
   VALUES (
     'dealer_default',
     'DEFAULT',
     'Default Dealer',
     true,
     now(),
     now()
   );
      `);
    }

    // 2. Check pincode coverage
    console.log("\n2️⃣ PINCODE COVERAGE:");
    let totalPincodes = 0;
    for (const dealer of dealers) {
      const pincodeDealers = await pricingService.listPincodeDealers({
        dealer_id: dealer.id,
        is_serviceable: true,
      });
      totalPincodes += pincodeDealers.length;
      console.log(`   ${dealer.name}: ${pincodeDealers.length} pincodes`);
    }

    if (totalPincodes === 0) {
      console.log("\n   ⚠️ WARNING: No pincode coverage found!");
      console.log("   You need to assign pincodes to dealers.");
      console.log("\n   Quick fix: Add some pincodes");
      console.log("   Run this in your database or create via API:");
      console.log(`
   INSERT INTO pincode_dealer (id, pincode, dealer_id, is_serviceable, created_at, updated_at)
   VALUES
     ('pd_1', '110001', 'dealer_default', true, now(), now()),
     ('pd_2', '110002', 'dealer_default', true, now(), now()),
     ('pd_3', '400001', 'dealer_default', true, now(), now());
      `);
    }

    // 3. Check your specific product
    console.log("\n3️⃣ CHECKING YOUR PRODUCT:");
    const productId = "prod_01K8N5JT03JVFG160G07ZMHBRE";
    const variantId = "variant_01K8N5JT1PSH9YB9RBHB1VWN9R";

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

    if (variants && variants.length > 0) {
      const variant = variants[0];
      console.log(`   Product: ${variant.product.title}`);
      console.log(`   Variant: ${variant.title}`);
      console.log(`   SKU: ${variant.sku}`);

      console.log("\n   📊 Standard Prices:");
      const prices = variant.price_set?.prices || [];
      if (prices.length === 0) {
        console.log("   ⚠️ No prices found!");
      } else {
        prices.forEach((p: any) => {
          const amount = Number(p.amount);
          console.log(`   - ${p.currency_code.toUpperCase()}: ${amount}`);
        });
      }

      // Check pincode prices
      console.log("\n   📍 Pincode Prices:");
      const pincodePrices = await pricingService.listProductPincodePrices({
        product_id: productId,
      });

      if (pincodePrices.length === 0) {
        console.log("   ⚠️ No pincode prices found!");
        console.log("\n   This is why your price isn't updating!");
        console.log(
          "   The standard price table and pincode price table are separate."
        );
      } else {
        console.log(`   Found ${pincodePrices.length} pincode price entries`);
        const sample = pincodePrices.slice(0, 5);
        sample.forEach((p: any) => {
          console.log(
            `   - Pincode ${p.pincode}: ₹${Number(p.price).toFixed(2)}`
          );
        });
        if (pincodePrices.length > 5) {
          console.log(`   ... and ${pincodePrices.length - 5} more`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ CHECK COMPLETE\n");

    // Provide recommendations
    console.log("📋 RECOMMENDATIONS:");

    if (dealers.length === 0) {
      console.log("\n❌ CRITICAL: Create dealers first");
    } else if (totalPincodes === 0) {
      console.log("\n❌ CRITICAL: Add pincode coverage for dealers");
    } else {
      console.log("\n✅ Setup looks good!");
      console.log(
        "\n💡 To sync prices from standard pricing to pincode pricing:"
      );
      console.log("   npx medusa exec ./src/scripts/sync-prices-to-pincode.ts");
      console.log(
        "\n💡 From now on, price changes will auto-sync via subscriber"
      );
    }
  } catch (error) {
    console.error("\n❌ Error checking setup:", error);
    throw error;
  }
}
