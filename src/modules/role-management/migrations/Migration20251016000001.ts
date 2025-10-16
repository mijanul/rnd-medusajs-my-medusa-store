import { Migration } from "@mikro-orm/migrations";

export class Migration20251016000001 extends Migration {
  async up(): Promise<void> {
    // Add deleted_at columns to all role management tables
    this.addSql('ALTER TABLE "role" ADD COLUMN "deleted_at" timestamptz NULL;');
    this.addSql(
      'ALTER TABLE "permission" ADD COLUMN "deleted_at" timestamptz NULL;'
    );
    this.addSql(
      'ALTER TABLE "role_permission" ADD COLUMN "deleted_at" timestamptz NULL;'
    );
    this.addSql(
      'ALTER TABLE "user_role" ADD COLUMN "deleted_at" timestamptz NULL;'
    );
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "role" DROP COLUMN "deleted_at";');
    this.addSql('ALTER TABLE "permission" DROP COLUMN "deleted_at";');
    this.addSql('ALTER TABLE "role_permission" DROP COLUMN "deleted_at";');
    this.addSql('ALTER TABLE "user_role" DROP COLUMN "deleted_at";');
  }
}
