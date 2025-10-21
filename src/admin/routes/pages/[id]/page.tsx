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
import { useUserPermissions } from "../../../lib/use-permissions";
import { RestrictedAccess } from "../../../components/restricted-access";

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
  const { hasPermission, loading: permissionsLoading } = useUserPermissions();
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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({
    title: false,
    slug: false,
    content: false,
  });
  const [showErrors, setShowErrors] = useState(false);

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
    setShowErrors(true);

    // Validate required fields
    if (
      !formData.title.trim() ||
      !formData.slug.trim() ||
      !formData.content.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

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

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const shouldShowError = (fieldName: string, value: string) => {
    return (touchedFields[fieldName] || showErrors) && !value.trim();
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

  // Check if user has update permission
  if (permissionsLoading) {
    return <Container className="p-8">Loading...</Container>;
  }

  if (!hasPermission("pages", "update") && !hasPermission("pages", "view")) {
    return <RestrictedAccess resource="pages" action="update" />;
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
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => handleFieldBlur("title")}
                placeholder="e.g., About Us"
                className={
                  shouldShowError("title", formData.title)
                    ? "border-red-500"
                    : ""
                }
              />
              {shouldShowError("title", formData.title) && (
                <p className="mt-1 text-sm text-red-500">Title is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug" className="mb-2">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                onBlur={() => handleFieldBlur("slug")}
                placeholder="e.g., about-us"
                className={
                  shouldShowError("slug", formData.slug) ? "border-red-500" : ""
                }
              />
              {shouldShowError("slug", formData.slug) ? (
                <p className="mt-1 text-sm text-red-500">Slug is required</p>
              ) : (
                <p className="text-ui-fg-subtle mt-1 text-sm">
                  URL: /pages/{formData.slug || "your-slug"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="content" className="mb-2">
                Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                onBlur={() => handleFieldBlur("content")}
                rows={12}
                placeholder="Enter HTML content..."
                className={
                  shouldShowError("content", formData.content)
                    ? "border-red-500"
                    : ""
                }
              />
              {shouldShowError("content", formData.content) ? (
                <p className="mt-1 text-sm text-red-500">Content is required</p>
              ) : (
                <p className="text-ui-fg-subtle mt-1 text-sm">
                  You can use HTML tags for formatting
                </p>
              )}
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
