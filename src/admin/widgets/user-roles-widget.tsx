import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  Badge,
  toast,
  Checkbox,
  Label,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { PencilSquare, XMark, Check } from "@medusajs/icons";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

const UserRolesWidget = ({ data }: { data: any }) => {
  const userId = data?.id;
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (userId) {
      fetchUserRoles();
      fetchAllRoles();
    }
  }, [userId]);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch(`/admin/users/${userId}/roles`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.roles || []);
        const roleIds = new Set<string>(
          data.roles?.map((r: Role) => r.id) || []
        );
        setSelectedRoleIds(roleIds);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const response = await fetch("/admin/roles", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAllRoles(data.roles?.filter((r: Role) => r.is_active) || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    const newSelected = new Set(selectedRoleIds);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoleIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/admin/users/${userId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          role_ids: Array.from(selectedRoleIds),
        }),
      });

      if (response.ok) {
        toast.success("User roles updated successfully");
        setEditing(false);
        fetchUserRoles();
      } else {
        toast.error("Failed to update user roles");
      }
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast.error("Failed to update user roles");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    const roleIds = new Set(userRoles.map((r) => r.id));
    setSelectedRoleIds(roleIds);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-6">
          <p className="text-ui-fg-subtle text-sm">Loading roles...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Roles</Heading>
        {!editing ? (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setEditing(true)}
          >
            <PencilSquare />
            Edit Roles
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleCancel}
              disabled={saving}
            >
              <XMark />
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              isLoading={saving}
            >
              <Check />
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        {!editing ? (
          // View Mode
          <div>
            {userRoles.length === 0 ? (
              <div className="text-ui-fg-subtle py-4 text-center text-sm">
                No roles assigned
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <Badge key={role.id} size="small" color="blue">
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-3">
            {allRoles.length === 0 ? (
              <div className="text-ui-fg-subtle py-4 text-center text-sm">
                No roles available
              </div>
            ) : (
              allRoles.map((role) => (
                <div
                  key={role.id}
                  className="border-ui-border-base flex items-start gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.has(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="cursor-pointer font-medium"
                    >
                      {role.name}
                    </Label>
                    {role.description && (
                      <p className="text-ui-fg-subtle mt-1 text-sm">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "user.details.after",
});

export default UserRolesWidget;
