import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * POST /admin/pincode-pricing/upload
 * Upload CSV or Excel file with pricing data
 * New format: Each pincode is a column, prices are in cells
 * NOTE: Works with products directly (no variants)
 * Supports: .csv, .xlsx, .xls files
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);

  try {
    const body = req.body as { csv_data?: string; file_type?: string };
    const fileData = body.csv_data;
    const fileType = body.file_type || "csv"; // csv, xlsx, xls

    if (!fileData) {
      return res.status(400).json({
        message: "File data is required",
      });
    }

    let rows: string[][];
    let headers: string[];

    // Handle Excel files
    if (fileType === "xlsx" || fileType === "xls") {
      const XLSX = await import("xlsx");

      // Convert base64 to buffer if needed
      const buffer = Buffer.from(fileData, "base64");

      // Read workbook
      const workbook = XLSX.read(buffer, { type: "buffer" });

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to array of arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      }) as string[][];

      if (jsonData.length < 2) {
        return res.status(400).json({
          message:
            "Excel file must contain at least a header row and one data row",
        });
      }

      rows = jsonData.filter((row) => row.some((cell) => cell !== ""));
      headers = rows[0].map((h) => String(h).trim());
    } else {
      // Handle CSV files
      // Parse CSV - handle both comma and tab separated values
      const lines = fileData.split(/\r?\n/).filter((row) => row.trim());
      if (lines.length < 2) {
        return res.status(400).json({
          message: "CSV must contain at least a header row and one data row",
        });
      }

      // Detect separator (tab or comma)
      const separator = lines[0].includes("\t") ? "\t" : ",";

      // Parse CSV with proper quote handling
      const parseCSVLine = (line: string, sep: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === sep && !inQuotes) {
            // Field separator outside quotes
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      rows = lines.map((line) => parseCSVLine(line, separator));
      headers = rows[0].map((h) => h.trim());
    }

    // First 3 columns should be: sku, product_id, product_title
    // Remaining columns are pincodes
    if (headers.length < 4) {
      return res.status(400).json({
        message:
          "CSV must have at least 4 columns: sku, product_id, product_title, and at least one pincode column",
      });
    }

    const pincodeColumns = headers.slice(3); // All columns after the first 3 are pincodes

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
      product_id: string;
      pincode: string;
      price: number;
    }> = [];

    let skippedRows = 0;
    let processedRows = 0;

    // Process each data row (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];

      // Skip empty rows
      if (!values || values.every((v) => !v)) continue;

      const sku = String(values[0] || "").trim();
      const product_id = String(values[1] || "").trim();
      // values[2] = product_title (not needed for import)

      if (!sku || !product_id) {
        skippedRows++;
        continue;
      }

      // Process each pincode column (starting from index 3)
      for (let j = 0; j < pincodeColumns.length; j++) {
        const pincode = pincodeColumns[j].trim();
        const priceValue = String(values[3 + j] || "").trim();

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
          product_id,
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
