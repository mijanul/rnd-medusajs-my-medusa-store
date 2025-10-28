import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * DELETE /admin/pincode-pricing/product/:product_id
 * Delete all pricing data for a specific product
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const result = await pricingService.deleteProductPricing(product_id);

    return res.json({
      message: `Successfully deleted ${result.deleted} pricing entries`,
      product_id,
      deleted_count: result.deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete pricing data",
      error: error.message,
    });
  }
}
