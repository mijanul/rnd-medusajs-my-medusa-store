/**
 * Admin API: Delete Product Price for Pincode
 *
 * DELETE /admin/pincode-pricing-v2/products/:product_id/pincodes/:pincode
 *
 * NOTE: This endpoint will be fully implemented in Week 3 with the admin UI.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  return res.status(501).json({
    error: "NOT_IMPLEMENTED",
    message: "Price deletion will be implemented in Week 3 with the admin UI",
    details: "Use CSV upload to update prices (omit pincode to remove)",
  });
}
