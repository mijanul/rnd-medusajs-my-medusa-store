/**
 * Admin API: Get Product Pricing Overview
 *
 * GET /admin/pincode-pricing/products/:product_id
 *
 * Returns:
 * - All pincodes where product is available
 * - Prices for each pincode
 * - Statistics
 *
 * Use case: Admin dashboard - "Where is this product available?"
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createUnifiedPricingService } from "../../../../../services/unified-pincode-pricing";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).json({
      error: "MISSING_PRODUCT_ID",
      message: "Product ID is required",
    });
  }

  try {
    // Create unified pricing service
    const pricingService = createUnifiedPricingService(req.scope);

    // Get all available pincodes for this product
    const pincodes = await pricingService.getAvailablePincodesForProduct(
      product_id
    );

    // Calculate statistics
    const totalPincodes = pincodes.length;
    const amounts = pincodes.map((p) => p.amount);
    const minPrice = amounts.length > 0 ? Math.min(...amounts) : 0;
    const maxPrice = amounts.length > 0 ? Math.max(...amounts) : 0;
    const avgPrice =
      amounts.length > 0
        ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length
        : 0;

    // Group by state/city
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};

    pincodes.forEach((p) => {
      if (p.state) {
        byState[p.state] = (byState[p.state] || 0) + 1;
      }
      if (p.city) {
        byCity[p.city] = (byCity[p.city] || 0) + 1;
      }
    });

    return res.json({
      product_id: product_id,

      // Statistics
      statistics: {
        total_pincodes: totalPincodes,
        price_range: {
          min: minPrice,
          max: maxPrice,
          avg: Math.round(avgPrice),
          min_formatted: `₹${(minPrice / 100).toFixed(2)}`,
          max_formatted: `₹${(maxPrice / 100).toFixed(2)}`,
          avg_formatted: `₹${(avgPrice / 100).toFixed(2)}`,
        },
        coverage: {
          states: Object.keys(byState).length,
          cities: Object.keys(byCity).length,
        },
      },

      // All pincodes with prices
      pincodes: pincodes.map((p) => ({
        pincode: p.pincode,
        price: {
          amount: p.amount,
          formatted: p.formattedPrice,
        },
        location: {
          city: p.city || null,
          state: p.state || null,
        },
        delivery_days: p.deliveryDays,
      })),

      // Groupings
      by_state: byState,
      by_city: byCity,
    });
  } catch (error: any) {
    console.error("Error fetching product pricing overview:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch product pricing",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
