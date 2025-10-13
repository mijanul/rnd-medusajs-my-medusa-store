import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /pages
 * Fetch all published pages (for listing)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: pages } = await query.graph({
      entity: "page",
      fields: [
        "id",
        "title",
        "slug",
        "meta_title",
        "meta_description",
        "published_at",
      ],
      filters: {
        is_published: true,
      },
    });

    res.json({
      pages: pages || [],
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
