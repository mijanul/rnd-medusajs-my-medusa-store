import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Utility functions for permission management
 */

/**
 * Standard actions for all resources
 */
export const STANDARD_ACTIONS = [
  { name: "create", description: "Create new items" },
  { name: "delete", description: "Delete items" },
  { name: "list", description: "List all items" },
  { name: "view", description: "View item details" },
  { name: "update", description: "Update existing items" },
];

/**
 * Generate permission objects for a resource
 */
export function generatePermissionsForResource(
  resourceName: string,
  resourceDescription?: string,
  actions: typeof STANDARD_ACTIONS = STANDARD_ACTIONS
) {
  const description = resourceDescription || resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  
  return actions.map((action) => ({
    id: `perm_${resourceName}_${action.name}`,
    name: `${resourceName}-${action.name}`,
    resource: resourceName,
    action: action.name,
    description: `${action.description} in ${description}`,
  }));
}

/**
 * Create permissions in database for a resource
 */
export async function createPermissionsForResource(
  container: any,
  resourceName: string,
  resourceDescription?: string,
  actions: typeof STANDARD_ACTIONS = STANDARD_ACTIONS
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    // Check if permissions already exist
    const existingPermissions = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action"],
    });

    const existingPermissionNames = new Set(
      existingPermissions?.data?.map((p: any) => p.name) || []
    );

    // Generate permissions
    const permissions = generatePermissionsForResource(
      resourceName,
      resourceDescription,
      actions
    );

    // Filter out existing permissions
    const permissionsToCreate = permissions.filter(
      (p) => !existingPermissionNames.has(p.name)
    );

    if (permissionsToCreate.length === 0) {
      logger.info(
        `All permissions for resource '${resourceName}' already exist.`
      );
      return { created: 0, skipped: permissions.length };
    }

    // Insert permissions
    const insertData = permissionsToCreate.map((p) => ({
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
      `✅ Created ${permissionsToCreate.length} permission(s) for resource '${resourceName}'`
    );
    permissionsToCreate.forEach((p) => {
      logger.info(`   - ${p.name}`);
    });

    return {
      created: permissionsToCreate.length,
      skipped: permissions.length - permissionsToCreate.length,
    };
  } catch (error) {
    logger.error(`Error creating permissions for resource '${resourceName}':`, error);
    throw error;
  }
}

/**
 * Batch create permissions for multiple resources
 */
export async function batchCreatePermissions(
  container: any,
  resources: Array<{ name: string; description?: string }>
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const results: Array<{
    resource: string;
    created: number;
    skipped: number;
  }> = [];

  for (const resource of resources) {
    const result = await createPermissionsForResource(
      container,
      resource.name,
      resource.description
    );
    results.push({
      resource: resource.name,
      ...result,
    });
  }

  // Summary
  const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

  logger.info("\n" + "=".repeat(70));
  logger.info("BATCH PERMISSION CREATION SUMMARY");
  logger.info("=".repeat(70));
  logger.info(`Total Permissions Created: ${totalCreated}`);
  logger.info(`Total Permissions Skipped: ${totalSkipped}`);
  logger.info("\nBreakdown by Resource:");
  results.forEach((r) => {
    if (r.created > 0) {
      logger.info(`  ✅ ${r.resource.padEnd(20)}: ${r.created} created, ${r.skipped} skipped`);
    } else {
      logger.info(`  ⏭️  ${r.resource.padEnd(20)}: ${r.skipped} already exist`);
    }
  });
  logger.info("=".repeat(70));

  return results;
}
