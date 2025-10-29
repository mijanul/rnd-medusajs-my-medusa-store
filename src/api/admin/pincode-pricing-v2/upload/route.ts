/**
 * Admin API: CSV Upload for Pincode Pricing
 *
 * POST /admin/pincode-pricing-v2/upload
 *
 * Body:
 * {
 *   file: "base64_encoded_csv_or_excel",
 *   filename: "prices.csv"
 * }
 *
 * CSV Format:
 * SKU,Pincode1,Pincode2,Pincode3,...
 * Product1SKU,2999,3199,2899,...
 * Product2SKU,1999,2099,1899,...
 *
 * This endpoint:
 * 1. Parses CSV/Excel files
 * 2. Creates regions for new pincodes
 * 3. Updates prices using Medusa native pricing
 * 4. Maintains backward compatibility
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import * as XLSX from "xlsx";

interface UploadResult {
  success: boolean;
  message: string;
  statistics: {
    total_rows: number;
    products_processed: number;
    pincodes_found: number;
    prices_updated: number;
    regions_created: number;
    errors: number;
  };
  errors: Array<{
    row?: number;
    sku?: string;
    pincode?: string;
    message: string;
  }>;
  details?: any;
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<MedusaResponse> {
  const { file, filename } = req.body as {
    file?: string;
    filename?: string;
  };

  if (!file) {
    return res.status(400).json({
      success: false,
      error: "MISSING_FILE",
      message: "File data is required (base64 encoded)",
    });
  }

  try {
    // Get required services
    const productModuleService = req.scope.resolve(Modules.PRODUCT);
    const regionModuleService = req.scope.resolve(Modules.REGION);
    const pricingModuleService = req.scope.resolve(Modules.PRICING);

    // Decode base64 file
    const fileBuffer = Buffer.from(file, "base64");

    // Detect file type and parse
    let rows: string[][];

    if (filename && (filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    } else {
      // Parse CSV file
      const csvContent = fileBuffer.toString("utf-8");
      rows = parseCSV(csvContent);
    }

    if (rows.length < 2) {
      return res.status(400).json({
        success: false,
        error: "INVALID_FILE",
        message: "File must contain at least a header row and one data row",
      });
    }

    // Process the file
    const result = await processUpload(
      rows,
      productModuleService,
      regionModuleService,
      pricingModuleService
    );

    return res.status(result.success ? 200 : 207).json(result);
  } catch (error: any) {
    console.error("Error processing CSV upload:", error);

    return res.status(500).json({
      success: false,
      error: "PROCESSING_ERROR",
      message: "Failed to process uploaded file",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Parse CSV content into rows
 * Handles both tab-separated and comma-separated values
 * Handles quoted values
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const rows: string[][] = [];

  for (const line of lines) {
    // Detect separator (tab or comma)
    const separator = line.includes("\t") ? "\t" : ",";

    // Parse line with quote handling
    const cells: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        // End of cell
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    // Add last cell
    cells.push(currentCell.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Process the uploaded data
 */
async function processUpload(
  rows: string[][],
  productModuleService: any,
  regionModuleService: any,
  pricingModuleService: any
): Promise<UploadResult> {
  const result: UploadResult = {
    success: false,
    message: "",
    statistics: {
      total_rows: rows.length - 1, // Exclude header
      products_processed: 0,
      pincodes_found: 0,
      prices_updated: 0,
      regions_created: 0,
      errors: 0,
    },
    errors: [],
  };

  // Parse header row (first row contains pincodes)
  const headerRow = rows[0];
  const pincodes = headerRow.slice(1).filter((p) => p && /^\d{6}$/.test(p));

  result.statistics.pincodes_found = pincodes.length;

  if (pincodes.length === 0) {
    result.errors.push({
      row: 1,
      message: "No valid pincodes found in header row (must be 6 digits)",
    });
    return result;
  }

  // Process each product row
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const sku = row[0]?.trim();

    if (!sku) {
      result.errors.push({
        row: rowIndex + 1,
        message: "Missing SKU in first column",
      });
      result.statistics.errors++;
      continue;
    }

    try {
      // Find product by handle (SKU)
      const products = await productModuleService.listProducts(
        { handle: sku },
        { relations: ["variants"], take: 1 }
      );

      if (!products || products.length === 0) {
        result.errors.push({
          row: rowIndex + 1,
          sku: sku,
          message: `Product not found with handle: ${sku}`,
        });
        result.statistics.errors++;
        continue;
      }

      const product = products[0];
      // Use Medusa v2: get variant using listProductVariants (for compatibility)
      const variants = await productModuleService.listProductVariants(
        { product_id: product.id },
        { take: 1 }
      );
      if (!variants || variants.length === 0) {
        result.errors.push({
          row: rowIndex + 1,
          sku: sku,
          message: "Product has no variants",
        });
        result.statistics.errors++;
        continue;
      }
      const variant = variants[0];

      // Process each pincode price
      for (let i = 0; i < pincodes.length; i++) {
        const pincode = pincodes[i];
        const priceValue = row[i + 1]?.trim();

        if (!priceValue || priceValue === "0" || priceValue === "") {
          continue; // Skip empty prices
        }

        // Parse price (convert to cents)
        const priceAmount = Math.round(parseFloat(priceValue) * 100);

        if (isNaN(priceAmount) || priceAmount < 0) {
          result.errors.push({
            row: rowIndex + 1,
            sku: sku,
            pincode: pincode,
            message: `Invalid price: ${priceValue}`,
          });
          result.statistics.errors++;
          continue;
        }

        try {
          // Get or create region for pincode
          const regionName = `pincode-${pincode}`;
          let region = await regionModuleService.listRegions(
            { name: regionName },
            { take: 1 }
          );

          if (!region || region.length === 0) {
            // Create new region
            region = [
              await regionModuleService.createRegions({
                name: regionName,
                currency_code: "inr",
                metadata: {
                  pincode: pincode,
                  delivery_days: 3,
                },
              }),
            ];
            result.statistics.regions_created++;
          }

          const regionId = region[0].id;

          // Get price set for variant
          let priceSetId = variant.price_set_id;
          if (!priceSetId) {
            // Create price set for variant
            const priceSet = await pricingModuleService.createPriceSets({
              prices: [],
            });
            await productModuleService.updateVariants(variant.id, {
              price_set_id: priceSet.id,
            });
            priceSetId = priceSet.id;
          }

          // Check if price already exists for this variant + region
          const existingPrices = await pricingModuleService.listPrices({
            price_set_id: priceSetId,
          });
          const existingRegionPrice = existingPrices.find(
            (p: any) => p.region_id === regionId
          );

          if (existingRegionPrice) {
            // Update existing price
            await pricingModuleService.updatePrices({
              id: existingRegionPrice.id,
              amount: priceAmount,
            });
          } else {
            // Add new price to price set
            await pricingModuleService.addPrices({
              priceSetId,
              prices: [
                {
                  amount: priceAmount,
                  currency_code: "inr",
                  region_id: regionId,
                  rules: { pincode },
                },
              ],
            });
          }

          result.statistics.prices_updated++;
        } catch (error: any) {
          result.errors.push({
            row: rowIndex + 1,
            sku: sku,
            pincode: pincode,
            message: error.message,
          });
          result.statistics.errors++;
        }
      }

      result.statistics.products_processed++;
    } catch (error: any) {
      result.errors.push({
        row: rowIndex + 1,
        sku: sku,
        message: error.message,
      });
      result.statistics.errors++;
    }
  }

  // Determine overall success
  result.success = result.statistics.prices_updated > 0;
  result.message = result.success
    ? `Successfully updated ${result.statistics.prices_updated} prices for ${result.statistics.products_processed} products across ${result.statistics.pincodes_found} pincodes`
    : "Failed to update any prices. Check errors for details.";

  return result;
}
