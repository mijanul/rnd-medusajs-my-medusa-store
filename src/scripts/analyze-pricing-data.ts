import { Client } from "pg";

export default async function analyzePricingData({ container }: any) {
  console.log("\n📊 ANALYZING PRICING DATA FOR MIGRATION");
  console.log("=========================================");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // 1. Check product_pincode_price table
    console.log("\n1️⃣ PRODUCT_PINCODE_PRICE TABLE");
    console.log("--------------------------------");

    const priceResult = await client.query(`
      SELECT 
        COUNT(*) as total_prices,
        COUNT(DISTINCT product_id) as unique_products,
        COUNT(DISTINCT pincode) as unique_pincodes,
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price), 2) as avg_price
      FROM product_pincode_price
      WHERE deleted_at IS NULL
    `);

    console.table(priceResult.rows[0]);

    // Sample prices
    const samplePrices = await client.query(`
      SELECT 
        pp.id,
        p.title as product_title,
        pp.product_id,
        pp.sku,
        pp.pincode,
        pp.price,
        pp.is_active
      FROM product_pincode_price pp
      LEFT JOIN product p ON pp.product_id = p.id
      WHERE pp.deleted_at IS NULL
      ORDER BY pp.pincode, pp.product_id
      LIMIT 10
    `);

    console.log("\n📋 Sample Pricing Records:");
    console.table(samplePrices.rows);

    // 2. Check pincode_metadata table
    console.log("\n2️⃣ PINCODE_METADATA TABLE");
    console.log("---------------------------");

    const metadataResult = await client.query(`
      SELECT COUNT(*) as total_pincodes
      FROM pincode_metadata
    `);

    console.log(
      `Total pincodes with metadata: ${metadataResult.rows[0].total_pincodes}`
    );

    // 3. Check Medusa's existing regions
    console.log("\n3️⃣ MEDUSA'S REGION TABLE");
    console.log("-------------------------");

    const regionResult = await client.query(`
      SELECT 
        id,
        name,
        currency_code,
        created_at
      FROM region
      ORDER BY created_at
    `);

    console.log(`Total existing regions: ${regionResult.rows.length}`);
    if (regionResult.rows.length > 0) {
      console.table(regionResult.rows);
    } else {
      console.log("⚠️  No regions exist. We'll need to create them.");
    }

    // 4. Check price_set and price tables
    console.log("\n4️⃣ MEDUSA'S PRICING TABLES");
    console.log("----------------------------");

    const priceSetResult = await client.query(`
      SELECT COUNT(*) as price_sets FROM price_set
    `);

    const medusaPriceResult = await client.query(`
      SELECT COUNT(*) as prices FROM price
    `);

    console.log(`Existing price sets: ${priceSetResult.rows[0].price_sets}`);
    console.log(`Existing prices: ${medusaPriceResult.rows[0].prices}`);

    // 5. Migration Strategy
    console.log("\n5️⃣ MIGRATION STRATEGY");
    console.log("----------------------");

    const strategy = await client.query(`
      SELECT 
        COUNT(DISTINCT pincode) as pincodes_to_map,
        COUNT(DISTINCT product_id) as products_to_migrate,
        COUNT(*) as total_price_records
      FROM product_pincode_price
      WHERE deleted_at IS NULL
    `);

    console.log("\n📝 What We Need To Do:");
    console.log(
      `  1. Create/map ${strategy.rows[0].pincodes_to_map} regions (one per pincode)`
    );
    console.log(
      `  2. Migrate ${strategy.rows[0].total_price_records} price records`
    );
    console.log(
      `  3. Link ${strategy.rows[0].products_to_migrate} products to new pricing`
    );
    console.log(`  4. Create price_sets for each product`);
    console.log(`  5. Validate all prices are accessible`);

    // 6. Check for any potential issues
    console.log("\n6️⃣ VALIDATION CHECKS");
    console.log("---------------------");

    // Check for pincodes without metadata
    const missingMetadata = await client.query(`
      SELECT DISTINCT ppp.pincode
      FROM product_pincode_price ppp
      LEFT JOIN pincode_metadata pm ON ppp.pincode = pm.pincode
      WHERE ppp.deleted_at IS NULL
        AND pm.id IS NULL
    `);

    if (missingMetadata.rows.length > 0) {
      console.log(
        `⚠️  ${missingMetadata.rows.length} pincodes in pricing but missing from metadata:`
      );
      console.table(missingMetadata.rows);
    } else {
      console.log("✅ All pricing pincodes have metadata");
    }

    // Check for products without variants
    const productVariants = await client.query(`
      SELECT 
        p.id,
        p.title,
        COUNT(pv.id) as variant_count
      FROM product p
      LEFT JOIN product_variant pv ON p.id = pv.product_id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.title
      ORDER BY p.title
    `);

    console.log("\n📦 Products and Variants:");
    console.table(productVariants.rows);

    console.log("\n✅ ANALYSIS COMPLETE");
    console.log("Ready to start Day 3 migration!");

    await client.end();
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    await client.end();
    throw error;
  }
}
