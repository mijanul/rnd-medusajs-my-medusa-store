import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /store/products/[product_id]/pincode-price
 * Get product price for a specific pincode
 * NOTE: Works with product_id directly (no variants)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;
  const pincode = req.query.pincode as string;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({
      message: "Please enter a valid 6-digit pincode",
      error: "INVALID_PINCODE",
    });
  }

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    // First check if pincode is serviceable
    const isServiceable = await pricingService.isPincodeServiceable(pincode);

    if (!isServiceable) {
      return res.status(404).json({
        product_id,
        pincode,
        message:
          "Sorry, we don't serve your area yet. Please try a different pincode.",
        error: "PINCODE_NOT_SERVICEABLE",
      });
    }

    const priceInfo = await pricingService.getProductPrice(product_id, pincode);

    return res.json({
      product_id,
      pincode,
      price: Number(priceInfo.price) / 100, // Convert paise to rupees
      price_formatted: `₹${(Number(priceInfo.price) / 100).toFixed(2)}`,
      currency: "INR",
      dealer: priceInfo.dealer.name,
      delivery_days: priceInfo.delivery_days,
      is_cod_available: priceInfo.is_cod_available,
    });
  } catch (error) {
    // Check if error is about pincode not being serviceable
    if (error.message.includes("not serviceable")) {
      return res.status(404).json({
        product_id,
        pincode,
        message:
          "Sorry, we don't serve your area yet. Please try a different pincode.",
        error: "PINCODE_NOT_SERVICEABLE",
      });
    }

    // Error is about product not available in this pincode
    return res.status(404).json({
      product_id,
      pincode,
      message: "This product is not available in your area at the moment.",
      error: "PRODUCT_NOT_AVAILABLE_IN_PINCODE",
    });
  }
}
