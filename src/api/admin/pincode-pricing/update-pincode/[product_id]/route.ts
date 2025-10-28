import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * PUT /admin/pincode-pricing/update-pincode/:product_id
 * Update price for all dealers serving a specific pincode for a product
 *
 * This allows bulk updating of all dealer prices for a specific pincode
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;
  const body = req.body as any;
  const { pincode, price } = body;

  if (!pincode || !price) {
    return res.status(400).json({
      message: "pincode and price are required",
      error: "MISSING_PARAMETERS",
    });
  }

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    // Get all prices for this product-pincode combination
    const existingPrices = await pricingService.listProductPincodePrices({
      product_id,
      pincode,
    });

    if (existingPrices.length === 0) {
      return res.status(404).json({
        message: `No prices found for product ${product_id} in pincode ${pincode}`,
        error: "NO_PRICES_FOUND",
      });
    }

    // Update all prices
    const updates = existingPrices.map((priceEntry: any) => ({
      id: priceEntry.id,
      price: Number(price),
    }));

    await pricingService.updateProductPincodePrices(updates);

    return res.json({
      success: true,
      message: `Updated ${updates.length} prices for pincode ${pincode}`,
      updated_count: updates.length,
      pincode,
      new_price: Number(price),
    });
  } catch (error) {
    console.error("Error updating pincode prices:", error);
    return res.status(500).json({
      message: "Error updating prices",
      error: error.message,
    });
  }
}
