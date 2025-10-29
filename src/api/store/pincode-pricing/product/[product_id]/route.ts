/**
 * Store API: Product Price by Pincode
 *
 * GET /store/pincode-pricing/product/:product_id
 *
 * Query params:
 * - pincode: string (required) - 6-digit pincode
 *
 * Returns:
 * - Complete price information for product in pincode
 * - Serviceability details
 * - Delivery information
 *
 * Example:
 * GET /store/pincode-pricing/product/prod_123?pincode=110001
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createUnifiedPricingService } from "../../../../../services/unified-pincode-pricing";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;
  const pincode = req.query.pincode as string;

  // Validate input
  if (!pincode) {
    return res.status(400).json({
      error: "MISSING_PINCODE",
      message: "Pincode is required",
    });
  }

  if (!product_id) {
    return res.status(400).json({
      error: "MISSING_PRODUCT_ID",
      message: "Product ID is required",
    });
  }

  try {
    // Create unified pricing service
    const pricingService = createUnifiedPricingService(req.scope);

    // Get complete price info
    const result = await pricingService.getProductPriceForPincode(
      product_id,
      pincode
    );

    // Check if available
    if (!result.isAvailable) {
      // Determine specific error
      if (!result.isServiceable) {
        return res.status(404).json({
          error: "PINCODE_NOT_SERVICEABLE",
          message:
            "We don't serve this area yet. Please try a different pincode or contact support.",
          pincode: result.pincode,
          product_id: product_id,
          is_serviceable: false,
          is_available: false,
        });
      }

      return res.status(404).json({
        error: "PRODUCT_NOT_AVAILABLE",
        message: "This product is not available in your area at the moment.",
        pincode: result.pincode,
        product_id: product_id,
        is_serviceable: true,
        is_available: false,
      });
    }

    // Return success response
    return res.json({
      product_id: product_id,
      pincode: result.pincode,

      // Price information
      price: {
        amount: result.amount,
        formatted: result.formattedPrice,
        currency: result.currencyCode.toUpperCase(),
        // For backward compatibility
        value: result.amount / 100, // In major currency units (rupees)
      },

      // Delivery information
      delivery: {
        days: result.deliveryDays,
        cod_available: result.isCodAvailable,
      },

      // Location information
      location: {
        pincode: result.pincode,
        city: result.city || null,
        state: result.state || null,
      },

      // Availability flags
      is_available: true,
      is_serviceable: true,

      // Region info (for debugging/admin)
      region: {
        id: result.regionId,
        name: result.regionName,
      },
    });
  } catch (error: any) {
    console.error("Error fetching product price by pincode:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch price information. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
