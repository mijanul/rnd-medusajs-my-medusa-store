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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@medusajs/icons";

const RoleCreatePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Role created successfully");
        navigate("/rbac-manager/role-management");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/rbac-manager/role-management")}
          size="small"
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Create Role</Heading>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="name" className="mb-2">
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="e.g., Content Manager"
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
                placeholder="e.g., content-manager"
              />
              <p className="text-ui-fg-subtle mt-1 text-sm">
                URL-friendly identifier for the role
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                placeholder="Describe the purpose of this role..."
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <div className="border-ui-border-base rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active" className="font-medium">
                    Active
                  </Label>
                  <p className="text-ui-fg-subtle mt-1 text-sm">
                    Enable this role immediately after creation
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>

            <div className="border-ui-border-base rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Quick Tips</h3>
                <ul className="text-ui-fg-subtle mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Name will auto-generate a slug</li>
                  <li>Assign permissions after creation</li>
                  <li>Use descriptive names for clarity</li>
                  <li>Inactive roles can't be assigned</li>
                </ul>
              </div>
            </div>

            <div className="border-ui-border-base rounded-lg border bg-ui-bg-subtle p-4">
              <div>
                <h3 className="font-medium">Next Steps</h3>
                <p className="text-ui-fg-subtle mt-2 text-sm">
                  After creating the role, you'll be able to assign permissions
                  and manage user assignments from the role detail page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-ui-border-base flex items-center justify-end gap-2 border-t pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/rbac-manager/role-management")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {saving ? "Creating..." : "Create Role"}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Create Role",
});

export default RoleCreatePage;
