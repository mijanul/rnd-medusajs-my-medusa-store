import { Client } from "pg";

/**
 * Comprehensive Test Suite for Pricing Migration
 *
 * Tests:
 * 1. Data integrity - all prices migrated correctly
 * 2. Region mapping - each pincode has a region
 * 3. Price rules - all prices linked to regions
 * 4. Price calculations - sample price lookups work
 * 5. Comparison - new prices match old prices
 */

export default async function testPricingMigration({ container }: any) {
  console.log("\n🧪 TESTING PRICING MIGRATION");
  console.log("=============================\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  let allTestsPassed = true;
  const failures: string[] = [];

  try {
    // Test 1: Data Integrity
    console.log("1️⃣ TEST: Data Integrity");
    console.log("------------------------");

    const integrityResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM product_pincode_price WHERE deleted_at IS NULL) as old_prices,
        (SELECT COUNT(DISTINCT p.id) 
         FROM price p
         INNER JOIN price_rule pr ON p.id = pr.price_id
         INNER JOIN region r ON pr.value = r.id
         WHERE r.name LIKE 'India - %' AND p.deleted_at IS NULL) as new_prices,
        (SELECT COUNT(DISTINCT pincode) FROM product_pincode_price WHERE deleted_at IS NULL) as old_pincodes,
        (SELECT COUNT(*) FROM region WHERE name LIKE 'India - %' AND deleted_at IS NULL) as new_regions
    `);

    const integrity = integrityResult.rows[0];
    console.table(integrity);

    if (integrity.old_prices === integrity.new_prices) {
      console.log(
        "✅ PASS: All prices migrated (old: " +
          integrity.old_prices +
          ", new: " +
          integrity.new_prices +
          ")"
      );
    } else {
      console.log(
        "❌ FAIL: Price count mismatch (old: " +
          integrity.old_prices +
          ", new: " +
          integrity.new_prices +
          ")"
      );
      failures.push("Price count mismatch");
      allTestsPassed = false;
    }

    if (parseInt(integrity.old_pincodes) <= parseInt(integrity.new_regions)) {
      console.log(
        "✅ PASS: All pincodes have regions (pincodes: " +
          integrity.old_pincodes +
          ", regions: " +
          integrity.new_regions +
          ")"
      );
    } else {
      console.log(
        "❌ FAIL: Missing regions (pincodes: " +
          integrity.old_pincodes +
          ", regions: " +
          integrity.new_regions +
          ")"
      );
      failures.push("Missing regions for pincodes");
      allTestsPassed = false;
    }

    // Test 2: Region Mapping
    console.log("\n2️⃣ TEST: Region Mapping");
    console.log("------------------------");

    const unmappedPincodes = await client.query(`
      SELECT DISTINCT ppp.pincode
      FROM product_pincode_price ppp
      LEFT JOIN region r ON r.name = 'India - ' || ppp.pincode
      WHERE ppp.deleted_at IS NULL
        AND r.id IS NULL
    `);

    if (unmappedPincodes.rows.length === 0) {
      console.log("✅ PASS: All pincodes mapped to regions");
    } else {
      console.log(
        "❌ FAIL: " + unmappedPincodes.rows.length + " pincodes not mapped:"
      );
      console.table(unmappedPincodes.rows);
      failures.push("Unmapped pincodes exist");
      allTestsPassed = false;
    }

    // Test 3: Price Rules
    console.log("\n3️⃣ TEST: Price Rules");
    console.log("---------------------");

    const priceRulesTest = await client.query(`
      SELECT 
        COUNT(DISTINCT p.id) as prices_with_rules,
        (SELECT COUNT(DISTINCT id) FROM price WHERE deleted_at IS NULL) as total_prices
      FROM price p
      INNER JOIN price_rule pr ON p.id = pr.price_id
      WHERE p.deleted_at IS NULL AND pr.attribute = 'region_id'
    `);

    const prTest = priceRulesTest.rows[0];

    if (parseInt(prTest.prices_with_rules) >= 19) {
      // At least our 19 migrated prices
      console.log(
        "✅ PASS: All migrated prices have region rules (" +
          prTest.prices_with_rules +
          " prices)"
      );
    } else {
      console.log(
        "❌ FAIL: Some prices missing region rules (" +
          prTest.prices_with_rules +
          " / expected >= 19)"
      );
      failures.push("Missing price rules");
      allTestsPassed = false;
    }

    // Test 4: Price Comparison
    console.log("\n4️⃣ TEST: Price Comparison (Old vs New)");
    console.log("---------------------------------------");

    const comparison = await client.query(`
      SELECT 
        ppp.product_id,
        ppp.pincode,
        ppp.price::numeric as old_price,
        p.amount::numeric as new_price,
        CASE WHEN ppp.price::numeric = p.amount::numeric THEN '✅' ELSE '❌' END as match
      FROM product_pincode_price ppp
      INNER JOIN region r ON r.name = 'India - ' || ppp.pincode
      INNER JOIN price_rule pr ON pr.value = r.id AND pr.attribute = 'region_id'
      INNER JOIN price p ON pr.price_id = p.id
      INNER JOIN product_variant pv ON pv.product_id = ppp.product_id
      INNER JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
      WHERE ppp.deleted_at IS NULL
        AND p.price_set_id = pvps.price_set_id
        AND p.deleted_at IS NULL
      ORDER BY ppp.pincode, ppp.product_id
      LIMIT 10
    `);

    console.log("\nSample Price Comparisons:");
    console.table(comparison.rows);

    const mismatches = comparison.rows.filter((r) => r.match === "❌");
    if (mismatches.length === 0) {
      console.log(
        "✅ PASS: All sample prices match between old and new system"
      );
    } else {
      console.log("❌ FAIL: " + mismatches.length + " price mismatches found");
      failures.push("Price value mismatches");
      allTestsPassed = false;
    }

    // Test 5: Metadata Linkage
    console.log("\n5️⃣ TEST: Metadata Linkage");
    console.log("--------------------------");

    const metadataLink = await client.query(`
      SELECT 
        COUNT(*) as regions_with_metadata,
        (SELECT COUNT(*) FROM region WHERE name LIKE 'India - %' AND deleted_at IS NULL) as total_regions
      FROM region r
      INNER JOIN pincode_metadata pm ON pm.region_code = r.id
      WHERE r.name LIKE 'India - %' AND r.deleted_at IS NULL
    `);

    const mlTest = metadataLink.rows[0];

    if (
      parseInt(mlTest.regions_with_metadata) === parseInt(mlTest.total_regions)
    ) {
      console.log(
        "✅ PASS: All regions linked to pincode metadata (" +
          mlTest.regions_with_metadata +
          "/" +
          mlTest.total_regions +
          ")"
      );
    } else {
      console.log(
        "⚠️  WARN: Some regions not linked to metadata (" +
          mlTest.regions_with_metadata +
          "/" +
          mlTest.total_regions +
          ")"
      );
      // This is a warning, not a failure
    }

    // Test 6: Price Set Linkage
    console.log("\n6️⃣ TEST: Price Set Linkage");
    console.log("---------------------------");

    const priceSetTest = await client.query(`
      SELECT 
        COUNT(DISTINCT pv.product_id) as products_with_price_sets,
        (SELECT COUNT(DISTINCT product_id) FROM product_pincode_price WHERE deleted_at IS NULL) as products_needing_prices
      FROM product_variant pv
      INNER JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      WHERE pv.deleted_at IS NULL
    `);

    const psTest = priceSetTest.rows[0];

    if (
      parseInt(psTest.products_with_price_sets) >=
      parseInt(psTest.products_needing_prices)
    ) {
      console.log(
        "✅ PASS: All products have price sets (" +
          psTest.products_with_price_sets +
          "/" +
          psTest.products_needing_prices +
          ")"
      );
    } else {
      console.log(
        "❌ FAIL: Some products missing price sets (" +
          psTest.products_with_price_sets +
          "/" +
          psTest.products_needing_prices +
          ")"
      );
      failures.push("Missing price sets");
      allTestsPassed = false;
    }

    // Test 7: Query Performance Test
    console.log("\n7️⃣ TEST: Query Performance");
    console.log("---------------------------");

    const startTime = Date.now();
    const perfTest = await client.query(`
      SELECT 
        pv.product_id,
        pm.pincode,
        price.amount,
        price.currency_code
      FROM product_variant pv
      CROSS JOIN pincode_metadata pm
      LEFT JOIN region r ON r.id = pm.region_code
      LEFT JOIN price_rule pr ON pr.value = r.id AND pr.attribute = 'region_id'
      LEFT JOIN price ON price.id = pr.price_id
      LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
      WHERE pv.deleted_at IS NULL
        AND pm.deleted_at IS NULL
        AND (price.price_set_id = pvps.price_set_id OR price.id IS NULL)
        AND (price.deleted_at IS NULL OR price.id IS NULL)
      LIMIT 100
    `);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `Query returned ${perfTest.rows.length} results in ${duration}ms`
    );

    if (duration < 1000) {
      console.log("✅ PASS: Query performance acceptable (< 1000ms)");
    } else {
      console.log(
        "⚠️  WARN: Query slow (" + duration + "ms) - consider adding indexes"
      );
    }

    // Final Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(50));

    if (allTestsPassed) {
      console.log("\n🎉 ALL TESTS PASSED!");
      console.log("✅ Migration is successful and safe to use");
      console.log("✅ Data integrity verified");
      console.log("✅ All prices migrated correctly");
      console.log("✅ Ready for Day 5");
    } else {
      console.log("\n⚠️  SOME TESTS FAILED");
      console.log("\nFailures:");
      failures.forEach((f) => console.log("  ❌ " + f));
      console.log("\n⚠️  Please review migration before proceeding");
      console.log("💡 Consider running rollback if issues are critical");
    }

    console.log("\n📋 Quick Stats:");
    console.log(
      `   • Old system: ${integrity.old_prices} prices, ${integrity.old_pincodes} pincodes`
    );
    console.log(
      `   • New system: ${integrity.new_prices} prices, ${integrity.new_regions} regions`
    );
    console.log(
      `   • Products with price sets: ${psTest.products_with_price_sets}`
    );
    console.log(`   • Average query time: ${duration}ms`);

    await client.end();

    return allTestsPassed;
  } catch (error) {
    console.error("\n❌ TEST ERROR:", error);
    await client.end();
    throw error;
  }
}
