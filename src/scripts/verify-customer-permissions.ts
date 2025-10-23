import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Verify that customer permissions exist in the database
 * Run: npx medusa exec ./src/scripts/verify-customer-permissions.ts
 */
export default async function verifyCustomerPermissions({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("🔍 Verifying customer permissions...");

  try {
    // Get all permissions for customers resource
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: { resource: "customers" },
    });

    if (!permissions || permissions.length === 0) {
      logger.error("❌ No customer permissions found!");
      logger.info(
        "💡 Run the seed script to create them: npx medusa exec ./src/scripts/seed-roles.ts"
      );
      return;
    }

    logger.info(`✅ Found ${permissions.length} customer permissions:\n`);

    // Display permissions in a table format
    console.log(
      "╔════════════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  Permission Name        │  Action  │  Description                      ║"
    );
    console.log(
      "╠════════════════════════════════════════════════════════════════════════╣"
    );

    const actions = ["list", "view", "create", "update", "delete"];
    const foundActions = new Set();

    permissions.forEach((perm: any) => {
      foundActions.add(perm.action);
      const name = perm.name.padEnd(22);
      const action = perm.action.padEnd(8);
      const description = (perm.description || "").substring(0, 32).padEnd(32);
      console.log(`║  ${name} │  ${action} │  ${description} ║`);
    });

    console.log(
      "╚════════════════════════════════════════════════════════════════════════╝\n"
    );

    // Check for missing actions
    const missingActions = actions.filter(
      (action) => !foundActions.has(action)
    );

    if (missingActions.length > 0) {
      logger.warn(
        `⚠️  Missing customer permissions for actions: ${missingActions.join(
          ", "
        )}`
      );
      logger.info(
        "💡 Run the seed script to create them: npx medusa exec ./src/scripts/seed-roles.ts"
      );
    } else {
      logger.info("✅ All expected customer permissions exist!");
    }

    // Check which roles have customer permissions
    logger.info("\n🔍 Checking roles with customer permissions...");

    const { data: rolePermissions } = await query.graph({
      entity: "role_permission",
      fields: ["role_id", "permission_id"],
    });

    const { data: roles } = await query.graph({
      entity: "role",
      fields: ["id", "name", "slug"],
    });

    // Map permission IDs to customer permissions
    const customerPermissionIds = new Set(permissions.map((p: any) => p.id));

    // Find roles that have customer permissions
    const rolesWithCustomerPerms = new Map();

    rolePermissions?.forEach((rp: any) => {
      if (customerPermissionIds.has(rp.permission_id)) {
        if (!rolesWithCustomerPerms.has(rp.role_id)) {
          rolesWithCustomerPerms.set(rp.role_id, []);
        }
        const perm = permissions.find((p: any) => p.id === rp.permission_id);
        if (perm) {
          rolesWithCustomerPerms.get(rp.role_id).push(perm.action);
        }
      }
    });

    if (rolesWithCustomerPerms.size === 0) {
      logger.warn("⚠️  No roles have customer permissions assigned yet!");
      logger.info(
        "💡 Assign customer permissions to roles via: http://localhost:9000/app/rbac-manager/role-management"
      );
    } else {
      console.log(
        "\n╔════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║  Role Name              │  Customer Permissions            ║"
      );
      console.log(
        "╠════════════════════════════════════════════════════════════╣"
      );

      rolesWithCustomerPerms.forEach((actions, roleId) => {
        const role = roles?.find((r: any) => r.id === roleId);
        if (role) {
          const roleName = role.name.padEnd(22);
          const permList = actions.join(", ").substring(0, 30).padEnd(30);
          console.log(`║  ${roleName} │  ${permList} ║`);
        }
      });

      console.log(
        "╚════════════════════════════════════════════════════════════╝"
      );
    }

    logger.info("\n✅ Verification complete!");
  } catch (error: any) {
    logger.error("❌ Error verifying customer permissions:", error.message);
    throw error;
  }
}
