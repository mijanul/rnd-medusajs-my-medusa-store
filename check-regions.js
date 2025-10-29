/**
 * Check Regions in Database
 *
 * Simple script to check what regions exist and identify the issue
 */

const { Client } = require("pg");
require("dotenv").config();

async function checkRegions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Check all regions
    const result = await client.query(`
      SELECT id, name, currency_code, metadata, created_at
      FROM region
      WHERE deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 20
    `);

    console.log(`📊 Found ${result.rowCount} regions:\n`);

    if (result.rowCount === 0) {
      console.log("⚠️  NO REGIONS FOUND!");
      console.log("\n🔧 SOLUTION:");
      console.log("   You need to create a default region first.");
      console.log("   Run this SQL in your database:\n");
      console.log(`   INSERT INTO region (name, currency_code, metadata) 
   VALUES ('India', 'inr', '{"is_default": true}');`);
      return;
    }

    // Find non-pincode regions (potential default regions)
    const defaultRegions = result.rows.filter((r) => !r.name.includes("-IN"));
    const pincodeRegions = result.rows.filter((r) => r.name.includes("-IN"));

    console.log("🌍 Default/Country Regions:");
    if (defaultRegions.length === 0) {
      console.log("   ⚠️  None found! This is the problem.");
    } else {
      defaultRegions.forEach((r) => {
        console.log(`   ✓ ${r.name} (${r.id}) - ${r.currency_code}`);
      });
    }

    console.log(`\n📍 Pincode Regions: ${pincodeRegions.length} found`);
    if (pincodeRegions.length > 0) {
      console.log("   Examples:");
      pincodeRegions.slice(0, 3).forEach((r) => {
        console.log(`   - ${r.name} (${r.id})`);
      });
      if (pincodeRegions.length > 3) {
        console.log(`   ... and ${pincodeRegions.length - 3} more`);
      }
    }

    // Check for the specific region ID from the error
    const errorRegionId = "reg_01K7E7DZD0GAXH2N06BDJMQMYA";
    const errorRegion = result.rows.find((r) => r.id === errorRegionId);

    console.log(`\n🔍 Checking for region ${errorRegionId}:`);
    if (errorRegion) {
      console.log(`   ✓ Found: ${errorRegion.name}`);
    } else {
      console.log(`   ✗ NOT FOUND - This is causing the error!`);
    }

    // Solution
    console.log("\n💡 SOLUTION:");
    if (defaultRegions.length === 0) {
      console.log("   1. Create a default region for your store");
      console.log("   2. Go to Admin Dashboard → Settings → Regions");
      console.log('   3. Create a region called "India" with currency INR');
      console.log("   4. OR run this SQL:");
      console.log(`\n   INSERT INTO region (name, currency_code, metadata)
   VALUES ('India', 'inr', '{"is_default": true}')
   RETURNING id, name;\n`);
    } else {
      console.log("   ✓ You have default regions - storefront should work");
      console.log(`   ✓ Default region ID: ${defaultRegions[0].id}`);
      console.log("   ✓ Clear browser cache and cookies, then retry");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkRegions()
  .then(() => {
    console.log("\n✅ Check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error.message);
    process.exit(1);
  });
