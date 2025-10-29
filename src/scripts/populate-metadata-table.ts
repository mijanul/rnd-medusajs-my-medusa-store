import { Client } from "pg";

export default async function populateMetadataTable({ container }: any) {
  console.log("\n🚀 POPULATING PINCODE_METADATA TABLE");
  console.log("=====================================");

  // Create a direct PostgreSQL connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // First, check if we have data in pincode_dealer
    const checkResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pincode_dealer 
      WHERE deleted_at IS NULL
    `);

    const pincodeCount = parseInt(checkResult.rows[0].count);
    console.log(`\n📊 Found ${pincodeCount} active records in pincode_dealer`);

    if (pincodeCount === 0) {
      console.log("\n⚠️  No data to migrate. Pincode_dealer table is empty.");
      await client.end();
      return;
    }

    // Check current state of pincode_metadata
    const metadataCheck = await client.query(`
      SELECT COUNT(*) as count FROM pincode_metadata
    `);
    const metadataCount = parseInt(metadataCheck.rows[0].count);
    console.log(`📊 Current records in pincode_metadata: ${metadataCount}`);

    // Migrate data
    console.log("\n🔄 Migrating data...");

    const insertResult = await client.query(`
      INSERT INTO pincode_metadata (
        id,
        pincode,
        delivery_days,
        is_cod_available,
        is_serviceable,
        created_at,
        updated_at
      )
      SELECT 
        'pmd_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 24) as id,
        pincode,
        delivery_days,
        is_cod_available,
        is_serviceable,
        NOW(),
        NOW()
      FROM (
        SELECT DISTINCT ON (pincode)
          pincode,
          delivery_days,
          is_cod_available,
          is_serviceable
        FROM pincode_dealer
        WHERE deleted_at IS NULL
        ORDER BY pincode, priority ASC
      ) AS unique_pincodes
      ON CONFLICT (pincode) DO UPDATE SET
        delivery_days = EXCLUDED.delivery_days,
        is_cod_available = EXCLUDED.is_cod_available,
        is_serviceable = EXCLUDED.is_serviceable,
        updated_at = NOW()
      RETURNING id, pincode
    `);

    const inserted = insertResult.rows.length;
    console.log(`✅ Migrated ${inserted} unique pincodes`);

    // Show sample data
    const sampleResult = await client.query(`
      SELECT 
        pincode,
        delivery_days,
        is_cod_available,
        is_serviceable
      FROM pincode_metadata
      ORDER BY pincode
      LIMIT 5
    `);

    console.log("\n📋 Sample data:");
    console.table(sampleResult.rows);

    // Show statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_serviceable = true) as serviceable,
        COUNT(*) FILTER (WHERE is_cod_available = true) as cod_available,
        ROUND(AVG(delivery_days), 1) as avg_delivery_days
      FROM pincode_metadata
    `);

    console.log("\n📊 STATISTICS");
    console.log(`✓ Total pincodes: ${statsResult.rows[0].total}`);
    console.log(`✓ Serviceable: ${statsResult.rows[0].serviceable}`);
    console.log(`✓ COD available: ${statsResult.rows[0].cod_available}`);
    console.log(
      `✓ Avg delivery days: ${statsResult.rows[0].avg_delivery_days}`
    );

    console.log("\n🎯 MIGRATION COMPLETE");
    console.log("✅ Pincode metadata table populated successfully");

    await client.end();
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    await client.end();
    throw error;
  }
}
