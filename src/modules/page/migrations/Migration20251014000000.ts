import { Migration } from "@mikro-orm/migrations";

export class Migration20251014000000 extends Migration {
  async up(): Promise<void> {
    // Check if column exists before adding it
    this.addSql(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'page' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE "page" ADD COLUMN "deleted_at" timestamptz NULL;
        END IF;
      END $$;
    `);
  }

  async down(): Promise<void> {
    // Check if column exists before dropping it
    this.addSql(`
      DO $$ 
      BEGIN 
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'page' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE "page" DROP COLUMN "deleted_at";
        END IF;
      END $$;
    `);
  }
}
