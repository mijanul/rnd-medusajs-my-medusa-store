/**
 * Store API: Pincode Serviceability Check
 *
 * GET /store/pincode-pricing/serviceability/:pincode
 *
 * Returns:
 * - Whether pincode is serviceable
 * - Delivery days
 * - COD availability
 * - Location info (city, state)
 *
 * Use case: Quick check before showing products
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createPincodeMetadataAdapter } from "../../../../../services/pincode-metadata-adapter";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { pincode } = req.params;

  // Validate input
  if (!pincode) {
    return res.status(400).json({
      error: "MISSING_PINCODE",
      message: "Pincode is required",
    });
  }

  try {
    // Create metadata adapter
    const metadataAdapter = createPincodeMetadataAdapter(req.scope);

    // Check serviceability
    const result = await metadataAdapter.checkServiceability(pincode);

    // If not serviceable
    if (!result.isServiceable) {
      return res.status(404).json({
        pincode: result.pincode,
        is_serviceable: false,
        message:
          "We don't serve this area yet. Please try a different pincode or contact support.",
        error: "PINCODE_NOT_SERVICEABLE",
      });
    }

    // Return serviceability info
    return res.json({
      pincode: result.pincode,
      is_serviceable: true,

      delivery: {
        days: result.deliveryDays,
        cod_available: result.isCodAvailable,
      },

      location: {
        city: result.city || null,
        state: result.state || null,
      },

      // Region info (if available)
      region: result.region
        ? {
            id: result.region.id,
            name: result.region.name,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error checking pincode serviceability:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to check pincode. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
