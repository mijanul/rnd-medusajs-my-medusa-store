import { Migration } from "@mikro-orm/migrations";

export class Migration20251016000000 extends Migration {
  async up(): Promise<void> {
    // Create role table
    this.addSql(`
      CREATE TABLE "role" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "role_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "role_name_unique" UNIQUE ("name"),
        CONSTRAINT "role_slug_unique" UNIQUE ("slug")
      );
    `);

    // Create permission table
    this.addSql(`
      CREATE TABLE "permission" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "resource" text NOT NULL,
        "action" text NOT NULL,
        "description" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "permission_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "permission_name_unique" UNIQUE ("name")
      );
    `);

    // Create role_permission join table
    this.addSql(`
      CREATE TABLE "role_permission" (
        "id" text NOT NULL,
        "role_id" text NOT NULL,
        "permission_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "role_permission_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE,
        CONSTRAINT "role_permission_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "permission" ("id") ON DELETE CASCADE,
        CONSTRAINT "role_permission_unique" UNIQUE ("role_id", "permission_id")
      );
    `);

    // Create index on role_permission
    this.addSql(
      `CREATE INDEX "role_permission_role_id_index" ON "role_permission" ("role_id");`
    );
    this.addSql(
      `CREATE INDEX "role_permission_permission_id_index" ON "role_permission" ("permission_id");`
    );

    // Create user_role join table
    this.addSql(`
      CREATE TABLE "user_role" (
        "id" text NOT NULL,
        "user_id" text NOT NULL,
        "role_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "user_role_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "user_role_role_id_foreign" FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE,
        CONSTRAINT "user_role_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "user_role_unique" UNIQUE ("user_id", "role_id")
      );
    `);

    // Create index on user_role
    this.addSql(
      `CREATE INDEX "user_role_user_id_index" ON "user_role" ("user_id");`
    );
    this.addSql(
      `CREATE INDEX "user_role_role_id_index" ON "user_role" ("role_id");`
    );

    // Insert default roles
    this.addSql(`
      INSERT INTO "role" ("id", "name", "slug", "description", "is_active", "created_at", "updated_at")
      VALUES
        ('role_super_admin', 'Super Admin', 'super-admin', 'Full system access with all permissions', true, now(), now()),
        ('role_admin', 'Admin', 'admin', 'Administrative access to manage most resources', true, now(), now()),
        ('role_editor', 'Editor', 'editor', 'Can manage content and basic resources', true, now(), now()),
        ('role_viewer', 'Viewer', 'viewer', 'Read-only access to view resources', true, now(), now());
    `);

    // Insert default permissions
    this.addSql(`
      INSERT INTO "permission" ("id", "name", "resource", "action", "description", "created_at", "updated_at")
      VALUES
        -- All permissions
        ('perm_all_all', 'all-all', 'all', 'all', 'Full access to all resources and actions', now(), now()),
        
        -- Page permissions
        ('perm_page_view', 'page-view', 'page', 'view', 'View pages', now(), now()),
        ('perm_page_add', 'page-add', 'page', 'add', 'Create new pages', now(), now()),
        ('perm_page_edit', 'page-edit', 'page', 'edit', 'Edit existing pages', now(), now()),
        ('perm_page_delete', 'page-delete', 'page', 'delete', 'Delete pages', now(), now()),
        ('perm_page_all', 'page-all', 'page', 'all', 'Full access to page management', now(), now()),
        
        -- Product permissions
        ('perm_product_view', 'product-view', 'product', 'view', 'View products', now(), now()),
        ('perm_product_add', 'product-add', 'product', 'add', 'Create new products', now(), now()),
        ('perm_product_edit', 'product-edit', 'product', 'edit', 'Edit existing products', now(), now()),
        ('perm_product_delete', 'product-delete', 'product', 'delete', 'Delete products', now(), now()),
        ('perm_product_all', 'product-all', 'product', 'all', 'Full access to product management', now(), now()),
        
        -- Order permissions
        ('perm_order_view', 'order-view', 'order', 'view', 'View orders', now(), now()),
        ('perm_order_edit', 'order-edit', 'order', 'edit', 'Edit order details', now(), now()),
        ('perm_order_all', 'order-all', 'order', 'all', 'Full access to order management', now(), now()),
        
        -- User permissions
        ('perm_user_view', 'user-view', 'user', 'view', 'View users', now(), now()),
        ('perm_user_add', 'user-add', 'user', 'add', 'Create new users', now(), now()),
        ('perm_user_edit', 'user-edit', 'user', 'edit', 'Edit user details', now(), now()),
        ('perm_user_delete', 'user-delete', 'user', 'delete', 'Delete users', now(), now()),
        ('perm_user_all', 'user-all', 'user', 'all', 'Full access to user management', now(), now()),
        
        -- Role permissions
        ('perm_role_view', 'role-view', 'role', 'view', 'View roles', now(), now()),
        ('perm_role_add', 'role-add', 'role', 'add', 'Create new roles', now(), now()),
        ('perm_role_edit', 'role-edit', 'role', 'edit', 'Edit role details', now(), now()),
        ('perm_role_delete', 'role-delete', 'role', 'delete', 'Delete roles', now(), now()),
        ('perm_role_all', 'role-all', 'role', 'all', 'Full access to role management', now(), now());
    `);

    // Assign permissions to roles
    this.addSql(`
      INSERT INTO "role_permission" ("id", "role_id", "permission_id", "created_at")
      VALUES
        -- Super Admin gets all permissions
        ('rp_super_admin_all', 'role_super_admin', 'perm_all_all', now()),
        
        -- Admin gets most permissions except super admin functions
        ('rp_admin_page_all', 'role_admin', 'perm_page_all', now()),
        ('rp_admin_product_all', 'role_admin', 'perm_product_all', now()),
        ('rp_admin_order_all', 'role_admin', 'perm_order_all', now()),
        ('rp_admin_user_view', 'role_admin', 'perm_user_view', now()),
        ('rp_admin_user_edit', 'role_admin', 'perm_user_edit', now()),
        ('rp_admin_role_view', 'role_admin', 'perm_role_view', now()),
        
        -- Editor gets content management permissions
        ('rp_editor_page_all', 'role_editor', 'perm_page_all', now()),
        ('rp_editor_product_view', 'role_editor', 'perm_product_view', now()),
        ('rp_editor_product_edit', 'role_editor', 'perm_product_edit', now()),
        ('rp_editor_order_view', 'role_editor', 'perm_order_view', now()),
        
        -- Viewer gets read-only permissions
        ('rp_viewer_page_view', 'role_viewer', 'perm_page_view', now()),
        ('rp_viewer_product_view', 'role_viewer', 'perm_product_view', now()),
        ('rp_viewer_order_view', 'role_viewer', 'perm_order_view', now());
    `);
  }

  async down(): Promise<void> {
    // Drop tables in reverse order
    this.addSql('DROP TABLE IF EXISTS "user_role" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "role_permission" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "permission" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "role" CASCADE;');
  }
}
