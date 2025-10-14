import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/pages/:id
 * Fetch a single page by ID
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id;

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
 * PATCH /admin/pages/:id
 * Update a page
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id || (req.params as any)["0"];
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
      fields: ["id", "published_at"],
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

    const pageService = req.scope.resolve("page") as any;

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

    const page = await pageService.updatePages({ id, ...updateData });

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
 * Soft delete a page by setting deleted_at timestamp
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Check if page exists and is not already deleted
    const { data: existingPages } = await query.graph({
      entity: "page",
      fields: ["id", "deleted_at", "is_published"],
      filters: { id },
    });

    if (!existingPages || existingPages.length === 0) {
      return res.status(404).json({
        message: "Page not found",
      });
    }

    if (existingPages[0].deleted_at) {
      return res.status(400).json({
        message: "Page is already deleted",
      });
    }

    const pageService = req.scope.resolve("page") as any;

    // Soft delete by setting deleted_at to current timestamp
    await pageService.updatePages({
      id,
      is_published: false,
      deleted_at: new Date(),
    });

    res.status(200).json({
      id,
      deleted: true,
      deleted_at: new Date(),
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
