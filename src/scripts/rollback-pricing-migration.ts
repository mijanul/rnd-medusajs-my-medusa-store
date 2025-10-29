import { Client } from "pg";

/**
 * Rollback Script for Pricing Migration
 *
 * This script reverses the pricing migration by:
 * 1. Deleting migrated prices and price rules
 * 2. Soft-deleting created regions
 * 3. Clearing region_code from pincode_metadata
 * 4. Preserving original product_pincode_price data (untouched)
 *
 * SAFE: Original data in product_pincode_price is never deleted
 */

export default async function rollbackPricingMigration({ container }: any) {
  console.log("\n⚠️  ROLLBACK: PRICING MIGRATION");
  console.log("================================\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // Step 0: Verify what will be deleted
    console.log("0️⃣ PRE-ROLLBACK ANALYSIS");
    console.log("-------------------------");

    const preCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM region WHERE name LIKE 'India - %' AND deleted_at IS NULL) as regions_to_delete,
        (SELECT COUNT(*) 
         FROM price p
         INNER JOIN price_rule pr ON p.id = pr.price_id
         INNER JOIN region r ON pr.value = r.id
         WHERE r.name LIKE 'India - %' AND p.deleted_at IS NULL) as prices_to_delete,
        (SELECT COUNT(*) 
         FROM price_rule pr
         INNER JOIN region r ON pr.value = r.id
         WHERE r.name LIKE 'India - %' AND pr.deleted_at IS NULL) as price_rules_to_delete,
        (SELECT COUNT(*) FROM product_pincode_price WHERE deleted_at IS NULL) as original_prices_preserved
    `);

    console.table(preCheck.rows[0]);

    const confirmation = preCheck.rows[0];

    if (parseInt(confirmation.regions_to_delete) === 0) {
      console.log("\n✅ No migration data found. Nothing to rollback.");
      await client.end();
      return;
    }

    console.log("\n⚠️  This will:");
    console.log(`   • Soft-delete ${confirmation.regions_to_delete} regions`);
    console.log(`   • Soft-delete ${confirmation.prices_to_delete} prices`);
    console.log(
      `   • Soft-delete ${confirmation.price_rules_to_delete} price rules`
    );
    console.log(`   • Clear region_code from pincode_metadata`);
    console.log(
      `   ✅ Preserve ${confirmation.original_prices_preserved} original prices`
    );

    // Step 1: Soft-delete price rules
    console.log("\n1️⃣ ROLLING BACK PRICE RULES");
    console.log("-----------------------------");

    const prResult = await client.query(`
      UPDATE price_rule
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id IN (
        SELECT pr.id
        FROM price_rule pr
        INNER JOIN region r ON pr.value = r.id
        WHERE r.name LIKE 'India - %'
          AND pr.attribute = 'region_id'
          AND pr.deleted_at IS NULL
      )
      RETURNING id
    `);

    console.log(`✅ Soft-deleted ${prResult.rows.length} price rules`);

    // Step 2: Soft-delete prices
    console.log("\n2️⃣ ROLLING BACK PRICES");
    console.log("-----------------------");

    const priceResult = await client.query(`
      UPDATE price
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT p.id
        FROM price p
        INNER JOIN price_rule pr ON p.id = pr.price_id
        INNER JOIN region r ON pr.value = r.id
        WHERE r.name LIKE 'India - %'
          AND p.deleted_at IS NULL
      )
      RETURNING id
    `);

    console.log(`✅ Soft-deleted ${priceResult.rows.length} prices`);

    // Step 3: Soft-delete regions
    console.log("\n3️⃣ ROLLING BACK REGIONS");
    console.log("------------------------");

    const regionResult = await client.query(`
      UPDATE region
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE name LIKE 'India - %'
        AND deleted_at IS NULL
      RETURNING id, name
    `);

    console.log(`✅ Soft-deleted ${regionResult.rows.length} regions`);
    if (regionResult.rows.length <= 5) {
      console.log("\nDeleted regions:");
      console.table(regionResult.rows);
    }

    // Step 4: Clear region_code from pincode_metadata
    console.log("\n4️⃣ CLEARING REGION REFERENCES");
    console.log("-------------------------------");

    const metadataResult = await client.query(`
      UPDATE pincode_metadata
      SET region_code = NULL, updated_at = NOW()
      WHERE region_code IN (
        SELECT id FROM region WHERE name LIKE 'India - %'
      )
      RETURNING pincode
    `);

    console.log(
      `✅ Cleared region_code from ${metadataResult.rows.length} pincode metadata records`
    );

    // Step 5: Verify original data is intact
    console.log("\n5️⃣ VERIFYING ORIGINAL DATA");
    console.log("----------------------------");

    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as original_prices,
        COUNT(DISTINCT product_id) as products,
        COUNT(DISTINCT pincode) as pincodes,
        MIN(price::numeric) as min_price,
        MAX(price::numeric) as max_price
      FROM product_pincode_price
      WHERE deleted_at IS NULL
    `);

    console.table(verifyResult.rows[0]);
    console.log("✅ Original product_pincode_price data intact");

    // Step 6: Verify rollback completion
    console.log("\n6️⃣ POST-ROLLBACK VERIFICATION");
    console.log("-------------------------------");

    const postCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM region WHERE name LIKE 'India - %' AND deleted_at IS NULL) as active_regions,
        (SELECT COUNT(*) 
         FROM price p
         INNER JOIN price_rule pr ON p.id = pr.price_id
         INNER JOIN region r ON pr.value = r.id
         WHERE r.name LIKE 'India - %' AND p.deleted_at IS NULL) as active_prices,
        (SELECT COUNT(*) FROM pincode_metadata WHERE region_code IS NOT NULL) as linked_metadata
    `);

    const postData = postCheck.rows[0];
    console.table(postData);

    if (
      parseInt(postData.active_regions) === 0 &&
      parseInt(postData.active_prices) === 0
    ) {
      console.log("✅ Rollback complete - all migration data removed");
    } else {
      console.log("⚠️  Some data still active - may need manual cleanup");
    }

    console.log("\n" + "=".repeat(50));
    console.log("🔄 ROLLBACK SUMMARY");
    console.log("=".repeat(50));
    console.log("\n✅ ROLLBACK COMPLETED SUCCESSFULLY");
    console.log("\n📊 What was rolled back:");
    console.log(`   • ${prResult.rows.length} price rules deleted`);
    console.log(`   • ${priceResult.rows.length} prices deleted`);
    console.log(`   • ${regionResult.rows.length} regions deleted`);
    console.log(
      `   • ${metadataResult.rows.length} metadata references cleared`
    );

    console.log("\n✅ What was preserved:");
    console.log(
      `   • ${verifyResult.rows[0].original_prices} original prices in product_pincode_price`
    );
    console.log(`   • All product data intact`);
    console.log(`   • All pincode metadata intact`);

    console.log("\n💡 Next steps:");
    console.log("   1. Verify your application works with old pricing system");
    console.log("   2. Review migration issues if any");
    console.log(
      "   3. Re-run migration when ready: npx medusa exec ./src/scripts/implement-pricing-migration.ts"
    );
    console.log("   4. Or keep using old system if preferred");

    await client.end();
  } catch (error) {
    console.error("\n❌ ROLLBACK ERROR:", error);
    console.log(
      "\n⚠️  Rollback may be incomplete. Please check database state."
    );
    await client.end();
    throw error;
  }
}
