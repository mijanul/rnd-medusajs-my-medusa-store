import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  toast,
  Input,
  IconButton,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { Plus, PencilSquare, Trash } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";

type Permission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  created_at: string;
  updated_at: string;
};

type ResourceGroup = {
  resource: string;
  permissions: Permission[];
  permissionCount: number;
};

const ResourcesListPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("/admin/permissions", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const permissions = data.permissions || [];

        // Group permissions by resource
        const resourceMap = new Map<string, ResourceGroup>();

        permissions.forEach((perm: Permission) => {
          if (!resourceMap.has(perm.resource)) {
            resourceMap.set(perm.resource, {
              resource: perm.resource,
              permissions: [],
              permissionCount: 0,
            });
          }
          const resourceData = resourceMap.get(perm.resource)!;
          resourceData.permissions.push(perm);
          resourceData.permissionCount = resourceData.permissions.length;
        });

        setResources(Array.from(resourceMap.values()));
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

  const handleEditResource = (resource: string) => {
    navigate(`/rbac-manager/resources/${resource}`);
  };

  const handleDeleteResource = async (resource: string) => {
    if (
      !confirm(
        `Are you sure you want to delete all permissions for "${resource}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/admin/permission-resources/${resource}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success(`Resource "${resource}" deleted successfully`);
        fetchResources();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete resource");
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const handleCreateResource = () => {
    navigate("/rbac-manager/resources/create");
  };

  const filteredResources = resources.filter((res) =>
    res.resource.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <p>Loading resources...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Resources</Heading>
          <p className="text-ui-fg-subtle mt-1 text-sm">
            Manage permissions grouped by resource categories
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateResource} size="small">
          <Plus />
          Create Resource
        </Button>
      </div>

      <div className="px-6 py-4">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search resources..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-ui-fg-subtle mb-4">
              No permission resources found
            </p>
            <Button variant="secondary" onClick={handleCreateResource}>
              Create your first resource
            </Button>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Resource</Table.HeaderCell>
                <Table.HeaderCell>Permissions</Table.HeaderCell>
                <Table.HeaderCell>Available Actions</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Actions
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredResources.map((res) => (
                <Table.Row key={res.resource}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Heading level="h3" className="capitalize">
                        {res.resource}
                      </Heading>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color="blue">
                      {res.permissionCount} permissions
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {res.permissions.slice(0, 5).map((perm) => (
                        <Badge key={perm.id} size="small" color="grey">
                          {perm.action}
                        </Badge>
                      ))}
                      {res.permissions.length > 5 && (
                        <Badge size="small" color="grey">
                          +{res.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        variant="transparent"
                        onClick={() => handleEditResource(res.resource)}
                        title="Edit resource permissions"
                      >
                        <PencilSquare />
                      </IconButton>
                      <IconButton
                        variant="transparent"
                        onClick={() => handleDeleteResource(res.resource)}
                        title="Delete resource"
                      >
                        <Trash className="text-ui-fg-error" />
                      </IconButton>
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
  label: "Resources",
});

export default ResourcesListPage;
