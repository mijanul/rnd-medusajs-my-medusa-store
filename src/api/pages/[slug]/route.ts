import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /pages/:slug
 * Fetch a single page by slug
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: pages } = await query.graph({
      entity: "page",
      fields: [
        "id",
        "title",
        "slug",
        "content",
        "meta_title",
        "meta_description",
        "published_at",
      ],
      filters: {
        slug: slug,
        is_published: true,
      },
    });

    if (!pages || pages.length === 0) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    res.json({
      page: pages[0],
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
