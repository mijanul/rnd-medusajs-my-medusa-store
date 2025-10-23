/**
 * Script to verify settings permissions exist in the database
 * Run with: npx medusa exec src/scripts/add-settings-permissions.ts
 *
 * Note: Settings permissions already exist in the database:
 * - settings-create
 * - settings-delete
 * - settings-list
 * - settings-view
 * - settings-update
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function verifySettingsPermissions({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("🔧 Verifying settings permissions...");

  try {
    // Check if settings permissions exist
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: {
        resource: "settings",
      },
    });

    if (!permissions || permissions.length === 0) {
      logger.warn("⚠️  No settings permissions found in database!");
      logger.info("\nExpected permissions:");
      logger.info("  - settings-list");
      logger.info("  - settings-view");
      logger.info("  - settings-create");
      logger.info("  - settings-update");
      logger.info("  - settings-delete");
      return;
    }

    logger.info(`\n✅ Found ${permissions.length} settings permissions:\n`);

    permissions.forEach((perm: any) => {
      logger.info(`   ✓ ${perm.name} - ${perm.description}`);
    });

    logger.info("\n" + "=".repeat(70));
    logger.info("NEXT STEPS");
    logger.info("=".repeat(70));
    logger.info("1. Settings permissions are already in the database ✓");
    logger.info("2. Restart your server: yarn dev");
    logger.info("3. Assign settings permissions to roles if needed");
    logger.info("4. Users with settings permissions can access /app/settings");
    logger.info("5. Users without settings permissions will be blocked");
  } catch (error) {
    logger.error("❌ Error verifying settings permissions:", error);
    throw error;
  }
}
