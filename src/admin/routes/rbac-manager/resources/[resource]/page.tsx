import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  toast,
  Input,
  Label,
  Badge,
  IconButton,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash } from "@medusajs/icons";

type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
};

const EditResourcePage = () => {
  const { resource } = useParams<{ resource: string }>();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resource) {
      fetchPermissions();
    }
  }, [resource]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/admin/permission-resources/${resource}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        toast.error("Failed to load permissions");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = () => {
    setPermissions([
      ...permissions,
      {
        id: `temp-${Date.now()}`,
        name: `${resource}-`,
        resource: resource || "",
        action: "",
        description: "",
      },
    ]);
  };

  const handleRemovePermission = (index: number) => {
    const newPermissions = permissions.filter((_, i) => i !== index);
    setPermissions(newPermissions);
  };

  const handlePermissionChange = (
    index: number,
    field: keyof Permission,
    value: string
  ) => {
    const newPermissions = [...permissions];
    newPermissions[index] = {
      ...newPermissions[index],
      [field]: value,
    };

    // Auto-update name when action changes
    if (field === "action") {
      newPermissions[index].name = `${resource}-${value}`;
    }

    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    // Validation
    for (const perm of permissions) {
      if (!perm.action.trim()) {
        toast.error("All permissions must have an action");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`/admin/permission-resources/${resource}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        toast.success("Permissions updated successfully");
        navigate("/rbac-manager/resources");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p>Loading permissions...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/rbac-manager/resources")}
          className="mb-4"
          size="small"
        >
          <ArrowLeft />
          Back to Resources
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1" className="capitalize">
              Edit {resource} Permissions
            </Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">
              Manage actions available for the {resource} resource
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Heading level="h2">Permissions</Heading>
          <Button
            variant="secondary"
            onClick={handleAddPermission}
            size="small"
          >
            <Plus />
            Add Permission
          </Button>
        </div>

        <div className="space-y-4">
          {permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <p className="text-ui-fg-subtle mb-4">No permissions yet</p>
              <Button variant="secondary" onClick={handleAddPermission}>
                <Plus />
                Add First Permission
              </Button>
            </div>
          ) : (
            permissions.map((perm, index) => (
              <div
                key={perm.id}
                className="grid grid-cols-12 gap-4 rounded-lg border p-4"
              >
                <div className="col-span-3">
                  <Label htmlFor={`action-${index}`} className="mb-2">
                    Action *
                  </Label>
                  <Input
                    id={`action-${index}`}
                    type="text"
                    value={perm.action}
                    onChange={(e) =>
                      handlePermissionChange(index, "action", e.target.value)
                    }
                    placeholder="e.g., view, add, edit"
                    required
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor={`name-${index}`} className="mb-2">
                    Name (auto-generated)
                  </Label>
                  <Input
                    id={`name-${index}`}
                    type="text"
                    value={perm.name}
                    disabled
                    className="bg-ui-bg-subtle"
                  />
                </div>

                <div className="col-span-5">
                  <Label htmlFor={`description-${index}`} className="mb-2">
                    Description
                  </Label>
                  <Input
                    id={`description-${index}`}
                    type="text"
                    value={perm.description}
                    onChange={(e) =>
                      handlePermissionChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Optional description"
                  />
                </div>

                <div className="col-span-1 flex items-end justify-center">
                  <IconButton
                    variant="transparent"
                    onClick={() => handleRemovePermission(index)}
                    title="Remove permission"
                  >
                    <Trash className="text-ui-fg-error" />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>

        {permissions.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2">
              <Badge size="small" color="blue">
                {permissions.length} permission
                {permissions.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/rbac-manager/resources")}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Edit Resource",
});

export default EditResourcePage;
