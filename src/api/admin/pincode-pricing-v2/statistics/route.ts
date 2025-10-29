/**
 * GET /admin/pincode-pricing-v2/statistics
 *
 * Returns comprehensive statistics for the pincode pricing dashboard:
 * - Overview statistics (total products, pincodes, prices)
 * - Geographic coverage (states, cities, top states)
 * - Price analytics (min, max, avg)
 * - System health indicators
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { createUnifiedPricingService } from "../../../../services/unified-pincode-pricing";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const pricingService = createUnifiedPricingService(req.scope);
    const regionModuleService = req.scope.resolve(Modules.REGION);
    const productModuleService = req.scope.resolve(Modules.PRODUCT);

    // Get all regions (pincodes)
    const regions = await regionModuleService.listRegions(
      {
        name: { $ilike: "%-IN" },
      },
      {
        select: ["id", "name", "metadata"],
      }
    );

    // Get all products
    const allProducts = await productModuleService.listProducts(
      {},
      {
        select: ["id", "handle"],
      }
    );

    // Get products with pricing by checking each product
    const productsWithPricing: Set<string> = new Set();
    const allPrices: number[] = [];

    // Collect pricing data for all products
    for (const product of allProducts) {
      try {
        const productPincodes =
          await pricingService.getAvailablePincodesForProduct(product.id);
        if (productPincodes.length > 0) {
          productsWithPricing.add(product.id);
          // Collect all price amounts
          productPincodes.forEach((p) => {
            if (p.amount > 0) {
              allPrices.push(p.amount);
            }
          });
        }
      } catch (err) {
        // Skip products with errors
        continue;
      }
    }

    // Calculate statistics
    const totalProducts = productsWithPricing.size;
    const totalPincodes = regions.length;
    const totalPrices = allPrices.length;

    // Extract unique states and cities from regions
    const stateSet = new Set<string>();
    const citySet = new Set<string>();
    const stateCountMap = new Map<string, number>();

    regions.forEach((region: any) => {
      const metadata = region.metadata || {};
      const state = metadata.state;
      const city = metadata.city;

      if (state) {
        stateSet.add(state);
        stateCountMap.set(state, (stateCountMap.get(state) || 0) + 1);
      }
      if (city) {
        citySet.add(city);
      }
    });

    // Get top states sorted by count
    const topStates = Array.from(stateCountMap.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate price analytics
    let minPrice = 0;
    let maxPrice = 0;
    let avgPrice = 0;

    if (allPrices.length > 0) {
      minPrice = Math.min(...allPrices);
      maxPrice = Math.max(...allPrices);
      avgPrice = Math.round(
        allPrices.reduce((sum, val) => sum + val, 0) / allPrices.length
      );
    }

    // Format currency (assuming INR)
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount / 100);
    };

    // Get last updated timestamp (use current time for now)
    const lastUpdated = new Date().toISOString();

    // Calculate health metrics
    const productsWithoutPricing = allProducts.length - totalProducts;

    // Products with incomplete coverage (less than 50% of total pincodes)
    let incompleteCoverage = 0;
    const halfPincodes = Math.floor(totalPincodes * 0.5);

    for (const product of allProducts) {
      try {
        const productPincodes =
          await pricingService.getAvailablePincodesForProduct(product.id);
        if (
          productPincodes.length > 0 &&
          productPincodes.length < halfPincodes
        ) {
          incompleteCoverage++;
        }
      } catch (err) {
        continue;
      }
    }

    // Build response
    const statistics = {
      overview: {
        total_products: totalProducts,
        total_pincodes: totalPincodes,
        total_prices: totalPrices,
        last_updated: lastUpdated,
      },
      coverage: {
        states: stateSet.size,
        cities: citySet.size,
        top_states: topStates,
      },
      price_analytics: {
        min_price: minPrice,
        max_price: maxPrice,
        avg_price: avgPrice,
        min_formatted: formatCurrency(minPrice),
        max_formatted: formatCurrency(maxPrice),
        avg_formatted: formatCurrency(avgPrice),
      },
      health: {
        products_without_pricing: productsWithoutPricing,
        incomplete_coverage: incompleteCoverage,
      },
    };

    res.status(200).json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: (error as Error).message,
    });
  }
}
