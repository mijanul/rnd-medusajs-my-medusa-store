import { ExecArgs } from "@medusajs/framework/types";
import { createPermissionsForResource } from "../utils/permission-utils";

/**
 * Add Permissions for a Custom Module
 *
 * This script creates permissions for a new custom module.
 *
 * HOW TO USE:
 * 1. Edit the CUSTOM_MODULE configuration below
 * 2. Run: npx medusa exec ./src/scripts/add-custom-module-permissions.ts
 *
 * EXAMPLE:
 * If you create a new "Brand" module:
 * - Set resourceName: "brands"
 * - Set resourceDescription: "Brands"
 * - Run the script
 * - It will create: brands-create, brands-delete, brands-list, brands-view, brands-update
 */

// ============================================================================
// CONFIGURATION - Edit this section for your custom module
// ============================================================================

const CUSTOM_MODULE = {
  // The resource name (usually plural, lowercase with underscores)
  // Examples: "brands", "blog_posts", "categories", "reviews"
  resourceName: "brands",

  // Human-readable description (optional, defaults to capitalized resourceName)
  // Examples: "Brands", "Blog Posts", "Product Categories", "Customer Reviews"
  resourceDescription: "Brands",
};

// ============================================================================
// Script Logic - Don't edit below unless you know what you're doing
// ============================================================================

export default async function addCustomModulePermissions({
  container,
}: ExecArgs) {
  const logger = container.resolve("logger");

  logger.info("=".repeat(70));
  logger.info("ADD CUSTOM MODULE PERMISSIONS");
  logger.info("=".repeat(70));
  logger.info(`\nResource: ${CUSTOM_MODULE.resourceName}`);
  logger.info(`Description: ${CUSTOM_MODULE.resourceDescription}\n`);

  if (!CUSTOM_MODULE.resourceName) {
    logger.error("❌ Error: resourceName is required!");
    logger.error("Please edit the CUSTOM_MODULE configuration in this script.");
    return;
  }

  try {
    const result = await createPermissionsForResource(
      container,
      CUSTOM_MODULE.resourceName,
      CUSTOM_MODULE.resourceDescription
    );

    logger.info("\n" + "=".repeat(70));
    logger.info("RESULT");
    logger.info("=".repeat(70));
    logger.info(`Permissions Created: ${result.created}`);
    logger.info(`Permissions Skipped: ${result.skipped}`);

    if (result.created > 0) {
      logger.info("\n✅ Permissions added successfully!");
      logger.info("\nPermissions created:");
      logger.info(`  - ${CUSTOM_MODULE.resourceName}-create`);
      logger.info(`  - ${CUSTOM_MODULE.resourceName}-delete`);
      logger.info(`  - ${CUSTOM_MODULE.resourceName}-list`);
      logger.info(`  - ${CUSTOM_MODULE.resourceName}-view`);
      logger.info(`  - ${CUSTOM_MODULE.resourceName}-update`);
    } else {
      logger.info("\nℹ️  All permissions already exist. No action taken.");
    }

    logger.info("\n" + "=".repeat(70));
    logger.info("Next Steps:");
    logger.info("=".repeat(70));
    logger.info("1. Verify permissions with:");
    logger.info("   npx medusa exec ./src/scripts/verify-permissions.ts");
    logger.info("\n2. Assign permissions to roles in your admin UI");
    logger.info("\n3. Start using the permissions in your routes/middleware");
    logger.info("=".repeat(70));
  } catch (error) {
    logger.error("❌ Error adding custom module permissions:", error);
    throw error;
  }
}
