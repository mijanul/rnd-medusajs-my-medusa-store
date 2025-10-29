/**
 * Fix Region Names and Create Default Region
 *
 * This script:
 * 1. Creates a proper default "India" region
 * 2. Renames pincode regions to correct format (PINCODE-IN)
 */

const { Client } = require("pg");
require("dotenv").config();

async function fixRegions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Step 1: Check if a proper default region exists
    const defaultCheck = await client.query(`
      SELECT * FROM region
      WHERE name = 'India'
      AND deleted_at IS NULL
    `);

    let defaultRegionId;

    if (defaultCheck.rowCount === 0) {
      console.log("📝 Creating default India region...");

      // Generate a unique ID for the region
      const { randomBytes } = require("crypto");
      const newId = "reg_" + randomBytes(12).toString("hex").substring(0, 26);

      const result = await client.query(
        `
        INSERT INTO region (id, name, currency_code, metadata)
        VALUES ($1, 'India', 'inr', '{"is_default": true}')
        RETURNING id, name
      `,
        [newId]
      );

      defaultRegionId = result.rows[0].id;
      console.log(
        `✅ Created default region: ${result.rows[0].name} (${defaultRegionId})\n`
      );
    } else {
      defaultRegionId = defaultCheck.rows[0].id;
      console.log(`✅ Default region exists: India (${defaultRegionId})\n`);
    }

    // Step 2: Get all regions with "India - PINCODE" format
    const pincodeRegions = await client.query(`
      SELECT id, name
      FROM region
      WHERE name LIKE 'India - %'
      AND deleted_at IS NULL
    `);

    console.log(
      `📍 Found ${pincodeRegions.rowCount} pincode regions to rename\n`
    );

    if (pincodeRegions.rowCount > 0) {
      console.log("🔄 Renaming pincode regions...\n");

      for (const region of pincodeRegions.rows) {
        // Extract pincode from "India - 110001" format
        const pincode = region.name.replace("India - ", "");
        const newName = `${pincode}-IN`;

        await client.query(
          `
          UPDATE region
          SET name = $1
          WHERE id = $2
        `,
          [newName, region.id]
        );

        console.log(`   ✓ ${region.name} → ${newName}`);
      }

      console.log(`\n✅ Renamed ${pincodeRegions.rowCount} regions`);
    }

    // Step 3: Verify the changes
    console.log("\n📊 Final region summary:");

    const summary = await client.query(`
      SELECT 
        CASE 
          WHEN name LIKE '%-IN' THEN 'Pincode Region'
          ELSE 'Default Region'
        END as type,
        COUNT(*) as count
      FROM region
      WHERE deleted_at IS NULL
      GROUP BY type
    `);

    summary.rows.forEach((row) => {
      console.log(`   ${row.type}: ${row.count}`);
    });

    console.log("\n✨ Region fix complete!");
    console.log("\n💡 Next steps:");
    console.log("   1. Restart your Medusa server");
    console.log("   2. Clear browser cache and cookies");
    console.log("   3. Try accessing the storefront again");
    console.log(`   4. Default region ID: ${defaultRegionId}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

fixRegions()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });
