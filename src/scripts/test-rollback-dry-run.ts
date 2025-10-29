import { Client } from "pg";

/**
 * Dry-Run Test for Rollback Script
 *
 * Shows what WOULD be deleted without actually deleting anything
 */

export default async function testRollback({ container }: any) {
  console.log("\n🧪 ROLLBACK DRY-RUN TEST");
  console.log("=========================\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log("📋 Analysis of what WOULD be rolled back:\n");

    // Check regions
    const regions = await client.query(`
      SELECT id, name, currency_code, created_at
      FROM region
      WHERE name LIKE 'India - %' AND deleted_at IS NULL
      ORDER BY name
      LIMIT 5
    `);

    console.log(
      `1. Regions to be soft-deleted: ${regions.rows.length} (showing first 5)`
    );
    console.table(regions.rows);

    // Check prices
    const prices = await client.query(`
      SELECT 
        p.id,
        p.amount,
        p.currency_code,
        r.name as region_name
      FROM price p
      INNER JOIN price_rule pr ON p.id = pr.price_id
      INNER JOIN region r ON pr.value = r.id
      WHERE r.name LIKE 'India - %'
        AND p.deleted_at IS NULL
      ORDER BY p.amount
      LIMIT 5
    `);

    console.log(
      `\n2. Prices to be soft-deleted: ${prices.rows.length} (showing first 5)`
    );
    console.table(prices.rows);

    // Check price rules
    const rules = await client.query(`
      SELECT 
        pr.id,
        pr.attribute,
        pr.operator,
        r.name as region_value
      FROM price_rule pr
      INNER JOIN region r ON pr.value = r.id
      WHERE r.name LIKE 'India - %'
        AND pr.deleted_at IS NULL
      LIMIT 5
    `);

    console.log(
      `\n3. Price rules to be soft-deleted: ${rules.rows.length} (showing first 5)`
    );
    console.table(rules.rows);

    // Check metadata
    const metadata = await client.query(`
      SELECT pincode, region_code
      FROM pincode_metadata
      WHERE region_code IS NOT NULL
        AND region_code IN (
          SELECT id FROM region WHERE name LIKE 'India - %'
        )
      LIMIT 10
    `);

    console.log(
      `\n4. Metadata entries to have region_code cleared: ${metadata.rows.length}`
    );
    console.table(metadata.rows);

    // Check original data
    const original = await client.query(`
      SELECT COUNT(*) as count
      FROM product_pincode_price
      WHERE deleted_at IS NULL
    `);

    console.log(
      `\n5. Original prices (will be PRESERVED): ${original.rows[0].count}`
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ DRY-RUN COMPLETE");
    console.log("=".repeat(60));
    console.log("\n💡 To actually perform rollback, run:");
    console.log(
      "   npx medusa exec ./src/scripts/rollback-pricing-migration.ts"
    );
    console.log("\n⚠️  This will:");
    console.log(
      "   • Soft-delete all migrated regions, prices, and price rules"
    );
    console.log("   • Clear region references from metadata");
    console.log("   • Preserve all original product_pincode_price data");
    console.log("   • Allow you to re-run migration later if needed");

    await client.end();
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    await client.end();
    throw error;
  }
}
