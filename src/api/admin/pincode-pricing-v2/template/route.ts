/**
 * Admin API: Download CSV Template for Pincode Pricing
 *
 * GET /admin/pincode-pricing-v2/template
 *
 * Query params:
 * - pincodes: comma-separated list of pincodes (optional)
 *
 * Returns a CSV template that admins can fill out and upload
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { pincodes: pincodesParam } = req.query as {
    pincodes?: string;
  };

  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT);

    // Parse pincodes from query
    let pincodes: string[] = [];

    if (pincodesParam) {
      pincodes = pincodesParam
        .split(",")
        .map((p) => p.trim())
        .filter((p) => /^\d{6}$/.test(p));
    }

    // If no pincodes specified, use default sample pincodes
    if (pincodes.length === 0) {
      pincodes = ["110001", "110002", "110003", "400001", "400002", "560001"];
    }

    // Get all products
    const products = await productModuleService.listProducts(
      {},
      {
        relations: ["variants"],
        take: 100, // Limit to 100 products
      }
    );

    // Build CSV content
    const csvLines: string[] = [];

    // Header row
    csvLines.push(`SKU,${pincodes.join(",")}`);

    // Data rows - empty template
    for (const product of products) {
      const sku = product.handle || product.id;
      const prices: string[] = [sku];

      // Empty cells for each pincode
      for (let i = 0; i < pincodes.length; i++) {
        prices.push("");
      }

      csvLines.push(prices.join(","));
    }

    const csvContent = csvLines.join("\n");

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pincode-pricing-template.csv"`
    );

    return res.send(csvContent);
  } catch (error: any) {
    console.error("Error generating CSV template:", error);

    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to generate CSV template",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
