import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Permission Deletion Script
 *
 * This script allows you to delete permissions from the database.
 * You can delete by:
 * 1. Resource name (deletes all permissions for that resource)
 * 2. Specific permission names
 * 3. Specific permission IDs
 *
 * Run with: npx medusa exec ./src/scripts/delete-permissions.ts
 */

// ============================================================================
// CONFIGURATION - Edit this section to specify what to delete
// ============================================================================

const DELETE_CONFIG = {
  // Option 1: Delete all permissions for specific resources
  deleteByResource: [
    "Test", // Will delete all Test permissions
    "Test2", // Will delete all Test2 permissions
  ],

  // Option 2: Delete specific permissions by name
  deleteByName: [
    // "orders-create",
    // "products-view",
  ],

  // Option 3: Delete specific permissions by ID
  deleteById: [
    // "perm_orders_create",
    // "01K7PCCMTK2WP2X22Y5X13R3HA",
  ],

  // Safety setting: Set to true to actually delete, false for dry-run
  confirmDelete: true,
};

// ============================================================================
// Script Logic - Don't edit below unless you know what you're doing
// ============================================================================

export default async function deletePermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("=".repeat(70));
  logger.info("PERMISSION DELETION SCRIPT");
  logger.info("=".repeat(70));

  if (!DELETE_CONFIG.confirmDelete) {
    logger.warn("🔍 DRY RUN MODE - No permissions will be deleted");
    logger.warn("Set confirmDelete: true to actually delete permissions");
  }

  try {
    // Get all existing permissions
    const existingPermissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
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
    const permissionsToDelete: any[] = [];

    // Collect permissions to delete by resource
    if (DELETE_CONFIG.deleteByResource.length > 0) {
      logger.info("\n📂 Searching permissions by resource...");
      for (const resource of DELETE_CONFIG.deleteByResource) {
        const found = allPermissions.filter(
          (p: any) => p.resource === resource
        );
        if (found.length > 0) {
          permissionsToDelete.push(...found);
          logger.info(
            `  Found ${found.length} permission(s) for resource: ${resource}`
          );
          found.forEach((p: any) => {
            logger.info(`    - ${p.name} (${p.id})`);
          });
        } else {
          logger.warn(`  ⚠️  No permissions found for resource: ${resource}`);
        }
      }
    }

    // Collect permissions to delete by name
    if (DELETE_CONFIG.deleteByName.length > 0) {
      logger.info("\n🏷️  Searching permissions by name...");
      for (const name of DELETE_CONFIG.deleteByName) {
        const found = allPermissions.find((p: any) => p.name === name);
        if (found) {
          // Avoid duplicates
          if (!permissionsToDelete.find((p: any) => p.id === found.id)) {
            permissionsToDelete.push(found);
            logger.info(`  Found: ${found.name} (${found.id})`);
          }
        } else {
          logger.warn(`  ⚠️  Permission not found: ${name}`);
        }
      }
    }

    // Collect permissions to delete by ID
    if (DELETE_CONFIG.deleteById.length > 0) {
      logger.info("\n🆔 Searching permissions by ID...");
      for (const id of DELETE_CONFIG.deleteById) {
        const found = allPermissions.find((p: any) => p.id === id);
        if (found) {
          // Avoid duplicates
          if (!permissionsToDelete.find((p: any) => p.id === found.id)) {
            permissionsToDelete.push(found);
            logger.info(`  Found: ${found.name} (${found.id})`);
          }
        } else {
          logger.warn(`  ⚠️  Permission not found with ID: ${id}`);
        }
      }
    }

    if (permissionsToDelete.length === 0) {
      logger.info("\n✅ No permissions matched the deletion criteria.");
      return;
    }

    // Display summary
    logger.info("\n" + "=".repeat(70));
    logger.info(
      `SUMMARY: ${permissionsToDelete.length} permission(s) will be deleted`
    );
    logger.info("=".repeat(70));

    // Group by resource for display
    const groupedByResource = permissionsToDelete.reduce(
      (acc: any, perm: any) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      },
      {}
    );

    for (const [resource, perms] of Object.entries(groupedByResource)) {
      logger.info(`\n📁 ${resource}:`);
      (perms as any[]).forEach((p: any) => {
        logger.info(
          `  ❌ ${p.name.padEnd(30)} | ${p.action.padEnd(10)} | ${
            p.description
          }`
        );
      });
    }

    // Perform deletion
    if (DELETE_CONFIG.confirmDelete) {
      logger.info("\n🗑️  Deleting permissions...");

      const idsToDelete = permissionsToDelete.map((p: any) => p.id);

      // First, delete associated role_permission entries (foreign key constraint)
      const rolePermissionsDeleted = await knex("role_permission")
        .whereIn("permission_id", idsToDelete)
        .del();

      if (rolePermissionsDeleted > 0) {
        logger.info(
          `  Removed ${rolePermissionsDeleted} role-permission associations`
        );
      }

      // Then delete the permissions
      const deleted = await knex("permission").whereIn("id", idsToDelete).del();

      logger.info(`  Deleted ${deleted} permission(s)`);

      logger.info("\n✅ Deletion completed successfully!");
      logger.info("=".repeat(70));
    } else {
      logger.info("\n🔍 DRY RUN - No changes were made to the database");
      logger.info("Set confirmDelete: true in the script to actually delete");
      logger.info("=".repeat(70));
    }
  } catch (error) {
    logger.error("❌ Error deleting permissions:", error);
    throw error;
  }
}
