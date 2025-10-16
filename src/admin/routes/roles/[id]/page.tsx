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
  Checkbox,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "@medusajs/icons";

type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

const RoleDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchRoleData();
    fetchAllPermissions();
  }, [id]);

  const fetchRoleData = async () => {
    try {
      const response = await fetch(`/admin/roles/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setRole(data.role);
        setFormData({
          name: data.role.name,
          slug: data.role.slug,
          description: data.role.description || "",
          is_active: data.role.is_active,
        });

        const permIds = new Set<string>(
          data.permissions?.map((p: Permission) => p.id) || []
        );
        setSelectedPermissionIds(permIds);
      } else {
        toast.error("Failed to load role");
        navigate("/roles");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      toast.error("Failed to load role");
      navigate("/roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const response = await fetch("/admin/permissions", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAllPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/admin/roles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Role updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissionIds);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissionIds(newSelected);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/admin/roles/${id}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          permission_ids: Array.from(selectedPermissionIds),
        }),
      });

      if (response.ok) {
        toast.success("Permissions updated successfully");
        fetchRoleData();
      } else {
        toast.error("Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const groupPermissionsByResource = (permissions: Permission[]) => {
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p>Loading role...</p>
        </div>
      </Container>
    );
  }

  const groupedPermissions = groupPermissionsByResource(allPermissions);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/roles")}
          size="small"
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Edit Role: {role?.name}</Heading>
      </div>

      <div className="flex flex-col gap-8 px-6 py-8">
        {/* Role Details Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <Heading level="h2" className="mb-4">
              Role Details
            </Heading>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <Label htmlFor="name" className="mb-2">
                  Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="description" className="mb-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe this role..."
                />
              </div>

              <div className="border-ui-border-base rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active" className="font-medium">
                      Active
                    </Label>
                    <p className="text-ui-fg-subtle mt-1 text-sm">
                      Enable or disable this role
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
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/roles")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {saving ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </form>

        {/* Permissions Section */}
        <div className="border-ui-border-base border-t pt-8">
          <div className="mb-4 flex items-center justify-between">
            <Heading level="h2">Permissions</Heading>
            <Button
              variant="primary"
              size="small"
              onClick={handleSavePermissions}
              isLoading={saving}
            >
              Save Permissions
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div
                key={resource}
                className="border-ui-border-base rounded-lg border p-4"
              >
                <h3 className="mb-3 font-semibold capitalize">{resource}</h3>
                <div className="flex flex-col gap-3">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-start gap-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissionIds.has(perm.id)}
                        onCheckedChange={() => handlePermissionToggle(perm.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={perm.id}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {perm.action}
                        </Label>
                        {perm.description && (
                          <p className="text-ui-fg-subtle mt-1 text-xs">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {allPermissions.length === 0 && (
            <div className="text-ui-fg-subtle py-8 text-center">
              No permissions available
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Edit Role",
});

export default RoleDetailPage;
