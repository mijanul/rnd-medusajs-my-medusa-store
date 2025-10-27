import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /store/pincode-check
 * Check if pincode is serviceable and get delivery info
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pincode = req.query.code as string;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({
      message: "Valid 6-digit pincode is required",
    });
  }

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const isServiceable = await pricingService.isPincodeServiceable(pincode);

    if (!isServiceable) {
      return res.json({
        pincode,
        is_serviceable: false,
        message: "Sorry, we don't deliver to this pincode yet",
      });
    }

    // Get dealer information for this pincode
    const dealers = await pricingService.getDealersForPincode(pincode);

    // Get the best (primary) dealer
    const primaryDealer = dealers[0];

    return res.json({
      pincode,
      is_serviceable: true,
      delivery_days: primaryDealer.delivery_days,
      is_cod_available: primaryDealer.is_cod_available,
      dealer_name: primaryDealer.dealer.name,
      alternative_dealers: dealers.length - 1, // Number of other dealers available
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
      is_serviceable: false,
    });
  }
}
