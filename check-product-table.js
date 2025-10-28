const { Client } = require("pg");
require("dotenv").config();

async function checkProductTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Check for product tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%product%' 
      ORDER BY table_name;
    `);

    console.log("Product-related tables:");
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Check product table structure
    if (result.rows.find((r) => r.table_name === "product")) {
      console.log("\nProduct table columns:");
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'product' 
        ORDER BY ordinal_position;
      `);
      columns.rows.forEach((col) =>
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkProductTable();
