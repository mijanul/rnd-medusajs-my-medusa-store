import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /admin/pincode-pricing/prices
 * Get pincode prices with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, pincode, dealer_id } = req.query;

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const filters: any = {};
    if (product_id) filters.product_id = product_id;
    if (pincode) filters.pincode = pincode;
    if (dealer_id) filters.dealer_id = dealer_id;

    const prices = await pricingService.listProductPincodePrices(filters, {
      relations: ["dealer"],
    });

    return res.json({
      prices,
      count: prices.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching pincode prices",
      error: error.message,
    });
  }
}
