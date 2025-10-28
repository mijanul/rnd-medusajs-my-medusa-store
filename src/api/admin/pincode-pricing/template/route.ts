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

    // Fetch existing prices for all products
    const existingPrices = await pricingService.listProductPincodePrices({
      is_active: true,
    });

    // Create a map for quick price lookup: productId -> pincode -> price
    const priceMap = new Map<string, Map<string, number>>();
    for (const priceEntry of existingPrices) {
      if (!priceMap.has(priceEntry.product_id)) {
        priceMap.set(priceEntry.product_id, new Map());
      }
      priceMap
        .get(priceEntry.product_id)!
        .set(priceEntry.pincode, Number(priceEntry.price));
    }

    // Generate rows - one row per product
    const rows: string[][] = [];

    for (const product of products) {
      const productPrices = priceMap.get(product.id);
      const row = [
        product.handle || product.id, // Use handle as SKU
        product.id,
        product.title || "",
        ...pincodes.map((pincode) => {
          // If price exists for this product-pincode combination, show it
          const price = productPrices?.get(pincode);
          return price ? String(price) : "";
        }),
      ];
      rows.push(row);
    }

    // Check if user wants Excel format
    const format = (req.query.format as string) || "csv";

    if (format === "xlsx" || format === "excel") {
      // Generate Excel file
      const XLSX = await import("xlsx");

      // Create worksheet with headers and data
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 15 }, // sku
        { wch: 25 }, // product_id
        { wch: 30 }, // product_title
        ...pincodes.map(() => ({ wch: 12 })), // pincode columns
      ];
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pincode Pricing");

      // Generate buffer
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      // Set headers for Excel download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="pincode-pricing-template-${Date.now()}.xlsx"`
      );

      return res.send(excelBuffer);
    } else {
      // Generate CSV with proper comma separation and quotes for Excel
      const escapeCsvValue = (value: string) => {
        // If value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (
          value.includes(",") ||
          value.includes("\n") ||
          value.includes('"')
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => row.map(escapeCsvValue).join(",")),
      ].join("\r\n"); // Use Windows line endings for better Excel compatibility

      // Set headers for CSV download with UTF-8 BOM for Excel
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="pincode-pricing-template-${Date.now()}.csv"`
      );

      // Add UTF-8 BOM for Excel to recognize encoding properly
      const BOM = "\uFEFF";
      return res.send(BOM + csvContent);
    }
  } catch (error) {
    console.error("Error generating template:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to generate template",
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}
