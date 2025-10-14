import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /admin/pages/:id/restore
 * Restore a soft-deleted page by setting deleted_at to null
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("========== RESTORE ENDPOINT HIT ==========");
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Request Params:", req.params);

  const id = req.params.id;
  console.log("Extracted ID:", id);

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    console.log("Starting restore process for page:", id);

    // Check if page exists and is deleted
    const { data: existingPages } = await query.graph({
      entity: "page",
      fields: ["id", "deleted_at"],
      filters: { id },
      withDeleted: true,
    });

    console.log("Query result:", existingPages);

    if (!existingPages || existingPages.length === 0) {
      console.log("Page not found in database");
      return res.status(404).json({
        message: "Page not found",
      });
    }

    console.log("Page found, deleted_at:", existingPages[0].deleted_at);

    if (!existingPages[0].deleted_at) {
      console.log("Page is not deleted, cannot restore");
      return res.status(400).json({
        message: "Page is not deleted",
      });
    }

    const pageService = req.scope.resolve("page") as any;
    console.log("Page service resolved, attempting to restore...");

    await pageService.restorePages(id);

    console.log("Page restored successfully!");
    res.status(200).json({
      id,
      restored: true,
    });
  } catch (error) {
    console.error("========== ERROR RESTORING PAGE ==========");
    console.error("Error details:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
