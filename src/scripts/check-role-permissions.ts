import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Check role_permission table data
 */
export default async function checkRolePermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Checking role_permission table...");

  try {
    // Check all role_permission records
    const rolePermissions = await knex("role_permission")
      .select("*")
      .orderBy("created_at", "desc");

    logger.info(`Found ${rolePermissions.length} role_permission records`);

    if (rolePermissions.length > 0) {
      logger.info("\nRole Permission Records:");
      rolePermissions.forEach((rp: any, idx: number) => {
        logger.info(`\n${idx + 1}. Role Permission:`);
        logger.info(`   ID: ${rp.id || "NULL"}`);
        logger.info(`   Role ID: ${rp.role_id}`);
        logger.info(`   Permission ID: ${rp.permission_id}`);
        logger.info(`   Created At: ${rp.created_at}`);
        logger.info(`   Deleted At: ${rp.deleted_at || "NULL"}`);
      });
    } else {
      logger.info("No role_permission records found!");
    }

    // Check roles
    const roles = await knex("role").select("id", "name", "slug");
    logger.info(`\n\nFound ${roles.length} roles:`);
    roles.forEach((role: any) => {
      logger.info(`  - ${role.name} (${role.slug}) [${role.id}]`);
    });

    // Check permissions
    const permissions = await knex("permission")
      .select("id", "name", "resource", "action")
      .limit(10);
    logger.info(`\n\nSample permissions (first 10):`);
    permissions.forEach((perm: any) => {
      logger.info(
        `  - ${perm.name} (${perm.resource}-${perm.action}) [${perm.id}]`
      );
    });
  } catch (error) {
    logger.error("❌ Error checking role_permission table:", error);
    throw error;
  }
}
