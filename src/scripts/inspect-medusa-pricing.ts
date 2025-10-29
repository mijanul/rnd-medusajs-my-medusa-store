import { Client } from "pg";

export default async function inspectMedusaPricing({ container }: any) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log("\n🔍 INSPECTING MEDUSA PRICING SCHEMA");
    console.log("====================================");

    // Check price_set table
    console.log("\n1. price_set table:");
    const priceSetCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price_set'
      ORDER BY ordinal_position
    `);
    console.table(priceSetCols.rows);

    // Check price table
    console.log("\n2. price table:");
    const priceCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price'
      ORDER BY ordinal_position
    `);
    console.table(priceCols.rows);

    // Check product_variant table for price linking
    console.log("\n3. product_variant table (price-related columns):");
    const variantCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_variant'
        AND column_name LIKE '%price%'
      ORDER BY ordinal_position
    `);
    console.table(variantCols.rows);

    // Check sample price_set
    console.log("\n4. Sample price_set:");
    const samplePS = await client.query(`SELECT * FROM price_set LIMIT 1`);
    console.table(samplePS.rows);

    // Check sample price
    console.log("\n5. Sample price:");
    const sampleP = await client.query(`SELECT * FROM price LIMIT 1`);
    console.table(sampleP.rows);

    // Check for rule tables
    console.log("\n6. Price rule tables:");
    const ruleTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%rule%'
        AND table_schema = 'public'
    `);
    console.table(ruleTables.rows);

    await client.end();
  } catch (error) {
    console.error("Error:", error);
    await client.end();
  }
}
