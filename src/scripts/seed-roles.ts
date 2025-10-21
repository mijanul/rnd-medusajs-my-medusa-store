import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Resource configuration for permission seeding
 * Each resource will get: create, delete, list, view, update permissions
 */
const RESOURCES = [
  { name: "orders", description: "Orders" },
  { name: "products", description: "Products" },
  { name: "inventory", description: "Inventory" },
  { name: "customers", description: "Customers" },
  { name: "promotions", description: "Promotions" },
  { name: "price_lists", description: "Price Lists" },
  { name: "settings", description: "Settings" },
  { name: "pages", description: "Pages" },
];

/**
 * Actions to be created for each resource
 */
const ACTIONS = [
  { name: "create", description: "Create new items" },
  { name: "delete", description: "Delete items" },
  { name: "list", description: "List all items" },
  { name: "view", description: "View item details" },
  { name: "update", description: "Update existing items" },
];

export default async function seedRolesAndPermissions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting comprehensive permission seeding...");

  try {
    // Check if permissions already exist for these resources
    const existingPermissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action"],
    });

    const existingPermissionNames = new Set(
      existingPermissions?.data?.map((p: any) => p.name) || []
    );

    const permissionsToCreate: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
      description: string;
    }> = [];

    // Generate permissions for each resource
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const permissionName = `${resource.name}-${action.name}`;

        // Skip if permission already exists
        if (existingPermissionNames.has(permissionName)) {
          logger.info(
            `Permission '${permissionName}' already exists, skipping...`
          );
          continue;
        }

        permissionsToCreate.push({
          id: `perm_${resource.name}_${action.name}`,
          name: permissionName,
          resource: resource.name,
          action: action.name,
          description: `${action.description} in ${resource.description}`,
        });
      }
    }

    if (permissionsToCreate.length === 0) {
      logger.info(
        "All permissions already exist. No new permissions to create."
      );
      return;
    }

    // Use raw SQL to insert permissions
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    logger.info(`Creating ${permissionsToCreate.length} new permissions...`);

    // Insert permissions using knex insert (more reliable than raw SQL)
    const batchSize = 20;
    for (let i = 0; i < permissionsToCreate.length; i += batchSize) {
      const batch = permissionsToCreate.slice(i, i + batchSize);

      // Prepare data for insertion
      const insertData = batch.map((p) => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await knex("permission").insert(insertData);

      logger.info(
        `Batch ${Math.floor(i / batchSize) + 1}: Created ${
          batch.length
        } permissions`
      );
    }

    logger.info("✅ Permission seeding completed successfully!");
    logger.info(`Total permissions created: ${permissionsToCreate.length}`);
    logger.info("\nPermissions created by resource:");

    for (const resource of RESOURCES) {
      const count = permissionsToCreate.filter(
        (p) => p.resource === resource.name
      ).length;
      if (count > 0) {
        logger.info(
          `  - ${resource.description}: ${count} permissions (${ACTIONS.map(
            (a) => a.name
          ).join(", ")})`
        );
      }
    }
  } catch (error) {
    logger.error("❌ Error seeding permissions:", error);
    throw error;
  }
}
