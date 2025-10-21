import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Update permission resource names to use proper display format
 * - price_lists → Price Lists (with capital letters and space)
 * - pages → Pages
 */
export default async function updatePermissionDescriptions({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Starting permission resource name updates...");

  try {
    // Get all permissions that need updating
    const priceListPerms = await knex("permission")
      .where("resource", "price_lists")
      .select("id", "name", "action", "description", "resource");

    const pagePerms = await knex("permission")
      .where("resource", "pages")
      .select("id", "name", "action", "description", "resource");

    logger.info(`Found ${priceListPerms.length} price_lists permissions`);
    logger.info(`Found ${pagePerms.length} pages permissions`);

    let updatedCount = 0;

    // Update price_lists permissions - change resource name AND description
    for (const perm of priceListPerms) {
      let newDescription = "";
      switch (perm.action) {
        case "create":
          newDescription = "Create new items in Price Lists";
          break;
        case "delete":
          newDescription = "Delete items in Price Lists";
          break;
        case "list":
          newDescription = "List all items in Price Lists";
          break;
        case "view":
          newDescription = "View item details in Price Lists";
          break;
        case "update":
          newDescription = "Update existing items in Price Lists";
          break;
        default:
          logger.warn(`Unknown action: ${perm.action} for ${perm.name}`);
          continue;
      }

      await knex("permission").where("id", perm.id).update({
        resource: "Price Lists", // Update resource column to use proper name with space
        description: newDescription,
        updated_at: new Date(),
      });

      logger.info(
        `✓ Updated ${perm.name}: resource "price_lists" → "Price Lists"`
      );
      updatedCount++;
    }

    // Update pages permissions - change resource name AND description
    for (const perm of pagePerms) {
      let newDescription = "";
      switch (perm.action) {
        case "create":
          newDescription = "Create new items in Pages";
          break;
        case "delete":
          newDescription = "Delete items in Pages";
          break;
        case "list":
          newDescription = "List all items in Pages";
          break;
        case "view":
          newDescription = "View item details in Pages";
          break;
        case "update":
          newDescription = "Update existing items in Pages";
          break;
        default:
          logger.warn(`Unknown action: ${perm.action} for ${perm.name}`);
          continue;
      }

      await knex("permission").where("id", perm.id).update({
        resource: "Pages", // Ensure resource column uses proper capitalization
        description: newDescription,
        updated_at: new Date(),
      });

      logger.info(`✓ Updated ${perm.name}: resource "pages" → "Pages"`);
      updatedCount++;
    }

    logger.info(
      `\n✅ Permission resource name update completed! Updated ${updatedCount} permissions.`
    );
  } catch (error) {
    logger.error("❌ Error updating permission resource names:", error);
    throw error;
  }
}
