import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * GET /admin/pincode-pricing/template
 * Download CSV template for pricing upload
 * New format: Each pincode is a column, prices are filled in cells
 * NOTE: Works with products directly (no variants)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { Modules } = await import("@medusajs/framework/utils");
    const productService = req.scope.resolve(Modules.PRODUCT);
    const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

    if (!pricingService) {
      return res.status(500).json({
        message: "Pincode pricing service not found. Did you run migrations?",
      });
    }

    // Get product_id from query if specified, otherwise get all products
    const productId = req.query.product_id as string;

    // Get products (no variants needed)
    const filter: any = {};
    if (productId) {
      filter.id = productId;
    }

    const products = await productService.listProducts(filter, {
      select: ["id", "handle", "title"],
      take: 1000, // Limit to prevent huge CSVs
    });

    // Define pincodes as columns
    // You can get these from existing pincode-dealer mappings or use predefined list
    const pincodeDealers = await pricingService.listPincodeDealers({
      is_serviceable: true,
    });

    // Extract unique pincodes
    const uniquePincodes = [
      ...new Set(pincodeDealers.map((pd: any) => pd.pincode)),
    ].sort();

    // If no pincodes exist, use sample pincodes
    const pincodes =
      uniquePincodes.length > 0
        ? uniquePincodes
        : ["110001", "400001", "560001", "600001", "700001"]; // Sample major city pincodes

    // Build CSV template with pincodes as columns
    const headers = [
      "sku",
      "product_id",
      "product_title",
      ...pincodes, // Each pincode becomes a column
    ];

    // Generate rows - one row per product
    const rows: string[][] = [];

    for (const product of products) {
      const row = [
        product.handle || product.id, // Use handle as SKU
        product.id,
        product.title || "",
        ...pincodes.map(() => ""), // Empty price cells for each pincode
      ];
      rows.push(row);
    }

    // Convert to CSV
    const csvContent = [
      headers.join("\t"), // Use tab separator for better Excel compatibility
      ...rows.map((row) => row.join("\t")),
    ].join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pincode-pricing-template-${Date.now()}.csv"`
    );

    return res.send(csvContent);
  } catch (error) {
    console.error("Error generating template:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to generate template",
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}
