import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Subscriber that syncs prices from standard Medusa pricing (currency-based)
 * to pincode pricing table automatically.
 *
 * This allows you to:
 * 1. Add prices in the admin panel (e.g., ₹2,200 in INR)
 * 2. Have them automatically create pincode-based prices for all dealers
 */
export default async function handlePriceSync({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const PINCODE_PRICING_MODULE = "pincodePricing";

  try {
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      console.log("⚠️ Pincode pricing service not found, skipping sync");
      return;
    }

    console.log("🔄 Price sync triggered:", JSON.stringify(data, null, 2));

    // Get the variant ID from the event data
    // For product_variant.updated: data.id is the variant ID
    const variantId = data.id;

    if (!variantId) {
      console.log("⚠️ No variant ID found in event data");
      return;
    }

    // Get the variant with its prices and product info
    const remoteQuery = container.resolve("remoteQuery");
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
      console.log(`⚠️ Variant ${variantId} not found`);
      return;
    }

    const variant = variants[0];
    const product = variant.product;

    // Find INR price (or any currency you want to sync)
    const inrPrice = variant.price_set?.prices?.find(
      (p: any) => p.currency_code === "inr"
    );

    if (!inrPrice) {
      console.log(`ℹ️ No INR price found for variant ${variantId}`);
      return;
    }

    // Use the price amount directly (no conversion needed)
    // Medusa stores prices as-is: 999 = ₹999.00, 2200 = ₹2,200.00
    const priceAmount = Number(inrPrice.amount);

    console.log(
      `💰 Found INR price: ₹${priceAmount} for variant ${variant.sku}`
    );

    // Get all dealers to create prices for
    const dealers = await pricingService.listDealers({ is_active: true });

    if (dealers.length === 0) {
      console.log("⚠️ No active dealers found. Create dealers first.");
      return;
    }

    // Get all unique pincodes from dealer coverage
    const pincodeSet = new Set<string>();
    for (const dealer of dealers) {
      const pincodeDealers = await pricingService.listPincodeDealers({
        dealer_id: dealer.id,
        is_serviceable: true,
      });
      pincodeDealers.forEach((pd: any) => pincodeSet.add(pd.pincode));
    }

    const pincodes = Array.from(pincodeSet);
    console.log(
      `📍 Found ${pincodes.length} unique pincodes across ${dealers.length} dealers`
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Create pincode prices for each dealer-pincode combination
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
          } else {
            // Create new price
            await pricingService.createProductPincodePrices({
              product_id: product.id,
              sku: variant.sku || product.handle,
              pincode: pincodeDealer.pincode,

              price: priceAmount,
              is_active: true,
            });
            created++;
          }
        } catch (error) {
          console.error(
            `❌ Error syncing price for ${pincodeDealer.pincode}:`,
            error.message
          );
          skipped++;
        }
      }
    }

    console.log(
      `✅ Price sync complete: ${created} created, ${updated} updated, ${skipped} skipped`
    );
  } catch (error) {
    console.error("❌ Error in price sync subscriber:", error);
    // Don't throw - we don't want to block price creation
  }
}

export const config: SubscriberConfig = {
  event: ["product_variant.updated"],
};
