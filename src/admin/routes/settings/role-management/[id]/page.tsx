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

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, touchedFields },
    reset,
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
        reset({
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
        navigate("/settings/role-management");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      toast.error("Failed to load role");
      navigate("/settings/role-management");
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

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await fetch(`/admin/roles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Role updated successfully");
        // Update local role state
        if (role) {
          setRole({ ...role, ...data });
        }
        // Refetch to ensure we have the latest data
        fetchRoleData();
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
          onClick={() => navigate("/settings/role-management")}
          size="small"
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Edit Role: {role?.name}</Heading>
      </div>

      <div className="flex flex-col gap-8 px-6 py-8">
        {/* Role Details Form */}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div>
            <Heading level="h2" className="mb-4">
              Role Details
            </Heading>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <Label htmlFor="name" className="mb-2 flex items-center gap-1">
                  Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Content Manager"
                  {...register("name", { required: "Name is required" })}
                  className={
                    errors.name && (touchedFields.name || dirtyFields.name)
                      ? "border-red-600 focus:border-red-600"
                      : ""
                  }
                />
                {errors.name && (touchedFields.name || dirtyFields.name) && (
                  <span className="text-red-600 text-xs mt-1 block">
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
                  className={
                    errors.slug && (touchedFields.slug || dirtyFields.slug)
                      ? "border-red-600 focus:border-red-600"
                      : ""
                  }
                />
                {errors.slug && (touchedFields.slug || dirtyFields.slug) && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.slug.message}
                  </span>
                )}
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="description" className="mb-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Describe this role..."
                  {...register("description")}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/settings/role-management")}
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Heading level="h2">Permissions</Heading>
              <p className="text-ui-fg-subtle mt-1 text-sm">
                Select permissions to grant this role access to specific actions
              </p>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleSavePermissions}
              isLoading={saving}
            >
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>

          {allPermissions.length === 0 ? (
            <div className="text-ui-fg-subtle rounded-lg border border-ui-border-base bg-ui-bg-subtle py-12 text-center">
              <p>No permissions available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, perms]) => {
                const actions = ["list", "view", "create", "update", "delete"];
                const permsByAction: Record<string, Permission | undefined> =
                  {};
                perms.forEach((perm) => {
                  permsByAction[perm.action.toLowerCase()] = perm;
                });

                return (
                  <div
                    key={resource}
                    className="overflow-hidden rounded-lg border border-ui-border-base"
                  >
                    {/* Permissions Table */}
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
                        <Table.Row>
                          <Table.Cell>
                            <div className="font-medium capitalize">
                              {resource}
                            </div>
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
                              <Table.Cell key={action} className="text-center">
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
                      </Table.Body>
                      <tbody>
                        {perms.some((perm) =>
                          selectedPermissionIds.has(perm.id)
                        ) && (
                          <tr className="bg-ui-bg-subtle">
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
                      </tbody>
                    </Table>
                  </div>
                );
              })}
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
