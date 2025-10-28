import { Migration } from "@mikro-orm/migrations";

/**
 * Migration: Remove dealer relationship and ensure one price per pincode
 *
 * Changes:
 * 1. Remove dealer_id column (no longer needed)
 * 2. Add unique constraint on (product_id, pincode)
 * 3. Keep only one price per product-pincode combination
 */
export class Migration20251028120000 extends Migration {
  async up(): Promise<void> {
    // Step 1: Remove duplicate entries - keep the lowest price for each product-pincode
    this.addSql(`
      DELETE FROM product_pincode_price
      WHERE id NOT IN (
        SELECT DISTINCT ON (product_id, pincode) id
        FROM product_pincode_price
        ORDER BY product_id, pincode, price ASC
      );
    `);

    // Step 2: Drop dealer_id column
    this.addSql(`
      ALTER TABLE "product_pincode_price" 
      DROP COLUMN IF EXISTS "dealer_id";
    `);

    // Step 3: Add unique constraint on product_id and pincode
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_pincode_unique" 
      ON "product_pincode_price" ("product_id", "pincode");
    `);
  }

  async down(): Promise<void> {
    // Step 1: Drop the unique constraint
    this.addSql(`
      DROP INDEX IF EXISTS "idx_product_pincode_unique";
    `);

    // Step 2: Re-add dealer_id column (for rollback)
    this.addSql(`
      ALTER TABLE "product_pincode_price" 
      ADD COLUMN "dealer_id" TEXT;
    `);
  }
}
