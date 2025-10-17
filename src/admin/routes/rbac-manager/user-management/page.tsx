import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  toast,
  Table,
  Badge,
  Checkbox,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { EllipsisHorizontal, PencilSquare, Users } from "@medusajs/icons";

type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  created_at: string;
};

type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
};

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersResponse = await fetch("/admin/users", {
        credentials: "include",
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch roles
      const rolesResponse = await fetch("/admin/roles", {
        credentials: "include",
      });

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      // Fetch user roles
      await fetchAllUserRoles();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUserRoles = async () => {
    try {
      const response = await fetch("/admin/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];

        // Fetch roles for each user
        const userRolesMap: Record<string, string[]> = {};

        for (const user of users) {
          const rolesResponse = await fetch(`/admin/users/${user.id}/roles`, {
            credentials: "include",
          });

          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            userRolesMap[user.id] = (rolesData.roles || []).map(
              (r: Role) => r.id
            );
          }
        }

        setUserRoles(userRolesMap);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const handleManageRoles = async (userId: string) => {
    setCurrentUserId(userId);

    // Fetch current roles for this user
    try {
      const response = await fetch(`/admin/users/${userId}/roles`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const roleIds = (data.roles || []).map((r: Role) => r.id);
        setSelectedRoleIds(roleIds);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setSelectedRoleIds([]);
    }

    setShowRoleModal(true);
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSaveRoles = async () => {
    if (!currentUserId) return;

    setSaving(true);
    try {
      const response = await fetch(`/admin/users/${currentUserId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          role_ids: selectedRoleIds,
        }),
      });

      if (response.ok) {
        toast.success("Roles updated successfully");
        await fetchAllUserRoles();
        setShowRoleModal(false);
        setCurrentUserId(null);
        setSelectedRoleIds([]);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update roles");
      }
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Failed to update roles");
    } finally {
      setSaving(false);
    }
  };

  const getUserRoleNames = (userId: string) => {
    const roleIds = userRoles[userId] || [];
    return roles
      .filter((role) => roleIds.includes(role.id))
      .map((role) => role.name);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p>Loading users...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h1">User Management</Heading>
              <p className="text-ui-fg-subtle mt-1 text-sm">
                Manage users and assign roles for access control
              </p>
            </div>
            <Button variant="secondary" onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="px-6 py-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <Users className="text-ui-fg-subtle mb-4" />
              <p className="text-ui-fg-subtle mb-2 font-medium">
                No users found
              </p>
              <p className="text-ui-fg-muted text-sm">
                Users will appear here once they are created
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-ui-fg-subtle text-sm">
                  {users.length} user{users.length !== 1 ? "s" : ""} total
                  {selectedUsers.size > 0 && (
                    <span className="ml-2">
                      ({selectedUsers.size} selected)
                    </span>
                  )}
                </p>
              </div>

              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell className="w-12">
                      <Checkbox
                        checked={
                          selectedUsers.size === users.length &&
                          users.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </Table.HeaderCell>
                    <Table.HeaderCell>Email</Table.HeaderCell>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Roles</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
                    <Table.HeaderCell className="w-12"></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => {
                    const userRoleNames = getUserRoleNames(user.id);
                    return (
                      <Table.Row key={user.id}>
                        <Table.Cell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                          />
                        </Table.Cell>
                        <Table.Cell className="font-medium">
                          {user.email}
                        </Table.Cell>
                        <Table.Cell>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ""} ${
                                user.last_name || ""
                              }`.trim()
                            : "-"}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-wrap gap-1">
                            {userRoleNames.length > 0 ? (
                              userRoleNames.map((roleName, idx) => (
                                <Badge key={idx} size="small" color="blue">
                                  {roleName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-ui-fg-subtle text-sm">
                                No roles assigned
                              </span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </Table.Cell>
                        <Table.Cell>
                          <DropdownMenu>
                            <DropdownMenu.Trigger asChild>
                              <IconButton variant="transparent">
                                <EllipsisHorizontal />
                              </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                              <DropdownMenu.Item
                                onClick={() => handleManageRoles(user.id)}
                              >
                                <PencilSquare className="mr-2" />
                                Manage Roles
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          )}
        </div>
      </Container>

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-ui-bg-base w-full max-w-lg rounded-lg p-6 shadow-lg">
            <Heading level="h2" className="mb-4">
              Assign Roles
            </Heading>
            <p className="text-ui-fg-subtle mb-6 text-sm">
              Select one or more roles to assign to this user
            </p>

            <div className="mb-6 space-y-3 max-h-96 overflow-y-auto">
              {roles
                .filter((r) => r.is_active)
                .map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`role-${role.id}`}
                        className="cursor-pointer font-medium"
                      >
                        {role.name}
                      </label>
                      {role.description && (
                        <p className="text-ui-fg-subtle mt-1 text-xs">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRoleModal(false);
                  setCurrentUserId(null);
                  setSelectedRoleIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveRoles}
                isLoading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// export const config = defineRouteConfig({
//   label: "User Management",
//   icon: Users,
// });

export default UserManagementPage;
