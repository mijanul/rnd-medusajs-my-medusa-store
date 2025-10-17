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
  const [resourceNameError, setResourceNameError] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [creating, setCreating] = useState(false);
  const [touched, setTouched] = useState(false);

  const validateResourceName = (name: string) => {
    if (!name.trim()) {
      setResourceNameError("Resource name is required");
      return false;
    }

    const regex = /^[a-z0-9_-]+$/i;
    if (!regex.test(name)) {
      setResourceNameError(
        "Resource name can only contain letters, numbers, hyphens, and underscores"
      );
      return false;
    }

    setResourceNameError("");
    return true;
  };

  const handleResourceNameChange = (value: string) => {
    setResourceName(value);
    setTouched(true);
    validateResourceName(value);

    // Update all permission names when resource name changes
    if (permissions.length > 0) {
      const updatedPermissions = permissions.map((perm) => ({
        ...perm,
        resource: value.trim(),
        name: perm.action
          ? `${value.trim()}-${perm.action}`
          : `${value.trim()}-`,
      }));
      setPermissions(updatedPermissions);
    }
  };

  const handleAddPermission = () => {
    setPermissions([
      ...permissions,
      {
        id: `temp-${Date.now()}`,
        name: resourceName ? `${resourceName}-` : "",
        resource: resourceName || "",
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
    if (field === "action" && resourceName) {
      newPermissions[index].name = `${resourceName}-${value}`;
    }

    setPermissions(newPermissions);
  };

  const handleCreate = async () => {
    if (!validateResourceName(resourceName)) {
      return;
    }

    // Validation
    if (permissions.length === 0) {
      toast.error("At least one permission must be added");
      return;
    }

    for (const perm of permissions) {
      if (!perm.action.trim()) {
        toast.error("All permissions must have an action");
        return;
      }
    }

    // Check for duplicates
    const actions = permissions.map((p) => p.action.toLowerCase());
    const uniqueActions = new Set(actions);
    if (actions.length !== uniqueActions.size) {
      toast.error("Duplicate actions are not allowed");
      return;
    }

    setCreating(true);

    try {
      const actionsData = permissions.map((p) => ({
        action: p.action.trim(),
        description:
          p.description || `${p.action} permission for ${resourceName}`,
      }));

      const response = await fetch("/admin/permission-resource-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          resource: resourceName.trim(),
          actions: actionsData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          data.message || `Resource "${resourceName}" created successfully`
        );
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
            <Heading level="h1">Create New Resource</Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">
              Define a new resource and select the permissions users can have
              for it
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-8">
          <Heading level="h2" className="mb-4">
            Resource Details
          </Heading>
          <div className="max-w-md">
            <Label
              htmlFor="resource-name"
              className="mb-2 flex items-center gap-1"
            >
              Resource Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="resource-name"
              type="text"
              value={resourceName}
              onChange={(e) => handleResourceNameChange(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g., product, blog, customer"
              className={
                resourceNameError && touched
                  ? "border-red-600 focus:border-red-600"
                  : ""
              }
            />
            {resourceNameError && touched && (
              <p className="text-red-600 text-xs mt-1">{resourceNameError}</p>
            )}
            <p className="text-ui-fg-subtle mt-2 text-xs">
              Only letters, numbers, hyphens, and underscores allowed.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <Heading level="h2">Permissions</Heading>
          <Button
            variant="secondary"
            onClick={handleAddPermission}
            size="small"
            disabled={!resourceName.trim() || resourceNameError !== ""}
          >
            <Plus />
            Add Permission
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          {permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <p className="text-ui-fg-subtle mb-4">
                No permissions yet. Add your first permission.
              </p>
              <Button
                variant="secondary"
                onClick={handleAddPermission}
                disabled={!resourceName.trim() || resourceNameError !== ""}
              >
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
                    placeholder="e.g., list, view, create"
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
          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2">
              <Badge size="small" color="blue">
                {permissions.length} permission
                {permissions.length !== 1 ? "s" : ""}
              </Badge>
              {resourceName && (
                <Badge size="small" color="purple">
                  Resource: {resourceName}
                </Badge>
              )}
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
                disabled={
                  !resourceName.trim() ||
                  resourceNameError !== "" ||
                  permissions.length === 0
                }
              >
                Create Resource
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

// export const config = defineRouteConfig({
//   label: "Create Resource",
// });

export default CreateResourcePage;
