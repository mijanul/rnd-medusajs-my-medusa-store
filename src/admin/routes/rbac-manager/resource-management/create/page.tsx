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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash } from "@medusajs/icons";

type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
};

const CreateResourcePage = () => {
  const navigate = useNavigate();
  const [resourceName, setResourceName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: `temp-1`,
      name: "",
      resource: "",
      action: "",
      description: "",
    },
  ]);
  const [creating, setCreating] = useState(false);

  const handleResourceNameChange = (value: string) => {
    setResourceName(value);
    // Update all permission resource-management
    setPermissions(
      permissions.map((perm) => ({
        ...perm,
        resource: value,
        name: value && perm.action ? `${value}-${perm.action}` : "",
      }))
    );
  };

  const handleAddPermission = () => {
    setPermissions([
      ...permissions,
      {
        id: `temp-${Date.now()}`,
        name: resourceName ? `${resourceName}-` : "",
        resource: resourceName,
        action: "",
        description: "",
      },
    ]);
  };

  const handleRemovePermission = (index: number) => {
    if (permissions.length === 1) {
      toast.error("Resource must have at least one permission");
      return;
    }
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
      newPermissions[index].name = resourceName
        ? `${resourceName}-${value}`
        : "";
    }

    setPermissions(newPermissions);
  };

  const handleCreate = async () => {
    // Validation
    if (!resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    for (const perm of permissions) {
      if (!perm.action.trim()) {
        toast.error("All permissions must have an action");
        return;
      }
    }

    setCreating(true);

    try {
      const response = await fetch("/admin/permission-resource-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          resource: resourceName,
          permissions,
        }),
      });

      if (response.ok) {
        toast.success(`Resource "${resourceName}" created successfully`);
        navigate("/rbac-manager/resource-management");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create resource");
      }
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Failed to create resource");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/rbac-manager/resource-management")}
          className="mb-4"
          size="small"
        >
          <ArrowLeft />
          Back to Resource Management
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Create New Permission Resource</Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">
              Define a new resource category and its permissions
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-6">
          <Heading level="h2">Resource Details</Heading>
          <div className="mt-4 max-w-md">
            <Label htmlFor="resource-name" className="mb-2">
              Resource Name *
            </Label>
            <Input
              id="resource-name"
              type="text"
              value={resourceName}
              onChange={(e) => handleResourceNameChange(e.target.value)}
              placeholder="e.g., product, blog, customer"
              required
            />
            <p className="text-ui-fg-subtle mt-2 text-sm">
              Use lowercase, singular form (e.g., "product" not "Products")
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between border-t pt-6">
          <Heading level="h2">Permissions</Heading>
          <Button
            variant="secondary"
            onClick={handleAddPermission}
            size="small"
            disabled={!resourceName.trim()}
          >
            <Plus />
            Add Permission
          </Button>
        </div>

        <div className="space-y-4">
          {permissions.map((perm, index) => (
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
                  disabled={!resourceName.trim()}
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
                    handlePermissionChange(index, "description", e.target.value)
                  }
                  placeholder="Optional description"
                  disabled={!resourceName.trim()}
                />
              </div>

              <div className="col-span-1 flex items-end justify-center">
                <IconButton
                  variant="transparent"
                  onClick={() => handleRemovePermission(index)}
                  title="Remove permission"
                  disabled={permissions.length === 1}
                >
                  <Trash
                    className={
                      permissions.length === 1
                        ? "text-ui-fg-disabled"
                        : "text-ui-fg-error"
                    }
                  />
                </IconButton>
              </div>
            </div>
          ))}
        </div>

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
              onClick={() => navigate("/rbac-manager/resource-management")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={creating}
              disabled={!resourceName.trim() || permissions.length === 0}
            >
              Create Resource
            </Button>
          </div>
        </div>

        <div className="bg-ui-bg-subtle mt-6 rounded-lg p-4">
          <Heading level="h3" className="mb-2">
            💡 Common Actions
          </Heading>
          <p className="text-ui-fg-subtle mb-2 text-sm">
            Here are some common permission actions you might want to add:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge size="small" color="grey">
              view
            </Badge>
            <Badge size="small" color="grey">
              add
            </Badge>
            <Badge size="small" color="grey">
              edit
            </Badge>
            <Badge size="small" color="grey">
              delete
            </Badge>
            <Badge size="small" color="grey">
              all
            </Badge>
            <Badge size="small" color="grey">
              publish
            </Badge>
            <Badge size="small" color="grey">
              manage
            </Badge>
          </div>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Create Resource",
});

export default CreateResourcePage;
