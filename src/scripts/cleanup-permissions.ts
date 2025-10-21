import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Interactive Permission Cleanup Script
 *
 * This script helps clean up unwanted permissions from the database.
 * It can delete permissions by resource name, permission name, or ID.
 *
 * Run with: npx medusa exec ./src/scripts/cleanup-permissions.ts
 */

export default async function cleanupPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("=".repeat(70));
  logger.info("PERMISSION CLEANUP UTILITY");
  logger.info("=".repeat(70));

  try {
    // Get all existing permissions
    const existingPermissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description", "created_at"],
    });

    if (
      !existingPermissions ||
      !existingPermissions.data ||
      existingPermissions.data.length === 0
    ) {
      logger.info("No permissions found in the database.");
      return;
    }

    const allPermissions = existingPermissions.data;
    logger.info(`\n📊 Total Permissions in Database: ${allPermissions.length}`);

    // Group by resource
    const groupedByResource = allPermissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    // Display all resources
    logger.info("\n📁 Resources in Database:");
    logger.info("-".repeat(70));
    Object.entries(groupedByResource)
      .sort()
      .forEach(([resource, perms]) => {
        logger.info(
          `  ${resource.padEnd(20)} | ${(perms as any[]).length} permission(s)`
        );
      });

    // Check for test resources that should be cleaned up
    const testResources = ["Test", "Test2"];
    const testPermissions = allPermissions.filter((p: any) =>
      testResources.includes(p.resource)
    );

    if (testPermissions.length > 0) {
      logger.info("\n" + "=".repeat(70));
      logger.info("⚠️  FOUND TEST PERMISSIONS TO CLEAN UP");
      logger.info("=".repeat(70));

      testPermissions.forEach((p: any) => {
        logger.info(
          `  ${p.resource.padEnd(10)} | ${p.action.padEnd(
            10
          )} | ${p.name.padEnd(25)} | ${p.id}`
        );
      });

      logger.info(
        `\n🗑️  Deleting ${testPermissions.length} test permission(s)...`
      );

      const idsToDelete = testPermissions.map((p: any) => p.id);

      // Delete role_permission associations first
      const rolePermissionsDeleted = await knex("role_permission")
        .whereIn("permission_id", idsToDelete)
        .del();

      if (rolePermissionsDeleted > 0) {
        logger.info(
          `  ✓ Removed ${rolePermissionsDeleted} role-permission associations`
        );
      }

      // Delete the permissions
      const deleted = await knex("permission").whereIn("id", idsToDelete).del();

      logger.info(`  ✓ Deleted ${deleted} permission(s)`);
      logger.info("\n✅ Test permissions cleaned up successfully!");
    } else {
      logger.info("\n✅ No test permissions found. Database is clean!");
    }

    // Display final summary
    const remainingPermissions = await query.graph({
      entity: "permission",
      fields: ["id", "resource"],
    });

    const remainingGrouped = (remainingPermissions?.data || []).reduce(
      (acc: any, perm: any) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = 0;
        }
        acc[perm.resource]++;
        return acc;
      },
      {}
    );

    logger.info("\n" + "=".repeat(70));
    logger.info("FINAL DATABASE STATE");
    logger.info("=".repeat(70));
    logger.info(
      `Total Permissions: ${remainingPermissions?.data?.length || 0}\n`
    );

    Object.entries(remainingGrouped)
      .sort()
      .forEach(([resource, count]) => {
        logger.info(`  ✓ ${resource.padEnd(20)}: ${count} permission(s)`);
      });

    logger.info("\n" + "=".repeat(70));
  } catch (error) {
    logger.error("❌ Error cleaning up permissions:", error);
    throw error;
  }
}
