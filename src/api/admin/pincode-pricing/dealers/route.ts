import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /admin/pincode-pricing/dealers
 * List all dealers
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      return res.status(500).json({
        message: "Pincode pricing service not found. Did you run migrations?",
      });
    }

    const dealers = await pricingService.listDealers(
      {},
      {
        order: { name: "ASC" },
      }
    );

    return res.json({ dealers });
  } catch (error) {
    console.error("Error fetching dealers:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch dealers",
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}

/**
 * POST /admin/pincode-pricing/dealers
 * Create a new dealer
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      return res.status(500).json({
        message: "Pincode pricing service not found. Did you run migrations?",
      });
    }

    const body = req.body as {
      code: string;
      name: string;
      city?: string;
      state?: string;
      address?: string;
      contact_name?: string;
      contact_phone?: string;
      contact_email?: string;
    };

    const dealer = await pricingService.createDealers(body);

    return res.json({ dealer });
  } catch (error) {
    console.error("Error creating dealer:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to create dealer",
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}
