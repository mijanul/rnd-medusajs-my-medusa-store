import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /store/products/[variant_id]/pincode-price
 * Get product price for a specific pincode
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { variant_id } = req.params;
  const pincode = req.query.pincode as string;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({
      message: "Valid 6-digit pincode is required",
    });
  }

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const priceInfo = await pricingService.getProductPrice(variant_id, pincode);

    return res.json({
      variant_id,
      pincode,
      price: Number(priceInfo.price) / 100, // Convert paise to rupees
      price_formatted: `₹${(Number(priceInfo.price) / 100).toFixed(2)}`,
      currency: "INR",
      dealer: priceInfo.dealer.name,
      delivery_days: priceInfo.delivery_days,
      is_cod_available: priceInfo.is_cod_available,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}
