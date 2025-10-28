import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * POST /admin/pincode-pricing/sync-product/:product_id
 * Sync prices from standard Medusa pricing to pincode pricing
 * for a specific product
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;

  try {
    const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = req.scope.resolve("remoteQuery");

    // Get the product with its variants and prices
    const products = await remoteQuery({
      entryPoint: "product",
      fields: [
        "id",
        "title",
        "variants.*",
        "variants.price_set.*",
        "variants.price_set.prices.*",
      ],
      variables: { id: product_id },
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = products[0];

    // Get INR price from first variant
    const variant = product.variants?.[0];
    if (!variant) {
      return res.status(400).json({
        message: "Product has no variants",
      });
    }

    const inrPrice = variant.price_set?.prices?.find(
      (p: any) => p.currency_code === "inr"
    );

    if (!inrPrice) {
      return res.status(400).json({
        message: "No INR price found for product",
      });
    }

    const priceAmount = Number(inrPrice.amount);

    // Get all dealers and pincodes
    const dealers = await pricingService.listDealers({ is_active: true });

    if (dealers.length === 0) {
      return res.status(400).json({
        message: "No active dealers found. Create dealers first.",
      });
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

    if (pincodes.length === 0) {
      return res.status(400).json({
        message: "No pincode coverage found. Map pincodes to dealers first.",
      });
    }

    // Create/update pincode prices
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const pincode of pincodes) {
      const dealersForPincode = await pricingService.listPincodeDealers({
        pincode,
        is_serviceable: true,
      });

      for (const pincodeDealer of dealersForPincode) {
        try {
          // Check if price already exists
          const existing = await pricingService.listProductPincodePrices({
            product_id,
            pincode,
            dealer_id: pincodeDealer.dealer_id,
          });

          if (existing.length > 0) {
            // Update existing
            await pricingService.updateProductPincodePrices([
              {
                id: existing[0].id,
                price: priceAmount,
              },
            ]);
            updated++;
          } else {
            // Create new
            await pricingService.createProductPincodePrices({
              product_id,
              sku: variant.sku || product_id,
              pincode,
              dealer_id: pincodeDealer.dealer_id,
              price: priceAmount,
              is_active: true,
            });
            created++;
          }
        } catch (error) {
          errors.push(
            `Error syncing ${pincode} for dealer ${pincodeDealer.dealer_id}: ${error.message}`
          );
        }
      }
    }

    return res.json({
      success: true,
      product_id,
      price_amount: priceAmount,
      created,
      updated,
      errors,
      pincodes_covered: pincodes.length,
      dealers_count: dealers.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error syncing prices",
      error: error.message,
    });
  }
}
