import { Client } from "pg";

export default async function checkProductPriceLinking({ container }: any) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log("\n🔍 HOW PRODUCTS LINK TO PRICING");
    console.log("================================");

    // Check if there's a link table
    console.log("\n1. Looking for link tables:");
    const linkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND (
          table_name LIKE '%product%price%'
          OR table_name LIKE '%price%product%'
          OR table_name LIKE '%link%'
        )
      ORDER BY table_name
    `);
    console.table(linkTables.rows);

    // Check product_variant_price_set link
    console.log("\n2. Checking product_variant_price_set:");
    const pvps = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_variant_price_set'
      ) as exists
    `);

    if (pvps.rows[0].exists) {
      const pvpsCols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'product_variant_price_set'
      `);
      console.table(pvpsCols.rows);

      const sampleLink = await client.query(`
        SELECT * FROM product_variant_price_set LIMIT 3
      `);
      console.log("\nSample links:");
      console.table(sampleLink.rows);
    }

    // Check actual product variant
    console.log("\n3. Sample product_variant:");
    const sampleVariant = await client.query(`
      SELECT id, product_id, title
      FROM product_variant
      WHERE product_id = 'prod_01K8N5JT03JVFG160G07ZMHBRE'
      LIMIT 1
    `);
    console.table(sampleVariant.rows);

    // Check if variant links to price_set
    if (sampleVariant.rows.length > 0) {
      const variantId = sampleVariant.rows[0].id;
      console.log(`\n4. Price sets for variant ${variantId}:`);

      const priceSetLink = await client.query(
        `
        SELECT * FROM product_variant_price_set
        WHERE variant_id = $1
      `,
        [variantId]
      );

      console.table(priceSetLink.rows);
    }

    await client.end();
  } catch (error) {
    console.error("Error:", error);
    await client.end();
  }
}
