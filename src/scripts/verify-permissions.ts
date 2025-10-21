import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Script to verify permissions in the database
 * Run with: npx medusa exec ./src/scripts/verify-permissions.ts
 */
export default async function verifyPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("=".repeat(60));
  logger.info("PERMISSION VERIFICATION REPORT");
  logger.info("=".repeat(60));

  try {
    // Get all permissions
    const permissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description", "created_at"],
    });

    if (!permissions || !permissions.data || permissions.data.length === 0) {
      logger.warn("⚠️  No permissions found in the database!");
      return;
    }

    const allPermissions = permissions.data;
    logger.info(`\n📊 Total Permissions: ${allPermissions.length}\n`);

    // Group by resource
    const groupedByResource = allPermissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    // Display permissions by resource
    const resources = Object.keys(groupedByResource).sort();

    for (const resource of resources) {
      const perms = groupedByResource[resource];
      logger.info(
        `\n📁 ${resource.toUpperCase()} (${perms.length} permissions):`
      );
      logger.info("-".repeat(60));

      perms.forEach((perm: any) => {
        logger.info(
          `  ✓ ${perm.action.padEnd(10)} | ${perm.name.padEnd(25)} | ${
            perm.description
          }`
        );
      });
    }

    // Summary by action
    logger.info("\n" + "=".repeat(60));
    logger.info("ACTIONS SUMMARY:");
    logger.info("=".repeat(60));

    const groupedByAction = allPermissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.action]) {
        acc[perm.action] = 0;
      }
      acc[perm.action]++;
      return acc;
    }, {});

    Object.entries(groupedByAction)
      .sort()
      .forEach(([action, count]) => {
        logger.info(`  ${action.padEnd(15)}: ${count} permissions`);
      });

    // Check for expected resources
    logger.info("\n" + "=".repeat(60));
    logger.info("EXPECTED RESOURCES CHECK:");
    logger.info("=".repeat(60));

    const expectedResources = [
      "orders",
      "products",
      "inventory",
      "customers",
      "promotions",
      "price_lists",
      "settings",
      "pages",
    ];

    const expectedActions = ["create", "delete", "list", "view", "update"];

    for (const resource of expectedResources) {
      const hasResource = resources.includes(resource);
      if (hasResource) {
        const resourcePerms = groupedByResource[resource];
        const actions = resourcePerms.map((p: any) => p.action);
        const missingActions = expectedActions.filter(
          (a) => !actions.includes(a)
        );

        if (missingActions.length === 0) {
          logger.info(`  ✅ ${resource.padEnd(15)}: All 5 actions present`);
        } else {
          logger.warn(
            `  ⚠️  ${resource.padEnd(
              15
            )}: Missing actions: ${missingActions.join(", ")}`
          );
        }
      } else {
        logger.warn(`  ❌ ${resource.padEnd(15)}: Resource not found!`);
      }
    }

    logger.info("\n" + "=".repeat(60));
    logger.info("✅ Verification complete!");
    logger.info("=".repeat(60) + "\n");
  } catch (error) {
    logger.error("❌ Error verifying permissions:", error);
    throw error;
  }
}
