import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Input,
  Label,
  Textarea,
  Button,
  toast,
  Checkbox,
  Table,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@medusajs/icons";

type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
};

const RoleCreatePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields },
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      is_active: true,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    fetchAllPermissions();
  }, []);

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setValue("name", value, { shouldDirty: true, shouldTouch: true });
    if (!getValues("slug")) {
      setValue("slug", generateSlug(value), { shouldDirty: true });
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

  const groupedPermissions = groupPermissionsByResource(allPermissions);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissionIds);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissionIds(newSelected);
  };

  const onSubmit = async (data: any) => {
    setSaving(true);

    try {
      const roleResponse = await fetch("/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!roleResponse.ok) {
        const error = await roleResponse.json();
        toast.error(error.message || "Failed to create role");
        setSaving(false);
        return;
      }

      const roleData = await roleResponse.json();
      const newRoleId = roleData.role.id;

      if (selectedPermissionIds.size > 0) {
        await fetch(`/admin/roles/${newRoleId}/permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            permission_ids: Array.from(selectedPermissionIds),
          }),
        });
      }

      toast.success("Role created successfully");
      navigate("/settings/role-management");
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-4 px-6 py-4">
        <Button
          variant="transparent"
          onClick={() => navigate("/settings/role-management")}
          size="small"
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Create Role</Heading>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8 px-6 py-8"
      >
        <div>
          <Heading level="h2" className="mb-4">
            Role Details
          </Heading>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div>
                <Label htmlFor="name" className="mb-2 flex items-center gap-1">
                  Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Content Manager"
                  {...register("name", {
                    required: "Name is required",
                    onChange: (e) => handleNameChange(e.target.value),
                  })}
                />
                {errors.name && (touchedFields.name || dirtyFields.name) && (
                  <span className="text-red-600 text-xs mt-1">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="slug" className="mb-2 flex items-center gap-1">
                  Slug <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="e.g., content-manager"
                  {...register("slug", { required: "Slug is required" })}
                />
                {errors.slug && (touchedFields.slug || dirtyFields.slug) && (
                  <span className="text-red-600 text-xs mt-1">
                    {errors.slug.message}
                  </span>
                )}
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={6}
                  {...register("description")}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <Heading level="h2">Permissions (Optional)</Heading>
            <p className="text-ui-fg-subtle text-sm">
              Select permissions to grant this role
            </p>
          </div>
          {allPermissions.length === 0 ? (
            <div className="text-ui-fg-subtle rounded-lg border py-8 text-center">
              No permissions available
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-ui-border-base">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell className="font-semibold">
                      Name
                    </Table.HeaderCell>
                    <Table.HeaderCell className="text-center w-20">
                      List
                    </Table.HeaderCell>
                    <Table.HeaderCell className="text-center w-20">
                      View
                    </Table.HeaderCell>
                    <Table.HeaderCell className="text-center w-20">
                      Create
                    </Table.HeaderCell>
                    <Table.HeaderCell className="text-center w-20">
                      Update
                    </Table.HeaderCell>
                    <Table.HeaderCell className="text-center w-20">
                      Delete
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Object.entries(groupedPermissions).map(
                    ([resource, perms]) => {
                      const actions = [
                        "list",
                        "view",
                        "create",
                        "update",
                        "delete",
                      ];
                      const permsByAction: Record<
                        string,
                        Permission | undefined
                      > = {};
                      perms.forEach((perm) => {
                        permsByAction[perm.action.toLowerCase()] = perm;
                      });

                      return (
                        <>
                          <Table.Row key={resource}>
                            <Table.Cell>
                              <div className="font-medium">{resource}</div>
                            </Table.Cell>
                            {actions.map((action) => {
                              const perm = permsByAction[action];
                              if (!perm) {
                                return (
                                  <Table.Cell
                                    key={action}
                                    className="text-center"
                                  >
                                    -
                                  </Table.Cell>
                                );
                              }
                              const isChecked = selectedPermissionIds.has(
                                perm.id
                              );
                              return (
                                <Table.Cell
                                  key={action}
                                  className="text-center"
                                >
                                  <div className="flex justify-center">
                                    <Checkbox
                                      id={perm.id}
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        handlePermissionToggle(perm.id)
                                      }
                                    />
                                  </div>
                                </Table.Cell>
                              );
                            })}
                          </Table.Row>
                          {perms.some((perm) =>
                            selectedPermissionIds.has(perm.id)
                          ) && (
                            <tr
                              key={`${resource}-desc`}
                              className="bg-ui-bg-subtle"
                            >
                              <td colSpan={6} className="px-4 py-3">
                                <div className="text-ui-fg-subtle text-sm">
                                  {perms
                                    .filter((perm) =>
                                      selectedPermissionIds.has(perm.id)
                                    )
                                    .map((perm, idx) => (
                                      <span key={perm.id}>
                                        {idx > 0 && " | "}
                                        <strong className="capitalize">
                                          {perm.action}:
                                        </strong>{" "}
                                        {perm.description || "No description"}
                                      </span>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    }
                  )}
                </Table.Body>
              </Table>
            </div>
          )}
        </div>

        <div className="border-t pt-6 flex items-center justify-between">
          <div className="text-ui-fg-subtle text-sm">
            {selectedPermissionIds.size > 0 && (
              <p>{selectedPermissionIds.size} permission(s) selected</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/settings/role-management")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {saving ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </div>
      </form>
    </Container>
  );
};

export const config = defineRouteConfig({ label: "Create Role" });
export default RoleCreatePage;
