import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * PUT /admin/pincode-pricing/prices/:id
 * Update a pincode price
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const body = req.body as any;
  const { price, is_active } = body;

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const updateData: any = {};
    if (price !== undefined) updateData.price = price;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await pricingService.updateProductPincodePrices([
      {
        id,
        ...updateData,
      },
    ]);

    return res.json({
      success: true,
      price: updated[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating price",
      error: error.message,
    });
  }
}
