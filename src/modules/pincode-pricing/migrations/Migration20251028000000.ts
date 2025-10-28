import { Migration } from "@mikro-orm/migrations";

/**
 * Migration to add foreign key constraint for product_id in product_pincode_price
 * This ensures that when a product is deleted, all its pincode prices are automatically deleted (CASCADE)
 */
export class Migration20251028000000 extends Migration {
  async up(): Promise<void> {
    // Add foreign key constraint with CASCADE delete
    this.addSql(`
      ALTER TABLE product_pincode_price 
      ADD CONSTRAINT product_pincode_price_product_id_foreign 
      FOREIGN KEY (product_id) 
      REFERENCES product(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `);

    console.log(
      "✅ Foreign key constraint added: product_pincode_price.product_id -> product.id with CASCADE delete"
    );
  }

  async down(): Promise<void> {
    // Remove the foreign key constraint
    this.addSql(`
      ALTER TABLE product_pincode_price 
      DROP CONSTRAINT IF EXISTS product_pincode_price_product_id_foreign;
    `);

    console.log(
      "✅ Foreign key constraint removed: product_pincode_price_product_id_foreign"
    );
  }
}
