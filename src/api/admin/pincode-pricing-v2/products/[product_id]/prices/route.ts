/**
 * Admin API: Update Product Prices for Pincode
 *
 * POST /admin/pincode-pricing-v2/products/:product_id/prices
 *
 * NOTE: Individual price updates are best done via CSV upload.
 * This endpoint will be fully implemented in Week 3 with the admin UI.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return res.status(501).json({
    error: "NOT_IMPLEMENTED",
    message:
      "Please use CSV upload endpoint for price updates: POST /admin/pincode-pricing-v2/upload",
    details:
      "Individual price updates will be implemented in Week 3 with the admin UI",
    alternative: {
      endpoint: "/admin/pincode-pricing-v2/upload",
      method: "POST",
      description: "Upload CSV with prices for multiple products and pincodes",
      csv_format: "SKU,110001,110002\\nproduct-handle,2999,3199",
    },
  });
}
