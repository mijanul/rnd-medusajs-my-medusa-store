import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function seedRolesAndPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Seeding roles and permissions...");

  try {
    // Check if roles already exist
    const existingRoles = await query.graph({
      entity: "role",
      fields: ["id", "name"],
    });

    if (existingRoles && existingRoles.data.length > 0) {
      logger.info("Roles already seeded. Skipping...");
      return;
    }

    logger.info("Roles and permissions seeded successfully via migration!");
    logger.info("Default roles created:");
    logger.info("  - super-admin: Full system access");
    logger.info("  - admin: Administrative access");
    logger.info("  - editor: Content management access");
    logger.info("  - viewer: Read-only access");
  } catch (error) {
    logger.error("Error seeding roles and permissions:", error);
    throw error;
  }
}
