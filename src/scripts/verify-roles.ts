import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function verifyRoleManagement({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Verifying role management system...\n");

  try {
    // Check roles
    const { data: roles } = await query.graph({
      entity: "role",
      fields: ["id", "name", "slug", "description"],
    });

    logger.info(`✅ Roles table: ${roles.length} roles found`);
    roles.forEach((role: any) => {
      logger.info(`   - ${role.name} (${role.slug})`);
    });

    // Check permissions
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action"],
    });

    logger.info(
      `\n✅ Permissions table: ${permissions.length} permissions found`
    );

    // Group by resource
    const byResource: any = {};
    permissions.forEach((perm: any) => {
      if (!byResource[perm.resource]) {
        byResource[perm.resource] = [];
      }
      byResource[perm.resource].push(perm.action);
    });

    Object.keys(byResource).forEach((resource) => {
      logger.info(`   - ${resource}: ${byResource[resource].join(", ")}`);
    });

    // Check role_permission mappings
    const { data: rolePerms } = await query.graph({
      entity: "role_permission",
      fields: ["id", "role_id", "permission_id"],
    });

    logger.info(
      `\n✅ Role-Permission mappings: ${rolePerms.length} mappings found`
    );

    // Count permissions per role
    const permsByRole: any = {};
    rolePerms.forEach((rp: any) => {
      permsByRole[rp.role_id] = (permsByRole[rp.role_id] || 0) + 1;
    });

    roles.forEach((role: any) => {
      const count = permsByRole[role.id] || 0;
      logger.info(`   - ${role.name}: ${count} permission(s)`);
    });

    // Check user_role table
    const { data: userRoles } = await query.graph({
      entity: "user_role",
      fields: ["id"],
    });

    logger.info(
      `\n✅ User-Role assignments: ${userRoles.length} assignment(s)`
    );

    logger.info("\n🎉 Role management system verified successfully!");
    logger.info("\nAPI Endpoints available:");
    logger.info("  - GET    /admin/roles");
    logger.info("  - POST   /admin/roles");
    logger.info("  - GET    /admin/roles/:id");
    logger.info("  - GET    /admin/permissions");
    logger.info("  - POST   /admin/roles/:id/permissions");
    logger.info("  - GET    /admin/users/:id/roles");
    logger.info("  - POST   /admin/users/:id/roles");
  } catch (error: any) {
    logger.error("Error verifying role management:", error.message);
    throw error;
  }
}
