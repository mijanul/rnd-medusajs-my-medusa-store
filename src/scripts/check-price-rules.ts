import { Client } from "pg";

export default async function checkPriceRules({ container }: any) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // Check price_rule table structure
    console.log("\n1. price_rule table structure:");
    const prCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price_rule'
      ORDER BY ordinal_position
    `);
    console.table(prCols.rows);

    // Check sample price_rule
    console.log("\n2. Sample price_rule:");
    const samplePR = await client.query(`
      SELECT * FROM price_rule LIMIT 3
    `);
    console.table(samplePR.rows);

    // Check how existing prices link to regions
    console.log("\n3. How do prices link to regions?");
    const regionLink = await client.query(`
      SELECT 
        p.id as price_id,
        p.currency_code,
        p.amount,
        pr.value as rule_value,
        pr.attribute as rule_attribute
      FROM price p
      LEFT JOIN price_rule pr ON p.id = pr.price_id
      WHERE p.deleted_at IS NULL
      LIMIT 5
    `);
    console.table(regionLink.rows);

    await client.end();
  } catch (error) {
    console.error("Error:", error);
    await client.end();
  }
}
