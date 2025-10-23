import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Check what permissions the current user has
 * This helps debug permission issues
 *
 * Usage:
 * npx medusa exec ./src/scripts/check-my-permissions.ts
 */

export default async function checkMyPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Checking user permissions...\n");

  try {
    // Get all users
    const users = await query.graph({
      entity: "user",
      fields: ["id", "email"],
    });

    if (!users?.data || users.data.length === 0) {
      logger.error("No users found");
      return;
    }

    for (const user of users.data) {
      logger.info("=".repeat(60));
      logger.info(`User: ${user.email}`);
      logger.info("=".repeat(60));

      // Get user's roles
      const userRoles = await knex("user_role")
        .join("role", "user_role.role_id", "role.id")
        .where("user_role.user_id", user.id)
        .select("role.id", "role.name", "role.slug", "role.is_active");

      if (userRoles.length === 0) {
        logger.warn(`❌ No roles assigned to ${user.email}`);
        logger.info("\nTo fix:");
        logger.info(
          "  npx medusa exec ./src/scripts/grant-all-permissions.ts\n"
        );
        continue;
      }

      logger.info(`\nRoles (${userRoles.length}):`);
      userRoles.forEach((role) => {
        logger.info(
          `  - ${role.name} (${role.slug}) ${
            role.is_active ? "✅" : "⚠️ INACTIVE"
          }`
        );
      });

      // Get permissions for each role
      const roleIds = userRoles.map((r) => r.id);

      const permissions = await knex("role_permission")
        .join("permission", "role_permission.permission_id", "permission.id")
        .whereIn("role_permission.role_id", roleIds)
        .select("permission.name", "permission.resource", "permission.action")
        .orderBy("permission.resource")
        .orderBy("permission.action");

      if (permissions.length === 0) {
        logger.warn(`\n❌ No permissions assigned to roles`);
        logger.info("\nTo fix:");
        logger.info(
          "  npx medusa exec ./src/scripts/grant-all-permissions.ts\n"
        );
        continue;
      }

      logger.info(`\nPermissions (${permissions.length}):`);

      // Group by resource
      const grouped: Record<string, string[]> = {};
      permissions.forEach((perm) => {
        if (!grouped[perm.resource]) {
          grouped[perm.resource] = [];
        }
        grouped[perm.resource].push(perm.action);
      });

      Object.keys(grouped)
        .sort()
        .forEach((resource) => {
          logger.info(`  ${resource}: ${grouped[resource].sort().join(", ")}`);
        });

      // Check specifically for the resources causing 403 errors
      const requiredResources = ["orders", "products", "customers"];
      const requiredActions = ["list", "view", "create", "update", "delete"];

      logger.info("\n" + "-".repeat(60));
      logger.info("Status for Core Resources:");
      logger.info("-".repeat(60));

      requiredResources.forEach((resource) => {
        const resourcePerms = grouped[resource] || [];
        const status =
          resourcePerms.length >= 5
            ? "✅ Full Access"
            : resourcePerms.length > 0
            ? `⚠️  Partial (${resourcePerms.join(", ")})`
            : "❌ No Access";

        logger.info(`  ${resource.padEnd(12)}: ${status}`);
      });

      logger.info("");
    }

    logger.info("\n" + "=".repeat(60));
    logger.info("💡 Tips:");
    logger.info("=".repeat(60));
    logger.info("If you see ❌ No Access or ⚠️  Partial:");
    logger.info(
      "  1. Run: npx medusa exec ./src/scripts/grant-all-permissions.ts"
    );
    logger.info("  2. Restart Medusa");
    logger.info("  3. Refresh browser\n");
  } catch (error) {
    logger.error("Error checking permissions:", error);
    throw error;
  }
}
