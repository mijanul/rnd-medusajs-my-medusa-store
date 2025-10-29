/**
 * Store API: Bulk Price Lookup
 *
 * POST /store/pincode-pricing/bulk
 *
 * Body:
 * {
 *   "product_ids": ["prod_123", "prod_456"],
 *   "pincode": "110001"
 * }
 *
 * Returns:
 * - Prices for all available products
 * - List of unavailable products
 * - Serviceability status
 *
 * Use case: Shopping cart price calculation
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createUnifiedPricingService } from "../../../../services/unified-pincode-pricing";

interface BulkPriceRequest {
  product_ids: string[];
  pincode: string;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_ids, pincode } = req.body as BulkPriceRequest;

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

  // Limit to 50 products per request to avoid overload
  if (product_ids.length > 50) {
    return res.status(400).json({
      error: "TOO_MANY_PRODUCTS",
      message: "Maximum 50 products allowed per request",
      limit: 50,
      requested: product_ids.length,
    });
  }

  try {
    // Create unified pricing service
    const pricingService = createUnifiedPricingService(req.scope);

    // Get bulk prices
    const result = await pricingService.getBulkPricesForPincode(
      product_ids,
      pincode
    );

    // Check if pincode is serviceable at all
    if (result.unserviceablePincode) {
      return res.status(404).json({
        error: "PINCODE_NOT_SERVICEABLE",
        message:
          "We don't serve this area yet. Please try a different pincode.",
        pincode: pincode,
        is_serviceable: false,
        products_requested: product_ids.length,
        products_available: 0,
      });
    }

    // Transform prices map to array
    const prices = Array.from(result.prices.entries()).map(
      ([productId, price]) => ({
        product_id: productId,
        price: {
          amount: price.amount,
          formatted: price.formattedPrice,
          currency: price.currencyCode.toUpperCase(),
          value: price.amount / 100,
        },
        delivery: {
          days: price.deliveryDays,
          cod_available: price.isCodAvailable,
        },
        is_available: true,
      })
    );

    // Calculate total
    const totalAmount = Array.from(result.prices.values()).reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return res.json({
      pincode: pincode,
      is_serviceable: true,

      // Summary
      summary: {
        products_requested: product_ids.length,
        products_available: result.prices.size,
        products_unavailable: result.unavailableProducts.length,
        total_amount: totalAmount,
        total_formatted: `₹${(totalAmount / 100).toFixed(2)}`,
      },

      // Available products with prices
      prices: prices,

      // Unavailable products
      unavailable_products: result.unavailableProducts,

      // Common delivery info (from first product)
      delivery_info:
        prices.length > 0
          ? {
              days: prices[0].delivery.days,
              cod_available: prices[0].delivery.cod_available,
            }
          : null,
    });
  } catch (error: any) {
    console.error("Error fetching bulk prices:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch prices. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
