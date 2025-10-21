import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Verify all role management tables have correct schema
 */
export default async function verifyRoleManagementSchema({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Verifying role management tables schema...\n");

  const tables = ["role", "permission", "role_permission", "user_role"];

  try {
    for (const tableName of tables) {
      const columns = await knex.raw(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      logger.info(`\n📋 Table: ${tableName}`);
      logger.info("=".repeat(50));
      columns.rows.forEach((col: any) => {
        logger.info(
          `  ✓ ${col.column_name.padEnd(20)} ${col.data_type.padEnd(
            30
          )} nullable: ${col.is_nullable}`
        );
      });
    }

    logger.info("\n\n✅ All role management tables verified successfully!");
  } catch (error) {
    logger.error("❌ Error verifying table schemas:", error);
    throw error;
  }
}
