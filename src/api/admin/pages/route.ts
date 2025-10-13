import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/pages
 * Fetch all pages (including unpublished)
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
        "content",
        "meta_title",
        "meta_description",
        "is_published",
        "published_at",
        "created_at",
        "updated_at",
      ],
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

/**
 * POST /admin/pages
 * Create a new page
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { title, slug, content, meta_title, meta_description, is_published } =
    req.body as {
      title: string;
      slug: string;
      content: string;
      meta_title?: string;
      meta_description?: string;
      is_published?: boolean;
    };

  if (!title || !slug || !content) {
    return res.status(400).json({
      message: "Title, slug, and content are required",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Check if slug already exists
    const { data: existingPages } = await query.graph({
      entity: "page",
      fields: ["id", "slug"],
      filters: { slug },
    });

    if (existingPages && existingPages.length > 0) {
      return res.status(400).json({
        message: "A page with this slug already exists",
      });
    }

    // Create the page
    const pageModule = req.scope.resolve("page") as any;
    const pageService = pageModule.service("page");

    const page = await pageService.createPages({
      title,
      slug,
      content,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      is_published: is_published !== undefined ? is_published : true,
      published_at: is_published !== false ? new Date() : null,
    });

    res.status(201).json({
      page,
    });
  } catch (error) {
    console.error("Error creating page:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
