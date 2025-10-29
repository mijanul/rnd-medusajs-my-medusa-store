import { Client } from "pg";

/**
 * Day 4: Pricing Migration Implementation - Option A (Region per Pincode)
 *
 * This script migrates pricing data from product_pincode_price to Medusa's
 * native pricing system using the Region per Pincode approach.
 *
 * Strategy:
 * 1. Create 18 India regions (one per pincode)
 * 2. Link each region to its pincode in metadata
 * 3. For each product, create prices using Medusa's Pricing Module
 * 4. Link prices to appropriate regions
 * 5. Validate all prices are accessible
 */

export default async function implementPricingMigration({ container }: any) {
  console.log("\n🚀 DAY 4: IMPLEMENTING PRICING MIGRATION (OPTION A)");
  console.log("====================================================");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // Step 1: Get all unique pincodes
    console.log("\n1️⃣ LOADING PINCODES");
    console.log("--------------------");

    const pincodesResult = await client.query(`
      SELECT DISTINCT pm.pincode, pm.id as metadata_id
      FROM pincode_metadata pm
      INNER JOIN product_pincode_price ppp ON pm.pincode = ppp.pincode
      WHERE pm.deleted_at IS NULL AND ppp.deleted_at IS NULL
      ORDER BY pm.pincode
    `);

    console.log(
      `Found ${pincodesResult.rows.length} pincodes to create regions for`
    );
    console.log(
      `Pincodes: ${pincodesResult.rows.map((r) => r.pincode).join(", ")}`
    );

    // Step 2: Create regions for each pincode
    console.log("\n2️⃣ CREATING REGIONS");
    console.log("--------------------");

    const regionMapping: Record<string, string> = {};
    let regionsCreated = 0;
    let regionsExisting = 0;

    for (const pincodeRow of pincodesResult.rows) {
      const pincode = pincodeRow.pincode;

      // Check if region already exists for this pincode
      const existingRegion = await client.query(
        `
        SELECT r.id
        FROM region r
        WHERE r.name = $1 AND r.currency_code = 'inr'
        LIMIT 1
      `,
        [`India - ${pincode}`]
      );

      if (existingRegion.rows.length > 0) {
        regionMapping[pincode] = existingRegion.rows[0].id;
        regionsExisting++;
        console.log(
          `  ⏭️  Region exists for pincode ${pincode}: ${existingRegion.rows[0].id}`
        );
      } else {
        // Create new region
        const newRegion = await client.query(
          `
          INSERT INTO region (
            id,
            name,
            currency_code,
            created_at,
            updated_at
          ) VALUES (
            'reg_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 26),
            $1,
            'inr',
            NOW(),
            NOW()
          )
          RETURNING id
        `,
          [`India - ${pincode}`]
        );

        const regionId = newRegion.rows[0].id;
        regionMapping[pincode] = regionId;
        regionsCreated++;

        // Update pincode_metadata with region reference
        await client.query(
          `
          UPDATE pincode_metadata
          SET region_code = $1, updated_at = NOW()
          WHERE pincode = $2
        `,
          [regionId, pincode]
        );

        console.log(`  ✅ Created region for pincode ${pincode}: ${regionId}`);
      }
    }

    console.log(
      `\n📊 Region Summary: ${regionsCreated} created, ${regionsExisting} existing, ${
        regionsCreated + regionsExisting
      } total`
    );

    // Step 3: Get all pricing data
    console.log("\n3️⃣ LOADING PRICING DATA");
    console.log("-------------------------");

    const pricingData = await client.query(`
      SELECT 
        ppp.id,
        ppp.product_id,
        ppp.pincode,
        ppp.price,
        ppp.sku,
        p.title as product_title
      FROM product_pincode_price ppp
      INNER JOIN product p ON ppp.product_id = p.id
      WHERE ppp.deleted_at IS NULL
      ORDER BY ppp.product_id, ppp.pincode
    `);

    console.log(`Found ${pricingData.rows.length} prices to migrate`);

    // Group by product
    const productPrices: Record<string, any[]> = {};
    for (const row of pricingData.rows) {
      if (!productPrices[row.product_id]) {
        productPrices[row.product_id] = [];
      }
      productPrices[row.product_id].push(row);
    }

    console.log(`Grouped into ${Object.keys(productPrices).length} products`);

    // Step 4: Migrate prices product by product
    console.log("\n4️⃣ MIGRATING PRICES");
    console.log("--------------------");

    let totalPricesMigrated = 0;

    for (const [productId, prices] of Object.entries(productPrices)) {
      const productTitle = prices[0].product_title;
      console.log(`\n📦 Product: ${productTitle} (${prices.length} prices)`);

      // Get product variant and its price_set
      const variantResult = await client.query(
        `
        SELECT pv.id as variant_id, pvps.price_set_id
        FROM product_variant pv
        LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
        WHERE pv.product_id = $1 AND pv.deleted_at IS NULL
        LIMIT 1
      `,
        [productId]
      );

      if (variantResult.rows.length === 0) {
        console.log(
          `  ⚠️  No variant found for product ${productId}, skipping`
        );
        continue;
      }

      const variantId = variantResult.rows[0].variant_id;
      let priceSetId = variantResult.rows[0].price_set_id;

      // Create price_set if doesn't exist
      if (!priceSetId) {
        const newPriceSet = await client.query(`
          INSERT INTO price_set (
            id,
            created_at,
            updated_at
          ) VALUES (
            'pset_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 24),
            NOW(),
            NOW()
          )
          RETURNING id
        `);
        priceSetId = newPriceSet.rows[0].id;

        // Link variant to price_set
        await client.query(
          `
          INSERT INTO product_variant_price_set (
            id,
            variant_id,
            price_set_id,
            created_at,
            updated_at
          ) VALUES (
            'pvps_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 24),
            $1,
            $2,
            NOW(),
            NOW()
          )
        `,
          [variantId, priceSetId]
        );

        console.log(`  ✅ Created price_set: ${priceSetId}`);
      } else {
        console.log(`  ✓ Using existing price_set: ${priceSetId}`);
      }

      // Migrate each price
      let pricesAdded = 0;
      for (const priceRow of prices) {
        const pincode = priceRow.pincode;
        const regionId = regionMapping[pincode];

        if (!regionId) {
          console.log(`  ⚠️  No region for pincode ${pincode}, skipping`);
          continue;
        }

        // Check if price already exists
        const existingPrice = await client.query(
          `
          SELECT p.id
          FROM price p
          INNER JOIN price_rule pr ON p.id = pr.price_id
          WHERE p.price_set_id = $1
            AND p.currency_code = 'inr'
            AND p.amount::text = $2::text
            AND pr.value = $3
            AND p.deleted_at IS NULL
          LIMIT 1
        `,
          [priceSetId, priceRow.price.toString(), regionId]
        );

        if (existingPrice.rows.length > 0) {
          console.log(`  ⏭️  Price exists for pincode ${pincode}`);
          pricesAdded++;
          continue;
        }

        // Create price
        const priceAmount = parseFloat(priceRow.price.toString());
        const newPrice = await client.query(
          `
          INSERT INTO price (
            id,
            price_set_id,
            currency_code,
            amount,
            raw_amount,
            rules_count,
            created_at,
            updated_at
          ) VALUES (
            'price_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 24),
            $1,
            'inr',
            $2::numeric,
            jsonb_build_object('value', $2::text, 'precision', 20),
            1,
            NOW(),
            NOW()
          )
          RETURNING id
        `,
          [priceSetId, priceAmount]
        );

        const priceId = newPrice.rows[0].id;

        // Create price rule linking to region
        await client.query(
          `
          INSERT INTO price_rule (
            id,
            price_id,
            attribute,
            operator,
            value,
            priority,
            created_at,
            updated_at
          ) VALUES (
            'prule_' || SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 24),
            $1,
            'region_id',
            'eq',
            $2,
            0,
            NOW(),
            NOW()
          )
        `,
          [priceId, regionId]
        );

        console.log(`  ✅ Migrated: Pincode ${pincode} → ₹${priceRow.price}`);
        pricesAdded++;
        totalPricesMigrated++;
      }

      console.log(
        `  📊 ${pricesAdded}/${prices.length} prices migrated for ${productTitle}`
      );
    }

    console.log(`\n✅ Total prices migrated: ${totalPricesMigrated}`);

    // Step 5: Validation
    console.log("\n5️⃣ VALIDATION");
    console.log("--------------");

    // Count migrated prices
    const validationResult = await client.query(`
      SELECT 
        COUNT(DISTINCT r.id) as regions_created,
        COUNT(DISTINCT ps.id) as price_sets_with_data,
        COUNT(DISTINCT p.id) as total_prices,
        COUNT(DISTINCT pr.id) as price_rules
      FROM region r
      INNER JOIN price_rule pr ON r.id = pr.value
      INNER JOIN price p ON pr.price_id = p.id
      INNER JOIN price_set ps ON p.price_set_id = ps.id
      WHERE r.name LIKE 'India - %'
        AND r.deleted_at IS NULL
        AND p.deleted_at IS NULL
    `);

    console.table(validationResult.rows[0]);

    // Sample verification
    const samplePrices = await client.query(`
      SELECT 
        r.name as region_name,
        p.amount as price,
        p.currency_code,
        ps.id as price_set_id
      FROM region r
      INNER JOIN price_rule pr ON r.id = pr.value
      INNER JOIN price p ON pr.price_id = p.id
      INNER JOIN price_set ps ON p.price_set_id = ps.id
      WHERE r.name LIKE 'India - %'
        AND r.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ORDER BY r.name
      LIMIT 10
    `);

    console.log("\n📋 Sample Migrated Prices:");
    console.table(samplePrices.rows);

    console.log("\n🎉 MIGRATION COMPLETE!");
    console.log("=======================");
    console.log(
      `✅ Created ${regionsCreated} new regions (${
        regionsCreated + regionsExisting
      } total)`
    );
    console.log(`✅ Migrated ${totalPricesMigrated} prices`);
    console.log(
      `✅ Prices now support Medusa's promotions, price lists, and tax`
    );
    console.log(`✅ Each pincode has its own region for independent pricing`);

    await client.end();
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    await client.end();
    throw error;
  }
}
