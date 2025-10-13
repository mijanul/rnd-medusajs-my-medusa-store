import { Migration } from '@mikro-orm/migrations';

export class Migration20251013121419 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "page" drop constraint if exists "page_slug_unique";`);
    this.addSql(`create table if not exists "page" ("id" text not null, "title" text not null, "slug" text not null, "content" text not null, "meta_title" text null, "meta_description" text null, "is_published" boolean not null default true, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "page_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_unique" ON "page" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_page_deleted_at" ON "page" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "page" cascade;`);
  }

}
