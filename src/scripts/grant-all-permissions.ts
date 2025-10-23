import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Grant all permissions to a specific user
 * This is useful for testing or giving admin users full access
 *
 * Usage:
 * npx medusa exec ./src/scripts/grant-all-permissions.ts
 */

export default async function grantAllPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting to grant all permissions...");

  try {
    // Get the current admin user (first one, or you can specify email)
    const users = await query.graph({
      entity: "user",
      fields: ["id", "email"],
    });

    if (!users?.data || users.data.length === 0) {
      logger.error("No users found in the system");
      return;
    }

    // Get or create "Admin" role with all permissions
    logger.info("Creating or updating Admin role...");

    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    // 1. Create/Get Admin Role
    const adminRole = await knex("role")
      .where({ slug: "admin-full-access" })
      .first();

    let roleId: string;

    if (!adminRole) {
      roleId = "role_admin_full";
      await knex("role").insert({
        id: roleId,
        name: "Full Admin Access",
        slug: "admin-full-access",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      logger.info("✅ Created new 'Full Admin Access' role");
    } else {
      roleId = adminRole.id;
      logger.info("✅ Found existing 'Full Admin Access' role");
    }

    // 2. Get all permissions
    const permissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource"],
    });

    if (!permissions?.data || permissions.data.length === 0) {
      logger.error("❌ No permissions found. Run seed-roles.ts first!");
      return;
    }

    logger.info(`Found ${permissions.data.length} permissions`);

    // 3. Delete existing role-permission mappings for this role
    await knex("role_permission").where({ role_id: roleId }).delete();
    logger.info("Cleared existing permissions for this role");

    // 4. Assign ALL permissions to the role
    const rolePermissions = permissions.data.map((perm: any) => ({
      id: `rp_${perm.id}`,
      role_id: roleId,
      permission_id: perm.id,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await knex("role_permission").insert(rolePermissions);
    logger.info(
      `✅ Assigned all ${rolePermissions.length} permissions to role`
    );

    // 5. Assign role to all users (or specific user)
    logger.info("\nAssigning role to users...");

    for (const user of users.data) {
      // Check if user already has this role
      const existingUserRole = await knex("user_role")
        .where({ user_id: user.id, role_id: roleId })
        .first();

      if (!existingUserRole) {
        await knex("user_role").insert({
          id: `ur_${user.id}_${roleId}`,
          user_id: user.id,
          role_id: roleId,
          created_at: new Date(),
          updated_at: new Date(),
        });
        logger.info(`✅ Assigned role to user: ${user.email}`);
      } else {
        logger.info(`ℹ️  User ${user.email} already has this role`);
      }
    }

    // 6. Summary
    logger.info("\n" + "=".repeat(60));
    logger.info("🎉 SUCCESS! All permissions granted!");
    logger.info("=".repeat(60));
    logger.info("\nSummary:");
    logger.info(`  Role: Full Admin Access (${roleId})`);
    logger.info(`  Permissions: ${permissions.data.length}`);
    logger.info(`  Users: ${users.data.length}`);
    logger.info("\nUsers with full access:");
    users.data.forEach((user: any) => {
      logger.info(`  - ${user.email}`);
    });
    logger.info("\n✅ You can now access all resources in the admin panel!");
    logger.info("✅ Restart Medusa and refresh the browser\n");
  } catch (error) {
    logger.error("❌ Error granting permissions:", error);
    throw error;
  }
}
