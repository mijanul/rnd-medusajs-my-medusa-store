/**
 * Unified Pincode Pricing Service
 *
 * Purpose: Single entry point for all pincode-based pricing operations
 * Created: Day 5 - Service Layer Foundation
 *
 * This service combines the PricingAdapter, MetadataAdapter, and Cache
 * to provide a complete, optimized solution for pincode-based pricing.
 *
 * Key Features:
 * - Single API for all pricing operations
 * - Automatic caching of frequently accessed data
 * - Integrated serviceability checks
 * - Formatted price display
 * - Bulk operations support
 * - Complete type safety
 *
 * Usage:
 * This is the main service you'll use in your Store API routes.
 * It replaces the old PincodePricingService methods with new
 * Medusa-native pricing queries.
 */

import { PricingAdapterService } from "./pricing-adapter";
import { PincodeMetadataAdapter } from "./pincode-metadata-adapter";
import { getGlobalCache, CacheKeys, SimpleCacheService } from "./simple-cache";

type MedusaContainer = any;

interface ProductPriceResponse {
  // Price information
  amount: number;
  formattedPrice: string;
  currencyCode: string;

  // Region information
  regionId: string;
  regionName: string;
  pincode: string;

  // Delivery information
  deliveryDays: number;
  isCodAvailable: boolean;

  // Location information
  city?: string;
  state?: string;

  // Availability
  isAvailable: boolean;
  isServiceable: boolean;
}

interface BulkPriceResponse {
  prices: Map<string, ProductPriceResponse>;
  unavailableProducts: string[];
  unserviceablePincode: boolean;
}

export class UnifiedPincodePricingService {
  private pricingAdapter: PricingAdapterService;
  private metadataAdapter: PincodeMetadataAdapter;
  private cache: SimpleCacheService;

  constructor(container: MedusaContainer) {
    this.pricingAdapter = new PricingAdapterService(container);
    this.metadataAdapter = new PincodeMetadataAdapter(container);
    this.cache = getGlobalCache(1000, 300); // 1000 entries, 5 min TTL
  }

  /**
   * Get complete price and serviceability info for a product in a pincode
   *
   * This is the PRIMARY method you'll use in your Store API.
   * It combines pricing, serviceability, and delivery info in one call.
   *
   * @param productId - The product ID
   * @param pincode - Customer's pincode
   * @param useCache - Whether to use cache (default: true)
   * @returns Complete product price response
   *
   * @example
   * const service = new UnifiedPincodePricingService(req.scope);
   * const result = await service.getProductPriceForPincode("prod_123", "110001");
   *
   * if (!result.isAvailable) {
   *   return Response.json({ error: "Not available" }, { status: 404 });
   * }
   *
   * return Response.json({
   *   price: result.formattedPrice,
   *   delivery: `${result.deliveryDays} days`,
   *   cod: result.isCodAvailable
   * });
   */
  async getProductPriceForPincode(
    productId: string,
    pincode: string,
    useCache: boolean = true
  ): Promise<ProductPriceResponse> {
    // Normalize pincode
    const normalizedPincode = this.metadataAdapter.normalizePincode(pincode);
    if (!normalizedPincode) {
      return this.createUnavailableResponse(pincode, "Invalid pincode format");
    }

    // Check cache first
    if (useCache) {
      const cacheKey = CacheKeys.productPrice(productId, normalizedPincode);
      const cached = this.cache.get<ProductPriceResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Step 1: Check serviceability
    const serviceability = await this.metadataAdapter.checkServiceability(
      normalizedPincode
    );

    if (!serviceability.isServiceable) {
      const response = this.createUnavailableResponse(
        normalizedPincode,
        "Pincode not serviceable",
        serviceability
      );

      // Cache negative results too (to avoid repeated DB queries)
      if (useCache) {
        const cacheKey = CacheKeys.productPrice(productId, normalizedPincode);
        this.cache.set(cacheKey, response, 60); // Cache for 1 minute
      }

      return response;
    }

    // Step 2: Get price
    const price = await this.pricingAdapter.getPriceForProductInPincode(
      productId,
      normalizedPincode
    );

    if (!price) {
      const response = this.createUnavailableResponse(
        normalizedPincode,
        "Product not available in this pincode",
        serviceability
      );

      if (useCache) {
        const cacheKey = CacheKeys.productPrice(productId, normalizedPincode);
        this.cache.set(cacheKey, response, 60);
      }

      return response;
    }

    // Step 3: Combine all data
    const response: ProductPriceResponse = {
      // Price info
      amount: price.amount,
      formattedPrice: this.pricingAdapter.formatPrice(
        price.amount,
        price.currency_code
      ),
      currencyCode: price.currency_code,

      // Region info
      regionId: price.region_id,
      regionName: price.region_name,
      pincode: normalizedPincode,

      // Delivery info
      deliveryDays: serviceability.deliveryDays || 3,
      isCodAvailable: serviceability.isCodAvailable || false,

      // Location info
      city: serviceability.city,
      state: serviceability.state,

      // Availability
      isAvailable: true,
      isServiceable: true,
    };

    // Cache the result
    if (useCache) {
      const cacheKey = CacheKeys.productPrice(productId, normalizedPincode);
      this.cache.set(cacheKey, response);
    }

    return response;
  }

  /**
   * Get prices for multiple products in a pincode
   * Useful for shopping cart price calculations
   *
   * @param productIds - Array of product IDs
   * @param pincode - Customer's pincode
   * @returns Bulk price response with all available prices
   *
   * @example
   * const result = await service.getBulkPricesForPincode(
   *   ["prod_123", "prod_456", "prod_789"],
   *   "110001"
   * );
   *
   * const totalAmount = Array.from(result.prices.values())
   *   .reduce((sum, p) => sum + p.amount, 0);
   */
  async getBulkPricesForPincode(
    productIds: string[],
    pincode: string
  ): Promise<BulkPriceResponse> {
    const normalizedPincode = this.metadataAdapter.normalizePincode(pincode);

    if (!normalizedPincode) {
      return {
        prices: new Map(),
        unavailableProducts: productIds,
        unserviceablePincode: true,
      };
    }

    // Check serviceability once for all products
    const serviceability = await this.metadataAdapter.checkServiceability(
      normalizedPincode
    );

    if (!serviceability.isServiceable) {
      return {
        prices: new Map(),
        unavailableProducts: productIds,
        unserviceablePincode: true,
      };
    }

    // Fetch prices in parallel
    const pricePromises = productIds.map(async (productId) => {
      const result = await this.getProductPriceForPincode(
        productId,
        normalizedPincode
      );
      return { productId, result };
    });

    const results = await Promise.all(pricePromises);

    // Separate available and unavailable
    const prices = new Map<string, ProductPriceResponse>();
    const unavailable: string[] = [];

    for (const { productId, result } of results) {
      if (result.isAvailable) {
        prices.set(productId, result);
      } else {
        unavailable.push(productId);
      }
    }

    return {
      prices,
      unavailableProducts: unavailable,
      unserviceablePincode: false,
    };
  }

  /**
   * Check if products are available in a pincode (without fetching full price info)
   * Faster than getProductPriceForPincode when you only need availability
   *
   * @param productIds - Array of product IDs
   * @param pincode - Customer's pincode
   * @returns Map of product ID to availability
   */
  async checkAvailability(
    productIds: string[],
    pincode: string
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const normalizedPincode = this.metadataAdapter.normalizePincode(pincode);
    if (!normalizedPincode) {
      productIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Quick serviceability check
    const serviceability = await this.metadataAdapter.checkServiceability(
      normalizedPincode
    );
    if (!serviceability.isServiceable) {
      productIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Check each product
    const promises = productIds.map(async (productId) => {
      const available = await this.pricingAdapter.isProductAvailableInPincode(
        productId,
        normalizedPincode
      );
      return { productId, available };
    });

    const availabilityResults = await Promise.all(promises);

    for (const { productId, available } of availabilityResults) {
      results.set(productId, available);
    }

    return results;
  }

  /**
   * Get all pincodes where a product is available
   * Useful for admin dashboard - "Where is this product available?"
   *
   * @param productId - The product ID
   * @returns Array of pincodes with pricing
   */
  async getAvailablePincodesForProduct(productId: string): Promise<
    Array<{
      pincode: string;
      amount: number;
      formattedPrice: string;
      city?: string;
      state?: string;
      deliveryDays: number;
    }>
  > {
    // Get all regions where product has a price
    const regions = await this.pricingAdapter.getAvailableRegionsForProduct(
      productId
    );

    if (regions.length === 0) {
      return [];
    }

    // Get metadata for all pincodes
    const pincodes = regions.map((r) => r.pincode);
    const metadataMap = await this.metadataAdapter.getBulkMetadata(pincodes);

    // Combine data
    const results = regions.map((region) => {
      const metadata = metadataMap.get(region.pincode);

      return {
        pincode: region.pincode,
        amount: region.amount,
        formattedPrice: this.pricingAdapter.formatPrice(
          region.amount,
          region.currency_code
        ),
        city: metadata?.city || undefined,
        state: metadata?.state || undefined,
        deliveryDays: metadata?.delivery_days || 3,
      };
    });

    // Sort by pincode
    results.sort((a, b) => a.pincode.localeCompare(b.pincode));

    return results;
  }

  /**
   * Search for serviceable pincodes
   * Useful for customer service - "What pincodes do you serve?"
   *
   * @param searchTerm - City or state name
   * @returns Array of serviceable pincodes
   */
  async searchServiceablePincodes(searchTerm: string): Promise<
    Array<{
      pincode: string;
      city: string;
      state: string;
      deliveryDays: number;
      isCodAvailable: boolean;
    }>
  > {
    const results = await this.metadataAdapter.searchPincodes(searchTerm);

    return results
      .filter((r) => r.is_serviceable)
      .map((r) => ({
        pincode: r.pincode,
        city: r.city || "Unknown",
        state: r.state || "Unknown",
        deliveryDays: r.delivery_days,
        isCodAvailable: r.is_cod_available,
      }));
  }

  /**
   * Get dashboard statistics
   * Useful for admin overview
   *
   * @returns Combined statistics
   */
  async getStatistics(): Promise<{
    pincode: {
      total: number;
      serviceable: number;
      codAvailable: number;
      averageDeliveryDays: number;
    };
    cache: {
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    };
  }> {
    const pincodeStats = await this.metadataAdapter.getStatistics();
    const cacheStats = this.cache.getStats();

    return {
      pincode: {
        total: pincodeStats.totalPincodes,
        serviceable: pincodeStats.serviceablePincodes,
        codAvailable: pincodeStats.codAvailablePincodes,
        averageDeliveryDays: pincodeStats.averageDeliveryDays,
      },
      cache: cacheStats,
    };
  }

  /**
   * Clear cache (useful for testing or after data updates)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Helper: Create unavailable response
   */
  private createUnavailableResponse(
    pincode: string,
    reason: string,
    serviceability?: any
  ): ProductPriceResponse {
    return {
      amount: 0,
      formattedPrice: "N/A",
      currencyCode: "inr",
      regionId: "",
      regionName: "",
      pincode: pincode,
      deliveryDays: 0,
      isCodAvailable: false,
      city: serviceability?.city,
      state: serviceability?.state,
      isAvailable: false,
      isServiceable: serviceability?.isServiceable || false,
    };
  }
}

/**
 * Factory function to create UnifiedPincodePricingService
 * Use this in your API routes
 *
 * @example
 * // In Store API route: /store/pincode-pricing/[productId]
 * import { createUnifiedPricingService } from "@/services/unified-pincode-pricing";
 *
 * export async function GET(req: Request, { params }: { params: { productId: string } }) {
 *   const { searchParams } = new URL(req.url);
 *   const pincode = searchParams.get("pincode");
 *
 *   if (!pincode) {
 *     return Response.json({ error: "Pincode required" }, { status: 400 });
 *   }
 *
 *   const pricingService = createUnifiedPricingService(req.scope);
 *   const result = await pricingService.getProductPriceForPincode(
 *     params.productId,
 *     pincode
 *   );
 *
 *   if (!result.isAvailable) {
 *     return Response.json({
 *       error: "Product not available in your area",
 *       pincode: result.pincode,
 *       isServiceable: result.isServiceable
 *     }, { status: 404 });
 *   }
 *
 *   return Response.json({
 *     price: result.formattedPrice,
 *     amount: result.amount,
 *     delivery_days: result.deliveryDays,
 *     cod_available: result.isCodAvailable,
 *     location: {
 *       pincode: result.pincode,
 *       city: result.city,
 *       state: result.state
 *     }
 *   });
 * }
 */
export function createUnifiedPricingService(
  container: MedusaContainer
): UnifiedPincodePricingService {
  return new UnifiedPincodePricingService(container);
}
