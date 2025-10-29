/**
 * Test Day 5 Service Layer
 *
 * Purpose: Comprehensive testing of the new service layer
 * Tests: PricingAdapter, MetadataAdapter, Cache, UnifiedService
 *
 * Run: npx medusa exec ./src/scripts/test-service-layer.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createUnifiedPricingService } from "../services/unified-pincode-pricing";
import { PricingAdapterService } from "../services/pricing-adapter";
import { PincodeMetadataAdapter } from "../services/pincode-metadata-adapter";
import { getGlobalCache, CacheKeys } from "../services/simple-cache";

export default async function testServiceLayer({ container }: ExecArgs) {
  console.log("\n🧪 Testing Day 5 Service Layer\n");
  console.log("=".repeat(60));

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // Get test data first
  let testProductId: string | null = null;
  let testPincode: string | null = null;

  try {
    // Get a product with prices
    const productsResult = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: {},
    });

    if (productsResult.data && productsResult.data.length > 0) {
      testProductId = productsResult.data[0].id;
      console.log(
        `\n📦 Using test product: ${productsResult.data[0].title} (${testProductId})`
      );
    }

    // Get a serviceable pincode
    const metadataResult = await query.graph({
      entity: "pincode_metadata",
      fields: ["pincode", "city"],
      filters: { is_serviceable: true },
    });

    if (metadataResult.data && metadataResult.data.length > 0) {
      testPincode = metadataResult.data[0].pincode;
      console.log(
        `📍 Using test pincode: ${testPincode} (${metadataResult.data[0].city})`
      );
    }
  } catch (error) {
    console.error("❌ Failed to get test data:", error);
    process.exit(1);
  }

  if (!testProductId || !testPincode) {
    console.error("❌ No test data available. Run migration first.");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));

  // ======================
  // Test 1: PricingAdapter - Get Price
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: PricingAdapter - Get price for product in pincode`
  );
  try {
    const pricingAdapter = new PricingAdapterService(container);
    const price = await pricingAdapter.getPriceForProductInPincode(
      testProductId,
      testPincode
    );

    if (price && price.amount > 0) {
      console.log("   ✅ PASS");
      console.log(`   Price: ${price.amount} ${price.currency_code}`);
      console.log(`   Region: ${price.region_name}`);
      console.log(
        `   Formatted: ${pricingAdapter.formatPrice(
          price.amount,
          price.currency_code
        )}`
      );
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: No price found");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 2: PricingAdapter - Invalid Pincode
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: PricingAdapter - Handle invalid pincode`);
  try {
    const pricingAdapter = new PricingAdapterService(container);
    const price = await pricingAdapter.getPriceForProductInPincode(
      testProductId,
      "999999" // Non-existent pincode
    );

    if (price === null) {
      console.log("   ✅ PASS: Correctly returned null for invalid pincode");
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Should return null for invalid pincode");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 3: MetadataAdapter - Check Serviceability
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: MetadataAdapter - Check pincode serviceability`
  );
  try {
    const metadataAdapter = new PincodeMetadataAdapter(container);
    const result = await metadataAdapter.checkServiceability(testPincode);

    if (result.isServiceable) {
      console.log("   ✅ PASS");
      console.log(`   Pincode: ${result.pincode}`);
      console.log(`   Delivery: ${result.deliveryDays} days`);
      console.log(`   COD: ${result.isCodAvailable ? "Yes" : "No"}`);
      console.log(`   Location: ${result.city}, ${result.state}`);
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Pincode should be serviceable");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 4: MetadataAdapter - Pincode Validation
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: MetadataAdapter - Validate pincode format`
  );
  try {
    const metadataAdapter = new PincodeMetadataAdapter(container);

    const valid1 = metadataAdapter.isValidPincodeFormat("110001");
    const valid2 = metadataAdapter.isValidPincodeFormat("12345"); // Too short
    const valid3 = metadataAdapter.isValidPincodeFormat("ABCDEF"); // Not numeric
    const valid4 = metadataAdapter.isValidPincodeFormat(" 110001 "); // With whitespace

    const normalized = metadataAdapter.normalizePincode(" 110001 ");

    if (valid1 && !valid2 && !valid3 && valid4 && normalized === "110001") {
      console.log("   ✅ PASS");
      console.log("   110001: ✓ Valid");
      console.log("   12345: ✗ Invalid (too short)");
      console.log("   ABCDEF: ✗ Invalid (not numeric)");
      console.log("   ' 110001 ': ✓ Valid (normalized to '110001')");
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Validation logic incorrect");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 5: Cache - Basic Operations
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: Cache - Basic set/get operations`);
  try {
    const cache = getGlobalCache();
    cache.clear(); // Start fresh

    // Set a value
    cache.set("test-key", { value: 123 });

    // Get it back
    const retrieved = cache.get<{ value: number }>("test-key");

    // Check non-existent key
    const missing = cache.get("non-existent");

    if (retrieved && retrieved.value === 123 && missing === null) {
      console.log("   ✅ PASS");
      console.log("   Set/Get: ✓");
      console.log("   Missing key: ✓");
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Cache operations failed");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 6: Cache - TTL and Expiration
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: Cache - TTL and expiration (takes 2 seconds)`
  );
  try {
    const cache = getGlobalCache();
    cache.clear();

    // Set a value with 1 second TTL
    cache.set("ttl-test", { value: 456 }, 1); // 1 second TTL

    // Should exist immediately
    const immediate = cache.get<{ value: number }>("ttl-test");

    // Wait 1.5 seconds for expiration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Should be expired now
    const expired = cache.get("ttl-test");

    if (immediate && immediate.value === 456 && expired === null) {
      console.log("   ✅ PASS");
      console.log("   Immediate retrieval: ✓");
      console.log("   After expiration: ✓ (correctly returned null)");
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: TTL not working correctly");
      console.log(`   Immediate: ${immediate?.value}, Expired: ${expired}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 7: UnifiedService - Complete Flow
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: UnifiedService - Complete price lookup with caching`
  );
  try {
    const unifiedService = createUnifiedPricingService(container);
    unifiedService.clearCache(); // Start fresh

    // First call - should hit database
    const startTime1 = Date.now();
    const result1 = await unifiedService.getProductPriceForPincode(
      testProductId,
      testPincode
    );
    const time1 = Date.now() - startTime1;

    // Second call - should hit cache
    const startTime2 = Date.now();
    const result2 = await unifiedService.getProductPriceForPincode(
      testProductId,
      testPincode
    );
    const time2 = Date.now() - startTime2;

    const cacheStats = await unifiedService.getStatistics();

    if (
      result1.isAvailable &&
      result2.isAvailable &&
      result1.amount === result2.amount &&
      time2 < time1 && // Cached should be faster
      cacheStats.cache.hits > 0
    ) {
      console.log("   ✅ PASS");
      console.log(`   Product: Available`);
      console.log(`   Price: ${result1.formattedPrice}`);
      console.log(`   Delivery: ${result1.deliveryDays} days`);
      console.log(`   Location: ${result1.city}, ${result1.state}`);
      console.log(`   First query: ${time1}ms (database)`);
      console.log(
        `   Second query: ${time2}ms (cache) - ${Math.round(
          (1 - time2 / time1) * 100
        )}% faster`
      );
      console.log(`   Cache hits: ${cacheStats.cache.hits}`);
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Unified service not working correctly");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 8: UnifiedService - Bulk Operations
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: UnifiedService - Bulk price lookup`);
  try {
    const unifiedService = createUnifiedPricingService(container);

    // Get all products
    const productsResult = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: {},
    });

    const productIds = productsResult.data.map((p: any) => p.id);

    const bulkResult = await unifiedService.getBulkPricesForPincode(
      productIds,
      testPincode
    );

    if (
      bulkResult.prices.size > 0 ||
      bulkResult.unavailableProducts.length > 0
    ) {
      console.log("   ✅ PASS");
      console.log(`   Products queried: ${productIds.length}`);
      console.log(`   Available: ${bulkResult.prices.size}`);
      console.log(`   Unavailable: ${bulkResult.unavailableProducts.length}`);
      console.log(
        `   Unserviceable pincode: ${
          bulkResult.unserviceablePincode ? "Yes" : "No"
        }`
      );

      // Show prices
      let count = 0;
      for (const [productId, price] of bulkResult.prices) {
        if (count < 3) {
          // Show first 3
          console.log(`   - ${price.formattedPrice}`);
          count++;
        }
      }

      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Bulk lookup failed");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 9: Statistics and Monitoring
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: Statistics and monitoring`);
  try {
    const unifiedService = createUnifiedPricingService(container);
    const stats = await unifiedService.getStatistics();

    if (stats.pincode.total > 0 && stats.cache.size >= 0) {
      console.log("   ✅ PASS");
      console.log("   Pincode Statistics:");
      console.log(`   - Total pincodes: ${stats.pincode.total}`);
      console.log(`   - Serviceable: ${stats.pincode.serviceable}`);
      console.log(`   - COD available: ${stats.pincode.codAvailable}`);
      console.log(
        `   - Avg delivery: ${stats.pincode.averageDeliveryDays} days`
      );
      console.log("   Cache Statistics:");
      console.log(`   - Hits: ${stats.cache.hits}`);
      console.log(`   - Misses: ${stats.cache.misses}`);
      console.log(`   - Hit rate: ${stats.cache.hitRate}%`);
      console.log(`   - Size: ${stats.cache.size} entries`);
      testsPassed++;
    } else {
      console.log("   ❌ FAIL: Statistics not available");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 10: Available Regions for Product
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: Get all available regions for product`);
  try {
    const unifiedService = createUnifiedPricingService(container);
    const regions = await unifiedService.getAvailablePincodesForProduct(
      testProductId
    );

    if (regions.length > 0) {
      console.log("   ✅ PASS");
      console.log(`   Product available in ${regions.length} pincodes`);

      // Show first 5
      regions.slice(0, 5).forEach((r) => {
        console.log(
          `   - ${r.pincode}: ${r.formattedPrice} (${r.city || "Unknown"})`
        );
      });

      if (regions.length > 5) {
        console.log(`   ... and ${regions.length - 5} more`);
      }

      testsPassed++;
    } else {
      console.log("   ❌ FAIL: No regions found");
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Summary
  // ======================
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Summary\n");
  console.log(`Total tests: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Success rate: ${Math.round((testsPassed / testsRun) * 100)}%`);

  if (testsFailed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Service layer is ready to use.");
    console.log("\n✅ Day 5 Complete: Service Layer Foundation");
    console.log("   - PricingAdapter: Working ✓");
    console.log("   - MetadataAdapter: Working ✓");
    console.log("   - Cache: Working ✓");
    console.log("   - UnifiedService: Working ✓");
    console.log("\n➡️  Next: Day 6 - Store API routes");
  } else {
    console.log("\n⚠️  Some tests failed. Please review and fix issues.");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}
