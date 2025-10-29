/**
 * Test Store API Routes
 *
 * Purpose: Test all new Store API endpoints for pincode pricing
 *
 * Run: npx medusa exec ./src/scripts/test-store-api-routes.ts
 *
 * Note: This tests the route logic without actually starting the HTTP server.
 * For full HTTP testing, use curl or Postman after starting the server.
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function testStoreAPIRoutes({ container }: ExecArgs) {
  console.log("\n🧪 Testing Store API Routes (Day 6)\n");
  console.log("=".repeat(60));

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // Get test data
  let testProductId: string | null = null;
  let testPincode: string | null = null;
  let allProductIds: string[] = [];

  try {
    const productsResult = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: {},
    });

    if (productsResult.data && productsResult.data.length > 0) {
      testProductId = productsResult.data[0].id;
      allProductIds = productsResult.data.map((p: any) => p.id);
      console.log(
        `\n📦 Using test product: ${productsResult.data[0].title} (${testProductId})`
      );
      console.log(`📦 Total products: ${allProductIds.length}`);
    }

    const metadataResult = await query.graph({
      entity: "pincode_metadata",
      fields: ["pincode", "city"],
      filters: { is_serviceable: true },
    });

    if (metadataResult.data && metadataResult.data.length > 0) {
      testPincode = metadataResult.data[0].pincode;
      console.log(
        `📍 Using test pincode: ${testPincode} (${
          metadataResult.data[0].city || "Unknown"
        })`
      );
    }
  } catch (error) {
    console.error("❌ Failed to get test data:", error);
    process.exit(1);
  }

  if (!testProductId || !testPincode) {
    console.error("❌ No test data available.");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));

  // Import route handlers
  const productPriceRoute = require("../api/store/pincode-pricing/product/[product_id]/route");
  const bulkPriceRoute = require("../api/store/pincode-pricing/bulk/route");
  const serviceabilityRoute = require("../api/store/pincode-pricing/serviceability/[pincode]/route");
  const searchRoute = require("../api/store/pincode-pricing/search/route");
  const availabilityRoute = require("../api/store/pincode-pricing/availability/route");

  // Helper to create mock request/response
  function createMockReqRes(params: any = {}, query: any = {}, body: any = {}) {
    const req = {
      params,
      query,
      body,
      scope: container,
    };

    let responseData: any = null;
    let statusCode = 200;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return { statusCode, data: responseData };
      },
    };

    return {
      req,
      res,
      getResponse: () => ({ statusCode, data: responseData }),
    };
  }

  // ======================
  // Test 1: Product Price API - Success
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/product/:product_id?pincode=X`
  );
  try {
    const { req, res, getResponse } = createMockReqRes(
      { product_id: testProductId },
      { pincode: testPincode }
    );

    await productPriceRoute.GET(req, res);
    const response = getResponse();

    if (response.statusCode === 200 && response.data.is_available) {
      console.log("   ✅ PASS");
      console.log(`   Price: ${response.data.price.formatted}`);
      console.log(`   Delivery: ${response.data.delivery.days} days`);
      console.log(
        `   COD: ${response.data.delivery.cod_available ? "Yes" : "No"}`
      );
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 200 and available, got ${response.statusCode}`
      );
      console.log(`   Response:`, response.data);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 2: Product Price API - Invalid Pincode
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/product/:product_id?pincode=999999`
  );
  try {
    const { req, res, getResponse } = createMockReqRes(
      { product_id: testProductId },
      { pincode: "999999" }
    );

    await productPriceRoute.GET(req, res);
    const response = getResponse();

    if (
      response.statusCode === 404 &&
      response.data.error === "PINCODE_NOT_SERVICEABLE"
    ) {
      console.log("   ✅ PASS: Correctly returned 404 for invalid pincode");
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 404 PINCODE_NOT_SERVICEABLE, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 3: Product Price API - Missing Pincode
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/product/:product_id (no pincode)`
  );
  try {
    const { req, res, getResponse } = createMockReqRes(
      { product_id: testProductId },
      {} // No pincode
    );

    await productPriceRoute.GET(req, res);
    const response = getResponse();

    if (
      response.statusCode === 400 &&
      response.data.error === "MISSING_PINCODE"
    ) {
      console.log("   ✅ PASS: Correctly returned 400 for missing pincode");
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 400 MISSING_PINCODE, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 4: Bulk Price API - Success
  // ======================
  testsRun++;
  console.log(`\n📋 Test ${testsRun}: POST /store/pincode-pricing/bulk`);
  try {
    const { req, res, getResponse } = createMockReqRes(
      {},
      {},
      { product_ids: allProductIds, pincode: testPincode }
    );

    await bulkPriceRoute.POST(req, res);
    const response = getResponse();

    if (response.statusCode === 200 && response.data.summary) {
      console.log("   ✅ PASS");
      console.log(
        `   Products requested: ${response.data.summary.products_requested}`
      );
      console.log(
        `   Products available: ${response.data.summary.products_available}`
      );
      console.log(
        `   Products unavailable: ${response.data.summary.products_unavailable}`
      );
      console.log(`   Total: ${response.data.summary.total_formatted}`);
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 200 with summary, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 5: Bulk Price API - Empty Array
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: POST /store/pincode-pricing/bulk (empty array)`
  );
  try {
    const { req, res, getResponse } = createMockReqRes(
      {},
      {},
      { product_ids: [], pincode: testPincode }
    );

    await bulkPriceRoute.POST(req, res);
    const response = getResponse();

    if (
      response.statusCode === 400 &&
      response.data.error === "INVALID_PRODUCT_IDS"
    ) {
      console.log("   ✅ PASS: Correctly rejected empty array");
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 400 INVALID_PRODUCT_IDS, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 6: Serviceability API - Success
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/serviceability/:pincode`
  );
  try {
    const { req, res, getResponse } = createMockReqRes({
      pincode: testPincode,
    });

    await serviceabilityRoute.GET(req, res);
    const response = getResponse();

    if (response.statusCode === 200 && response.data.is_serviceable) {
      console.log("   ✅ PASS");
      console.log(`   Pincode: ${response.data.pincode}`);
      console.log(`   Serviceable: Yes`);
      console.log(`   Delivery: ${response.data.delivery.days} days`);
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 200 and serviceable, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 7: Serviceability API - Invalid Pincode
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/serviceability/999999`
  );
  try {
    const { req, res, getResponse } = createMockReqRes({ pincode: "999999" });

    await serviceabilityRoute.GET(req, res);
    const response = getResponse();

    if (response.statusCode === 404 && response.data.is_serviceable === false) {
      console.log("   ✅ PASS: Correctly returned 404 for invalid pincode");
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 404 not serviceable, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 8: Search API - Success
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/search?q=Delhi`
  );
  try {
    const { req, res, getResponse } = createMockReqRes({}, { q: "Delhi" });

    await searchRoute.GET(req, res);
    const response = getResponse();

    if (response.statusCode === 200) {
      console.log("   ✅ PASS");
      console.log(`   Query: ${response.data.query}`);
      console.log(`   Results: ${response.data.results_count}`);
      if (response.data.results_count > 0) {
        console.log(
          `   Sample: ${response.data.results[0].pincode} (${response.data.results[0].location.city})`
        );
      }
      testsPassed++;
    } else {
      console.log(`   ❌ FAIL: Expected 200, got ${response.statusCode}`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 9: Search API - Short Query
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: GET /store/pincode-pricing/search?q=A (too short)`
  );
  try {
    const { req, res, getResponse } = createMockReqRes({}, { q: "A" });

    await searchRoute.GET(req, res);
    const response = getResponse();

    if (
      response.statusCode === 400 &&
      response.data.error === "INVALID_SEARCH_QUERY"
    ) {
      console.log("   ✅ PASS: Correctly rejected short query");
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 400 INVALID_SEARCH_QUERY, got ${response.statusCode}`
      );
      testsFailed++;
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // ======================
  // Test 10: Availability API - Success
  // ======================
  testsRun++;
  console.log(
    `\n📋 Test ${testsRun}: POST /store/pincode-pricing/availability`
  );
  try {
    const { req, res, getResponse } = createMockReqRes(
      {},
      {},
      { product_ids: allProductIds, pincode: testPincode }
    );

    await availabilityRoute.POST(req, res);
    const response = getResponse();

    if (response.statusCode === 200 && response.data.summary) {
      console.log("   ✅ PASS");
      console.log(
        `   Products checked: ${response.data.summary.products_checked}`
      );
      console.log(`   Available: ${response.data.summary.products_available}`);
      console.log(
        `   Unavailable: ${response.data.summary.products_unavailable}`
      );
      testsPassed++;
    } else {
      console.log(
        `   ❌ FAIL: Expected 200 with summary, got ${response.statusCode}`
      );
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
    console.log(
      "\n🎉 ALL TESTS PASSED! Store API routes are working correctly."
    );
    console.log("\n✅ Day 6 Complete: Store API Routes Ready");
    console.log("\n📝 API Endpoints Created:");
    console.log("   1. GET  /store/pincode-pricing/product/:id?pincode=X");
    console.log("   2. POST /store/pincode-pricing/bulk");
    console.log("   3. GET  /store/pincode-pricing/serviceability/:pincode");
    console.log("   4. GET  /store/pincode-pricing/search?q=city");
    console.log("   5. POST /store/pincode-pricing/availability");
    console.log(
      "\n➡️  Next: Test with real HTTP requests or proceed to Admin API"
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please review and fix issues.");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}
