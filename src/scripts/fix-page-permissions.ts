import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Fix Page/Pages Duplicate Permissions
 *
 * This script removes the duplicate "page" permissions since we're using "pages" (plural)
 */

export default async function fixPagePermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("=".repeat(70));
  logger.info("FIX PAGE/PAGES DUPLICATE PERMISSIONS");
  logger.info("=".repeat(70));

  try {
    // Delete role_permission associations for "page" resource
    const rolePermsDeleted = await knex("role_permission")
      .whereIn("permission_id", function () {
        this.select("id").from("permission").where("resource", "page");
      })
      .del();

    logger.info(
      `Removed ${rolePermsDeleted} role-permission associations for 'page'`
    );

    // Delete permissions for "page" resource
    const permsDeleted = await knex("permission")
      .where("resource", "page")
      .del();

    logger.info(`Deleted ${permsDeleted} permission(s) for resource 'page'`);

    logger.info("\n✅ Cleanup completed!");
    logger.info("\nNow you only have 'pages' (plural) permissions.");
    logger.info("\nVerify with:");
    logger.info("  npx medusa exec ./src/scripts/verify-permissions.ts");
    logger.info("=".repeat(70));
  } catch (error) {
    logger.error("❌ Error fixing page permissions:", error);
    throw error;
  }
}
