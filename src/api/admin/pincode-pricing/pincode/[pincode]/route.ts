import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * DELETE /admin/pincode-pricing/pincode/:pincode
 * Delete all pricing data for a specific pincode
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { pincode } = req.params;
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    // Validate pincode format
    if (pincode.length !== 6) {
      return res.status(400).json({
        message: "Pincode must be 6 digits",
      });
    }

    const result = await pricingService.deletePincodePricing(pincode);

    return res.json({
      message: `Successfully deleted ${result.deleted} pricing entries`,
      pincode,
      deleted_count: result.deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete pricing data",
      error: error.message,
    });
  }
}
