import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * POST /admin/pincode-pricing/upload
 * Upload CSV file with pricing data
 * New format: Each pincode is a column, prices are in cells
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const body = req.body as { csv_data: string };
    const csvData = body.csv_data;

    if (!csvData) {
      return res.status(400).json({
        message: "CSV data is required",
      });
    }

    // Parse CSV - handle both comma and tab separated values
    const rows = csvData.split("\n").filter((row) => row.trim());
    if (rows.length < 2) {
      return res.status(400).json({
        message: "CSV must contain at least a header row and one data row",
      });
    }

    // Detect separator (tab or comma)
    const separator = rows[0].includes("\t") ? "\t" : ",";
    const headers = rows[0].split(separator).map((h) => h.trim());

    // First 4 columns should be: sku, variant_id, product_title, variant_title
    // Remaining columns are pincodes
    if (headers.length < 5) {
      return res.status(400).json({
        message:
          "CSV must have at least 5 columns: sku, variant_id, product_title, variant_title, and at least one pincode column",
      });
    }

    const pincodeColumns = headers.slice(4); // All columns after the first 4 are pincodes

    // Validate pincode format
    const invalidPincodes = pincodeColumns.filter(
      (p) => !/^\d{6}$/.test(p.trim())
    );
    if (invalidPincodes.length > 0) {
      return res.status(400).json({
        message: `Invalid pincode format in headers: ${invalidPincodes.join(
          ", "
        )}. Pincodes must be 6 digits.`,
      });
    }

    const pricesData: Array<{
      sku: string;
      variant_id: string;
      pincode: string;
      price: number;
    }> = [];

    let skippedRows = 0;
    let processedRows = 0;

    // Process each data row
    for (let i = 1; i < rows.length; i++) {
      const line = rows[i].trim();
      if (!line) continue;

      const values = line
        .split(separator)
        .map((v) => v.trim().replace(/"/g, ""));

      const sku = values[0];
      const variant_id = values[1];
      // values[2] = product_title (not needed for import)
      // values[3] = variant_title (not needed for import)

      if (!sku || !variant_id) {
        skippedRows++;
        continue;
      }

      // Process each pincode column (starting from index 4)
      for (let j = 0; j < pincodeColumns.length; j++) {
        const pincode = pincodeColumns[j].trim();
        const priceValue = values[4 + j]?.trim();

        // Skip if price is empty
        if (!priceValue || priceValue === "") {
          continue;
        }

        // Parse price
        const priceFloat = parseFloat(priceValue);
        if (isNaN(priceFloat) || priceFloat <= 0) {
          continue; // Skip invalid prices
        }

        // Convert price to paise (smallest unit)
        const priceInPaise = Math.round(priceFloat * 100);

        pricesData.push({
          sku,
          variant_id,
          pincode,
          price: priceInPaise,
        });
      }

      processedRows++;
    }

    if (pricesData.length === 0) {
      return res.status(400).json({
        message: "No valid price data found in CSV",
      });
    }

    // Bulk import
    const results = await pricingService.bulkImportPricesSimple(pricesData);

    return res.json({
      message: "Pricing data uploaded successfully",
      imported: results.success,
      failed: results.failed,
      total_rows_processed: processedRows,
      rows_skipped: skippedRows,
      errors: results.errors,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload pricing data",
      error: error.message,
    });
  }
}
