import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/pages/:id
 * Fetch a single page by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

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
      filters: { id },
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

/**
 * POST /admin/pages/:id
 * Update a page
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const { title, slug, content, meta_title, meta_description, is_published } =
    req.body as {
      title?: string;
      slug?: string;
      content?: string;
      meta_title?: string;
      meta_description?: string;
      is_published?: boolean;
    };

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Check if page exists
    const { data: existingPages } = await query.graph({
      entity: "page",
      fields: ["id"],
      filters: { id },
    });

    if (!existingPages || existingPages.length === 0) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    // If slug is being updated, check if it's already in use by another page
    if (slug) {
      const { data: slugCheck } = await query.graph({
        entity: "page",
        fields: ["id", "slug"],
        filters: { slug },
      });

      if (slugCheck && slugCheck.length > 0 && slugCheck[0].id !== id) {
        return res.status(400).json({
          message: "A page with this slug already exists",
        });
      }
    }

    // Update the page
    const pageModule = req.scope.resolve("page") as any;
    const pageService = pageModule.service("page");

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined)
      updateData.meta_description = meta_description;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      if (is_published && !existingPages[0].published_at) {
        updateData.published_at = new Date();
      }
    }

    const page = await pageService.updatePages(id, updateData);

    res.json({
      page,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * DELETE /admin/pages/:id
 * Delete a page
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Check if page exists
    const { data: existingPages } = await query.graph({
      entity: "page",
      fields: ["id"],
      filters: { id },
    });

    if (!existingPages || existingPages.length === 0) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    // Delete the page
    const pageModule = req.scope.resolve("page") as any;
    const pageService = pageModule.service("page");

    await pageService.deletePages(id);

    res.status(200).json({
      id,
      deleted: true,
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
