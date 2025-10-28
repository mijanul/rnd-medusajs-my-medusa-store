const { Client } = require("pg");
require("dotenv").config();

async function deletePincodePrices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    const result = await client.query("DELETE FROM product_pincode_price");
    console.log(
      `✅ Successfully deleted ${result.rowCount} rows from product_pincode_price table`
    );
  } catch (error) {
    console.error("❌ Error deleting data:", error.message);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

deletePincodePrices();
