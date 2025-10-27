import { Migration } from '@mikro-orm/migrations';

export class Migration20251027093204 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "dealer" drop constraint if exists "dealer_code_unique";`);
    this.addSql(`create table if not exists "dealer" ("id" text not null, "name" text not null, "code" text not null, "contact_name" text null, "contact_email" text null, "contact_phone" text null, "address" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dealer_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dealer_code_unique" ON "dealer" (code) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dealer_deleted_at" ON "dealer" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pincode_dealer" ("id" text not null, "pincode" text not null, "dealer_id" text not null, "delivery_days" integer not null default 3, "is_serviceable" boolean not null default true, "is_cod_available" boolean not null default true, "priority" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pincode_dealer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pincode_dealer_dealer_id" ON "pincode_dealer" (dealer_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pincode_dealer_deleted_at" ON "pincode_dealer" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_pincode_price" ("id" text not null, "variant_id" text not null, "sku" text not null, "pincode" text not null, "dealer_id" text not null, "price" numeric not null, "is_active" boolean not null default true, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_pincode_price_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_pincode_price_dealer_id" ON "product_pincode_price" (dealer_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_pincode_price_deleted_at" ON "product_pincode_price" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "pincode_dealer" add constraint "pincode_dealer_dealer_id_foreign" foreign key ("dealer_id") references "dealer" ("id") on update cascade;`);

    this.addSql(`alter table if exists "product_pincode_price" add constraint "product_pincode_price_dealer_id_foreign" foreign key ("dealer_id") references "dealer" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pincode_dealer" drop constraint if exists "pincode_dealer_dealer_id_foreign";`);

    this.addSql(`alter table if exists "product_pincode_price" drop constraint if exists "product_pincode_price_dealer_id_foreign";`);

    this.addSql(`drop table if exists "dealer" cascade;`);

    this.addSql(`drop table if exists "pincode_dealer" cascade;`);

    this.addSql(`drop table if exists "product_pincode_price" cascade;`);
  }

}
