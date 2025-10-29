/**
 * Store API: Check Product Availability in Pincode
 *
 * POST /store/pincode-pricing/availability
 *
 * Body:
 * {
 *   "product_ids": ["prod_123", "prod_456"],
 *   "pincode": "110001"
 * }
 *
 * Returns:
 * - Quick availability check (boolean) for each product
 * - No price details (faster than bulk price lookup)
 *
 * Use case: Filter product listings by pincode
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createUnifiedPricingService } from "../../../../services/unified-pincode-pricing";

interface AvailabilityRequest {
  product_ids: string[];
  pincode: string;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_ids, pincode } = req.body as AvailabilityRequest;

  // Validate input
  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({
      error: "INVALID_PRODUCT_IDS",
      message: "product_ids must be a non-empty array",
    });
  }

  if (!pincode) {
    return res.status(400).json({
      error: "MISSING_PINCODE",
      message: "pincode is required",
    });
  }

  // Limit to 100 products per request (more than bulk since this is faster)
  if (product_ids.length > 100) {
    return res.status(400).json({
      error: "TOO_MANY_PRODUCTS",
      message: "Maximum 100 products allowed per request",
      limit: 100,
      requested: product_ids.length,
    });
  }

  try {
    // Create unified pricing service
    const pricingService = createUnifiedPricingService(req.scope);

    // Check availability
    const availabilityMap = await pricingService.checkAvailability(
      product_ids,
      pincode
    );

    // Transform map to array
    const availability = Array.from(availabilityMap.entries()).map(
      ([productId, isAvailable]) => ({
        product_id: productId,
        is_available: isAvailable,
      })
    );

    // Count available products
    const availableCount = availability.filter((a) => a.is_available).length;

    return res.json({
      pincode: pincode,
      summary: {
        products_checked: product_ids.length,
        products_available: availableCount,
        products_unavailable: product_ids.length - availableCount,
      },
      availability: availability,
    });
  } catch (error: any) {
    console.error("Error checking product availability:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to check availability. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
