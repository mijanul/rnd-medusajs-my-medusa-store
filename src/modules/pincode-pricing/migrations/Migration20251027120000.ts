import { Migration } from "@mikro-orm/migrations";

/**
 * Migration to change product_pincode_price from variant_id to product_id
 * This removes the concept of variants and links pricing directly to products
 */
export class Migration20251027120000 extends Migration {
  async up(): Promise<void> {
    // Drop the old index on variant_id if it exists
    this.addSql(`
      DROP INDEX IF EXISTS product_pincode_price_variant_id_index;
    `);

    // Rename variant_id column to product_id
    this.addSql(`
      ALTER TABLE product_pincode_price 
      RENAME COLUMN variant_id TO product_id;
    `);

    // Create new index on product_id
    this.addSql(`
      CREATE INDEX product_pincode_price_product_id_index 
      ON product_pincode_price(product_id);
    `);

    // Create composite index for faster lookups
    this.addSql(`
      CREATE INDEX product_pincode_price_product_pincode_index 
      ON product_pincode_price(product_id, pincode);
    `);
  }

  async down(): Promise<void> {
    // Drop the new indexes
    this.addSql(`
      DROP INDEX IF EXISTS product_pincode_price_product_id_index;
    `);

    this.addSql(`
      DROP INDEX IF EXISTS product_pincode_price_product_pincode_index;
    `);

    // Rename product_id back to variant_id
    this.addSql(`
      ALTER TABLE product_pincode_price 
      RENAME COLUMN product_id TO variant_id;
    `);

    // Recreate old index
    this.addSql(`
      CREATE INDEX product_pincode_price_variant_id_index 
      ON product_pincode_price(variant_id);
    `);
  }
}
