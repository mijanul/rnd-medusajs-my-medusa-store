import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Input,
  Label,
  Textarea,
  Button,
  Switch,
  toast,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@medusajs/icons";

type PageData = {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  published_at: string | null;
};

const PageEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PageData>({
    id: "",
    title: "",
    slug: "",
    content: "",
    meta_title: "",
    meta_description: "",
    is_published: true,
    published_at: null,
  });

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/admin/pages/${id}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.page) {
        setFormData(data.page);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/admin/pages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          is_published: formData.is_published,
        }),
      });

      if (response.ok) {
        toast.success("Page updated successfully");
        navigate("/pages");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update page");
      }
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error("Failed to update page");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  if (loading) {
    return (
      <Container className="p-8">
        <div className="flex items-center justify-center">
          <p>Loading page...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/pages")}
          size="small"
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Edit Page</Heading>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="title" className="mb-2">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="e.g., About Us"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="mb-2">
                Slug *
              </Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                placeholder="e.g., about-us"
              />
              <p className="text-ui-fg-subtle mt-1 text-sm">
                URL: /pages/{formData.slug || "your-slug"}
              </p>
            </div>

            <div>
              <Label htmlFor="content" className="mb-2">
                Content *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={12}
                placeholder="Enter HTML content..."
              />
              <p className="text-ui-fg-subtle mt-1 text-sm">
                You can use HTML tags for formatting
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="meta_title" className="mb-2">
                Meta Title
              </Label>
              <Input
                id="meta_title"
                type="text"
                value={formData.meta_title}
                onChange={(e) =>
                  setFormData({ ...formData, meta_title: e.target.value })
                }
                placeholder="SEO title"
              />
            </div>

            <div>
              <Label htmlFor="meta_description" className="mb-2">
                Meta Description
              </Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meta_description: e.target.value,
                  })
                }
                rows={4}
                placeholder="SEO description"
              />
            </div>

            <div className="border-ui-border-base rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_published" className="font-medium">
                    Published
                  </Label>
                  <p className="text-ui-fg-subtle mt-1 text-sm">
                    Make this page visible to the public
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-ui-border-base flex items-center justify-end gap-2 border-t pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/pages")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Edit Page",
});

export default PageEditPage;
