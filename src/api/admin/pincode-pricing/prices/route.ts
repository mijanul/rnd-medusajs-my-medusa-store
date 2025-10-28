import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /admin/pincode-pricing/prices
 * Get pincode prices with optional filters
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, pincode } = req.query;

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const filters: any = {};
    if (product_id) filters.product_id = product_id;
    if (pincode) filters.pincode = pincode;

    const prices = await pricingService.listProductPincodePrices(filters);

    return res.json({
      prices,
      count: prices.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching pincode prices",
      error: error.message,
    });
  }
}

/**
 * POST /admin/pincode-pricing/prices
 * Create new pincode prices for a product
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, prices } = req.body as {
    product_id: string;
    prices: Array<{ pincode: string; price: number }>;
  };

  if (!product_id) {
    return res.status(400).json({
      message: "product_id is required",
    });
  }

  if (!prices || !Array.isArray(prices) || prices.length === 0) {
    return res.status(400).json({
      message: "prices array is required and must not be empty",
    });
  }

  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    // Get product details using query
    const query = req.scope.resolve("query");
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "title"],
      filters: { id: product_id },
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = products[0];
    const sku = product.handle || product_id;

    // Create price entries
    const createdPrices: any[] = [];
    const errors: Array<{ pincode: string; error: string }> = [];

    for (const priceData of prices) {
      const { pincode, price } = priceData;

      if (!pincode || !price) {
        errors.push({ pincode, error: "Pincode and price are required" });
        continue;
      }

      // Validate pincode format
      if (!/^\d{6}$/.test(pincode)) {
        errors.push({ pincode, error: "Pincode must be 6 digits" });
        continue;
      }

      // Check if pincode already exists for this product
      const existing = await pricingService.listProductPincodePrices({
        product_id,
        pincode,
      });

      if (existing.length > 0) {
        errors.push({
          pincode,
          error: "Pincode already exists for this product",
        });
        continue;
      }

      try {
        const created = await pricingService.createProductPincodePrices({
          product_id,
          sku,
          pincode,
          price,
          is_active: true,
        });
        createdPrices.push(created);
      } catch (error: any) {
        errors.push({ pincode, error: error.message });
      }
    }

    return res.json({
      success: true,
      created: createdPrices.length,
      prices: createdPrices,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error creating pincode prices",
      error: error.message,
    });
  }
}
