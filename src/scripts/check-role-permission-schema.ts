import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Check role_permission table structure
 */
export default async function checkRolePermissionSchema({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Checking role_permission table schema...");

  try {
    // Get table structure
    const columns = await knex.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'role_permission'
      ORDER BY ordinal_position;
    `);

    logger.info("\nColumns in role_permission table:");
    columns.rows.forEach((col: any) => {
      logger.info(
        `  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });
  } catch (error) {
    logger.error("❌ Error checking table schema:", error);
    throw error;
  }
}
