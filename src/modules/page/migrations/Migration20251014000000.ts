import { Migration } from "@mikro-orm/migrations";

export class Migration20251014000000 extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE "page" ADD COLUMN "deleted_at" timestamptz NULL;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "page" DROP COLUMN "deleted_at";');
  }
}
