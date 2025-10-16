import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  toast,
  Input,
  Label,
  Badge,
  Checkbox,
} from "@medusajs/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, InformationCircleSolid } from "@medusajs/icons";

const STANDARD_ACTIONS = [
  { action: "list", description: "View list of items", order: 1 },
  { action: "view", description: "View item details", order: 2 },
  { action: "create", description: "Create new items", order: 3 },
  { action: "edit", description: "Edit existing items", order: 4 },
  { action: "delete", description: "Delete items", order: 5 },
];

type ActionData = {
  action: string;
  description: string;
  enabled: boolean;
  isStandard: boolean;
};

const CreateResourcePage = () => {
  const navigate = useNavigate();
  const [resourceName, setResourceName] = useState("");
  const [resourceNameError, setResourceNameError] = useState("");
  const [standardActions, setStandardActions] = useState<ActionData[]>(
    STANDARD_ACTIONS.map((a) => ({
      ...a,
      enabled: true,
      isStandard: true,
    }))
  );
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
  };

  const handleStandardActionToggle = (index: number) => {
    const updated = [...standardActions];
    updated[index].enabled = !updated[index].enabled;
    setStandardActions(updated);
  };

  const handleStandardDescriptionChange = (
    index: number,
    description: string
  ) => {
    const updated = [...standardActions];
    updated[index].description = description;
    setStandardActions(updated);
  };

  const handleCreate = async () => {
    if (!validateResourceName(resourceName)) {
      return;
    }

    const actions: Array<{ action: string; description: string }> = [];

    standardActions.forEach((a) => {
      if (a.enabled) {
        actions.push({
          action: a.action,
          description:
            a.description || `${a.action} permission for ${resourceName}`,
        });
      }
    });

    if (actions.length === 0) {
      toast.error("At least one action must be enabled or added");
      return;
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
          resource: resourceName.trim(),
          actions,
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

  const enabledCount = standardActions.filter((a) => a.enabled).length;

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

        <div className="mb-8">
          <div className="mb-4">
            <Heading level="h2" className="mb-1">
              Standard Permissions
            </Heading>
            <p className="text-ui-fg-subtle text-sm">
              Select the standard CRUD operations for this resource.
            </p>
          </div>

          <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-3">
            {standardActions.map((action, index) => (
              <div
                key={action.action}
                className="flex items-start gap-3 p-3 bg-ui-bg-base rounded-md"
              >
                <Checkbox
                  id={`standard-${action.action}`}
                  checked={action.enabled}
                  onCheckedChange={() => handleStandardActionToggle(index)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`standard-${action.action}`}
                    className="cursor-pointer font-medium capitalize mb-1"
                  >
                    {action.action}
                  </Label>
                  <Input
                    type="text"
                    value={action.description}
                    onChange={(e) =>
                      handleStandardDescriptionChange(index, e.target.value)
                    }
                    placeholder={`Description for ${action.action}`}
                    disabled={!action.enabled}
                    className="mt-1 text-sm"
                  />
                </div>
                <Badge
                  size="small"
                  color={action.enabled ? "green" : "grey"}
                  className="mt-1"
                >
                  {action.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-ui-bg-subtle-hover rounded-lg p-4 mb-6 flex gap-3">
          <InformationCircleSolid className="text-ui-fg-muted flex-shrink-0" />
          <div>
            <p className="text-sm font-medium mb-1">Best Practices</p>
            <ul className="text-ui-fg-subtle text-xs space-y-1">
              <li>
                • Select the appropriate permissions for your resource type
              </li>
              <li>• Use all 5 standard permissions for full CRUD operations</li>
              <li>• For read-only resources, select only "list" and "view"</li>
              <li>
                • Provide clear descriptions to help administrators understand
                each permission
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex items-center gap-2">
            <Badge size="small" color="blue">
              {enabledCount} permission{enabledCount !== 1 ? "s" : ""} selected
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
                enabledCount === 0
              }
            >
              Create Resource
            </Button>
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
