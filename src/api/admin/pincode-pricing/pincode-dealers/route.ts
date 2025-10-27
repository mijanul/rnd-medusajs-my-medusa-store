import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * POST /admin/pincode-pricing/pincode-dealers
 * Map pincodes to dealers
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  const body = req.body as {
    pincode: string;
    dealer_id: string;
    delivery_days?: number;
    is_cod_available?: boolean;
  };

  const mapping = await pricingService.createPincodeDealers(body);

  return res.json({ mapping });
}

/**
 * GET /admin/pincode-pricing/pincode-dealers
 * List pincode-dealer mappings
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  const { pincode, dealer_id } = req.query;

  const filter: any = {};
  if (pincode) filter.pincode = pincode;
  if (dealer_id) filter.dealer_id = dealer_id;

  const mappings = await pricingService.listPincodeDealers(filter, {
    relations: ["dealer"],
  });

  return res.json({ mappings });
}
