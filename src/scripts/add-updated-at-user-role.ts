import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Add updated_at column to user_role table
 */
export default async function addUpdatedAtToUserRole({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Adding updated_at column to user_role table...");

  try {
    // Check if column already exists
    const columns = await knex.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_role' AND column_name = 'updated_at';
    `);

    if (columns.rows.length > 0) {
      logger.info("Column updated_at already exists in user_role table");
      return;
    }

    // Add updated_at column
    await knex.raw(`
      ALTER TABLE "user_role" 
      ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();
    `);

    logger.info("✅ Successfully added updated_at column to user_role table");
  } catch (error) {
    logger.error("❌ Error adding updated_at column:", error);
    throw error;
  }
}
