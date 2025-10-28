const { Client } = require("pg");
require("dotenv").config();

async function verifyForeignKey() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Check foreign key constraints on product_pincode_price table
    const result = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'product_pincode_price';
    `);

    console.log("Foreign key constraints on product_pincode_price table:\n");
    result.rows.forEach((row) => {
      console.log(`✅ Constraint: ${row.constraint_name}`);
      console.log(`   Column: ${row.column_name}`);
      console.log(
        `   References: ${row.foreign_table_name}(${row.foreign_column_name})`
      );
      console.log(`   On Delete: ${row.delete_rule}`);
      console.log(`   On Update: ${row.update_rule}`);
      console.log("");
    });

    if (result.rows.length === 0) {
      console.log("⚠️  No foreign key constraints found!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

verifyForeignKey();
