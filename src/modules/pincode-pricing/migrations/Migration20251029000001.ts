import { Migration } from "@mikro-orm/migrations";

/**
 * Migration: Add pincode_metadata table
 *
 * This migration creates the pincode_metadata table which stores
 * delivery and serviceability information for pincodes.
 *
 * This is part of the optimized pricing architecture that separates
 * pricing data (stored in Medusa's native price table) from
 * delivery/serviceability metadata.
 */
export class Migration20251029000001 extends Migration {
  async up(): Promise<void> {
    // Create pincode_metadata table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS pincode_metadata (
        id TEXT PRIMARY KEY,
        pincode TEXT NOT NULL UNIQUE,
        region_code TEXT,
        state TEXT,
        city TEXT,
        delivery_days INTEGER DEFAULT 3,
        is_cod_available BOOLEAN DEFAULT true,
        is_serviceable BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    // Create indexes for performance
    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_pincode_metadata_pincode 
      ON pincode_metadata(pincode) 
      WHERE deleted_at IS NULL;
    `);

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_pincode_metadata_region_code 
      ON pincode_metadata(region_code) 
      WHERE deleted_at IS NULL;
    `);

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_pincode_metadata_serviceable 
      ON pincode_metadata(is_serviceable) 
      WHERE deleted_at IS NULL;
    `);

    console.log("✅ Created pincode_metadata table with indexes");

    // Migrate existing pincode data from pincode_dealer table
    // This preserves delivery_days, is_cod_available, is_serviceable
    this.addSql(`
      INSERT INTO pincode_metadata (
        id,
        pincode,
        delivery_days,
        is_cod_available,
        is_serviceable,
        created_at,
        updated_at
      )
      SELECT 
        'pmd_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 24) as id,
        pincode,
        delivery_days,
        is_cod_available,
        is_serviceable,
        NOW(),
        NOW()
      FROM (
        SELECT DISTINCT ON (pincode)
          pincode,
          delivery_days,
          is_cod_available,
          is_serviceable
        FROM pincode_dealer
        WHERE deleted_at IS NULL
        ORDER BY pincode, priority ASC
      ) AS unique_pincodes
      ON CONFLICT (pincode) DO NOTHING;
    `);

    console.log("✅ Migrated existing pincode data to pincode_metadata");
  }

  async down(): Promise<void> {
    // Drop indexes
    this.addSql(`DROP INDEX IF EXISTS idx_pincode_metadata_serviceable;`);
    this.addSql(`DROP INDEX IF EXISTS idx_pincode_metadata_region_code;`);
    this.addSql(`DROP INDEX IF EXISTS idx_pincode_metadata_pincode;`);

    // Drop table
    this.addSql(`DROP TABLE IF EXISTS pincode_metadata;`);

    console.log("✅ Rolled back pincode_metadata table");
  }
}
