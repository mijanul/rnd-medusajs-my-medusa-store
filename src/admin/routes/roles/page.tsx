import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, Table, Badge, toast } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquare, Trash, Plus } from "@medusajs/icons";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const RolesListPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/admin/roles", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        toast.error("Failed to load roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/roles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Role deleted successfully");
        fetchRoles();
      } else {
        toast.error("Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p>Loading roles...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Roles</Heading>
        <Button
          variant="primary"
          onClick={() => navigate("/roles/create")}
          size="small"
        >
          <Plus />
          Create Role
        </Button>
      </div>

      <div className="px-6 py-4">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-ui-fg-subtle mb-4">No roles found</p>
            <Button
              variant="secondary"
              onClick={() => navigate("/roles/create")}
            >
              Create your first role
            </Button>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Slug</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Actions
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {roles.map((role) => (
                <Table.Row
                  key={role.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle-hover"
                  onClick={() => navigate(`/roles/${role.id}`)}
                >
                  <Table.Cell>
                    <span className="font-medium">{role.name}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-ui-fg-subtle rounded bg-ui-bg-subtle px-2 py-1 text-sm">
                      {role.slug}
                    </code>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-ui-fg-subtle">
                      {role.description || "No description"}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={role.is_active ? "green" : "grey"}
                      size="small"
                    >
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/roles/${role.id}`);
                        }}
                      >
                        <PencilSquare />
                      </Button>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(role.id, role.name);
                        }}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Roles",
});

export default RolesListPage;
