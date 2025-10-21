import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function verifyPagesPermissions({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("🔍 Verifying Pages permissions...");

  try {
    // Fetch all permissions with "page" or "Page" in the resource
    const { data: permissions } = await query.graph({
      entity: "permission",
      fields: ["id", "name", "resource", "action", "description"],
      filters: {},
    });

    // Filter permissions related to pages
    const pagesPermissions = permissions.filter(
      (p: any) =>
        p.resource?.toLowerCase() === "pages" ||
        p.resource?.toLowerCase() === "page"
    );

    logger.info(
      `\n📋 Found ${pagesPermissions.length} page-related permissions:\n`
    );

    // Group by resource (to show both 'pages' and 'Pages' if they exist)
    const byResource = pagesPermissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    Object.entries(byResource).forEach(([resource, perms]: [string, any]) => {
      logger.info(`\n  Resource: "${resource}"`);
      perms.forEach((p: any) => {
        logger.info(`    - ${p.name} (${p.resource}.${p.action})`);
      });
    });

    // Check if there's a case mismatch issue
    const resources = Object.keys(byResource);
    if (resources.length > 1) {
      logger.warn(
        `\n⚠️  WARNING: Multiple resource name variations found: ${resources.join(
          ", "
        )}`
      );
      logger.warn(
        "   This could cause permission check failures due to case sensitivity!"
      );
    }

    // Show the correct resource name to use in frontend
    if (resources.length > 0) {
      logger.info(
        `\n✅ Use this resource name in your frontend permission checks: "${resources[0]}"`
      );
    }

    logger.info("\n✅ Verification complete");
  } catch (error: any) {
    logger.error("❌ Error verifying permissions:", error.message);
    throw error;
  }
}
