/**
 * Store API: Search Serviceable Pincodes
 *
 * GET /store/pincode-pricing/search
 *
 * Query params:
 * - q: string (required) - City or state name to search
 *
 * Returns:
 * - List of serviceable pincodes matching the search
 * - Location and delivery info for each
 *
 * Use case: "Enter your city to check serviceability"
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createUnifiedPricingService } from "../../../../services/unified-pincode-pricing";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const searchQuery = req.query.q as string;

  // Validate input
  if (!searchQuery || searchQuery.trim().length < 2) {
    return res.status(400).json({
      error: "INVALID_SEARCH_QUERY",
      message: "Search query must be at least 2 characters",
    });
  }

  try {
    // Create unified pricing service
    const pricingService = createUnifiedPricingService(req.scope);

    // Search pincodes
    const results = await pricingService.searchServiceablePincodes(
      searchQuery.trim()
    );

    // Return results
    return res.json({
      query: searchQuery.trim(),
      results_count: results.length,
      results: results.map((r) => ({
        pincode: r.pincode,
        location: {
          city: r.city,
          state: r.state,
        },
        delivery: {
          days: r.deliveryDays,
          cod_available: r.isCodAvailable,
        },
      })),
    });
  } catch (error: any) {
    console.error("Error searching pincodes:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to search pincodes. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
