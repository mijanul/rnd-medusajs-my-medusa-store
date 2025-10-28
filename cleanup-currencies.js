#!/usr/bin/env node

/**
 * This script removes all currencies except INR from the database
 * Run with: node cleanup-currencies.js
 */

const { Client } = require("pg");

async function cleanupCurrencies() {
  const client = new Client({
    connectionString:
      "postgres://mijanul:qa%40123@localhost/medusa-my-medusa-store",
  });

  try {
    await client.connect();
    console.log("Connected to database...");

    // First, check how many currencies we have
    const countResult = await client.query("SELECT COUNT(*) FROM currency;");
    console.log(`\nCurrent currency count: ${countResult.rows[0].count}`);

    // Check which currency is used by the region
    const regionCheck = await client.query(`
      SELECT r.name, r.currency_code 
      FROM region r 
      ORDER BY r.name;
    `);
    console.log("\nRegions and their currencies:");
    regionCheck.rows.forEach((row) => {
      console.log(`  - ${row.name}: ${row.currency_code}`);
    });

    // Check if there are any prices using other currencies
    const priceCheck = await client.query(`
      SELECT currency_code, COUNT(*) as count
      FROM price
      WHERE currency_code != 'inr'
      GROUP BY currency_code
      ORDER BY count DESC;
    `);

    if (priceCheck.rows.length > 0) {
      console.log(`\n⚠️  Found prices using currencies other than INR:`);
      priceCheck.rows.forEach((row) => {
        console.log(`  - ${row.currency_code}: ${row.count} prices`);
      });
      console.log(
        "\n🗑️  These prices will be deleted along with the currencies..."
      );
    }

    // Delete prices in other currencies first
    console.log("\n🗑️  Deleting prices in currencies other than INR...");
    const deletePricesResult = await client.query(`
      DELETE FROM price 
      WHERE currency_code != 'inr'
      RETURNING currency_code;
    `);

    if (deletePricesResult.rows.length > 0) {
      console.log(`✅ Deleted ${deletePricesResult.rows.length} prices`);
    }

    // Delete all currencies except INR
    console.log("\n🗑️  Deleting all currencies except INR...");
    const deleteResult = await client.query(`
      DELETE FROM currency 
      WHERE code != 'inr'
      RETURNING code, name;
    `);

    console.log(
      `\n✅ Successfully deleted ${deleteResult.rows.length} currencies!`
    );
    console.log("\nDeleted currencies (first 10):");
    deleteResult.rows.slice(0, 10).forEach((row) => {
      console.log(`  - ${row.code}: ${row.name}`);
    });

    if (deleteResult.rows.length > 10) {
      console.log(`  ... and ${deleteResult.rows.length - 10} more`);
    }

    // Verify the cleanup
    const finalCount = await client.query("SELECT COUNT(*) FROM currency;");
    console.log(`\n✨ Final currency count: ${finalCount.rows[0].count}`);

    const remaining = await client.query("SELECT code, name FROM currency;");
    console.log("\nRemaining currency:");
    remaining.rows.forEach((row) => {
      console.log(`  - ${row.code}: ${row.name}`);
    });

    console.log(
      "\n✅ Cleanup complete! Restart your Medusa server to see the changes."
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupCurrencies();
