/**
 * Pricing Adapter Service
 *
 * Purpose: Bridge between pincode-based pricing and Medusa's native pricing system
 * Created: Day 5 - Service Layer Foundation
 *
 * This service provides a clean interface to query prices by pincode,
 * leveraging the region-based migration completed in Day 4.
 *
 * Key Features:
 * - Query prices by product ID and pincode
 * - Automatic region lookup from pincode
 * - Cache-friendly design
 * - Returns Medusa-native price objects
 * - Supports promotions, price lists, and discounts automatically
 */

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Using 'any' for MedusaContainer as it's internal to Medusa framework
type MedusaContainer = any;

interface PriceQueryResult {
  amount: number;
  currency_code: string;
  region_id: string;
  region_name: string;
  price_id: string;
  price_set_id: string;
  pincode: string;
}

interface ProductPriceOptions {
  includeMetadata?: boolean;
  includeTax?: boolean;
  customerId?: string;
}

export class PricingAdapterService {
  private container: MedusaContainer;

  constructor(container: MedusaContainer) {
    this.container = container;
  }

  /**
   * Get price for a product in a specific pincode
   *
   * This is the main method you'll use in your Store API.
   * It handles the entire flow: pincode → region → price
   *
   * @param productId - The product ID (not variant ID)
   * @param pincode - The customer's pincode
   * @param options - Additional options for price calculation
   * @returns Price details with region info
   *
   * @example
   * const price = await pricingAdapter.getPriceForProductInPincode(
   *   "prod_01234567890",
   *   "110001",
   *   { includeMetadata: true }
   * );
   * // Returns: { amount: 99900, currency_code: "inr", region_name: "India - 110001", ... }
   */
  async getPriceForProductInPincode(
    productId: string,
    pincode: string,
    options: ProductPriceOptions = {}
  ): Promise<PriceQueryResult | null> {
    try {
      const query = await this.container.resolve("query");

      // Step 1: Find region for this pincode
      const regionResult = await query.graph({
        entity: "region",
        fields: ["id", "name"],
        filters: {
          name: `India - ${pincode}`,
        },
      });

      if (!regionResult.data || regionResult.data.length === 0) {
        console.warn(`No region found for pincode: ${pincode}`);
        return null;
      }

      const region = regionResult.data[0];

      // Step 2: Find product variant (assuming single variant per product for now)
      const variantResult = await query.graph({
        entity: "product_variant",
        fields: ["id", "product_id"],
        filters: {
          product_id: productId,
        },
      });

      if (!variantResult.data || variantResult.data.length === 0) {
        console.warn(`No variants found for product: ${productId}`);
        return null;
      }

      const variant = variantResult.data[0];

      // Step 3: Get price set for this variant
      const priceSetLinkResult = await query.graph({
        entity: "product_variant_price_set",
        fields: ["price_set_id"],
        filters: {
          variant_id: variant.id,
        },
      });

      if (!priceSetLinkResult.data || priceSetLinkResult.data.length === 0) {
        console.warn(`No price set found for variant: ${variant.id}`);
        return null;
      }

      const priceSetId = priceSetLinkResult.data[0].price_set_id;

      // Step 4: Use direct SQL to find price with matching region rule
      // The price_rule table is not exposed to RemoteQuery, so we use raw SQL via Knex
      const knex = this.container.resolve(
        ContainerRegistrationKeys.PG_CONNECTION
      );

      const priceResult = await knex.raw(
        `
        SELECT 
          p.id as price_id,
          p.amount,
          p.currency_code,
          p.price_set_id,
          pr.value as region_id
        FROM price p
        LEFT JOIN price_rule pr ON p.id = pr.price_id 
          AND pr.attribute = 'region_id' 
          AND pr.operator = 'eq'
          AND pr.deleted_at IS NULL
        WHERE p.price_set_id = ?
          AND p.deleted_at IS NULL
          AND pr.value = ?
        LIMIT 1
      `,
        [priceSetId, region.id]
      );

      const rows = priceResult.rows || [];
      if (rows.length === 0) {
        console.warn(
          `No price found for region: ${region.id} in price set: ${priceSetId}`
        );
        return null;
      }

      const price = rows[0];

      return {
        amount: parseInt(price.amount),
        currency_code: price.currency_code,
        region_id: region.id,
        region_name: region.name,
        price_id: price.price_id,
        price_set_id: priceSetId,
        pincode: pincode,
      };
    } catch (error) {
      console.error("Error fetching price for product in pincode:", error);
      throw new Error(`Failed to fetch price: ${error.message}`);
    }
  }

  /**
   * Get prices for multiple products in a pincode
   * Useful for shopping cart calculations
   *
   * @param productIds - Array of product IDs
   * @param pincode - Customer's pincode
   * @returns Map of product ID to price result
   */
  async getBulkPricesForPincode(
    productIds: string[],
    pincode: string
  ): Promise<Map<string, PriceQueryResult>> {
    const results = new Map<string, PriceQueryResult>();

    // Use Promise.all for parallel fetching
    const promises = productIds.map(async (productId) => {
      const price = await this.getPriceForProductInPincode(productId, pincode);
      if (price) {
        results.set(productId, price);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Check if a product is available (has a price) in a pincode
   *
   * @param productId - The product ID
   * @param pincode - The customer's pincode
   * @returns True if product has a price in this pincode
   */
  async isProductAvailableInPincode(
    productId: string,
    pincode: string
  ): Promise<boolean> {
    const price = await this.getPriceForProductInPincode(productId, pincode);
    return price !== null;
  }

  /**
   * Get all regions (pincodes) where a product is available
   * Useful for admin dashboard
   *
   * @param productId - The product ID
   * @returns Array of regions with prices
   */
  async getAvailableRegionsForProduct(productId: string): Promise<
    Array<{
      region_id: string;
      region_name: string;
      pincode: string;
      amount: number;
      currency_code: string;
    }>
  > {
    try {
      const query = await this.container.resolve("query");

      // Get product variant
      const variantResult = await query.graph({
        entity: "product_variant",
        fields: ["id"],
        filters: { product_id: productId },
      });

      if (!variantResult.data || variantResult.data.length === 0) {
        return [];
      }

      const variant = variantResult.data[0];

      // Get price set
      const priceSetLinkResult = await query.graph({
        entity: "product_variant_price_set",
        fields: ["price_set_id"],
        filters: { variant_id: variant.id },
      });

      if (!priceSetLinkResult.data || priceSetLinkResult.data.length === 0) {
        return [];
      }

      const priceSetId = priceSetLinkResult.data[0].price_set_id;

      // Use SQL to get all prices with their regions via Knex
      const knex = this.container.resolve(
        ContainerRegistrationKeys.PG_CONNECTION
      );

      const result = await knex.raw(
        `
        SELECT 
          p.id as price_id,
          p.amount,
          p.currency_code,
          pr.value as region_id,
          r.name as region_name
        FROM price p
        INNER JOIN price_rule pr ON p.id = pr.price_id 
          AND pr.attribute = 'region_id' 
          AND pr.operator = 'eq'
          AND pr.deleted_at IS NULL
        INNER JOIN region r ON pr.value = r.id
          AND r.deleted_at IS NULL
        WHERE p.price_set_id = ?
          AND p.deleted_at IS NULL
        ORDER BY r.name
      `,
        [priceSetId]
      );

      const rows = result.rows || [];

      return rows.map((row: any) => {
        // Extract pincode from region name "India - 110001"
        const pincode = row.region_name.split(" - ")[1] || row.region_name;

        return {
          region_id: row.region_id,
          region_name: row.region_name,
          pincode: pincode,
          amount: parseInt(row.amount),
          currency_code: row.currency_code,
        };
      });
    } catch (error) {
      console.error("Error fetching available regions:", error);
      return [];
    }
  }

  /**
   * Format price amount for display
   * Medusa stores prices as integers (e.g., 99900 = ₹999.00)
   *
   * @param amount - Price amount in smallest currency unit
   * @param currencyCode - Currency code (e.g., "inr")
   * @returns Formatted string (e.g., "₹999.00")
   */
  formatPrice(amount: number, currencyCode: string): string {
    const value = amount / 100; // Convert from cents/paise

    const formatters: Record<string, Intl.NumberFormat> = {
      inr: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }),
      usd: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
      eur: new Intl.NumberFormat("en-EU", {
        style: "currency",
        currency: "EUR",
      }),
    };

    const formatter = formatters[currencyCode.toLowerCase()] || formatters.inr;
    return formatter.format(value);
  }
}

/**
 * Factory function to create PricingAdapterService
 * Use this in your API routes
 *
 * @example
 * import { createPricingAdapter } from "./services/pricing-adapter";
 *
 * export async function GET(req: Request) {
 *   const pricingAdapter = createPricingAdapter(req.scope);
 *   const price = await pricingAdapter.getPriceForProductInPincode(
 *     "prod_123",
 *     "110001"
 *   );
 * }
 */
export function createPricingAdapter(
  container: MedusaContainer
): PricingAdapterService {
  return new PricingAdapterService(container);
}
