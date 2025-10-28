import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Middleware to intercept product creation and ensure no variants
 * Products are created with a single default variant automatically
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // If variants array exists in request, clear it
  if (req.body && typeof req.body === "object" && "variants" in req.body) {
    delete req.body.variants;
  }

  // If options array exists, clear it (options are for variants)
  if (req.body && typeof req.body === "object" && "options" in req.body) {
    delete req.body.options;
  }

  // Continue to next handler
  return res.status(200).json({
    success: true,
  });
}
