import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui";
import {
  PencilSquare,
  Trash,
  Plus,
  EyeSlash,
  Eye,
  ArrowPathMini,
} from "@medusajs/icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserPermissions } from "../../lib/use-permissions";
import { RestrictedAccess } from "../../components/restricted-access";

// ++ Test comment
type Page = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const PagesListPage = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission, loading: permissionsLoading } = useUserPermissions();

  // Check if user has view permission
  if (permissionsLoading) {
    return <Container className="p-8">Loading...</Container>;
  }

  if (!hasPermission("pages", "list") && !hasPermission("pages", "view")) {
    return <RestrictedAccess resource="pages" action="view" />;
  }

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch("/admin/pages", {
        credentials: "include",
      });
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/pages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchPages();
      } else {
        alert("Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Failed to delete page");
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure you want to restore this page?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/pages/${id}/restore`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchPages();
      } else {
        alert("Failed to restore page");
      }
    } catch (error) {
      console.error("Error restoring page:", error);
      alert("Failed to restore page");
    }
  };

  if (loading) {
    return (
      <Container className="p-8">
        <div className="flex items-center justify-center">
          <p>Loading pages...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Pages</Heading>
        {hasPermission("pages", "create") && (
          <Link to="/pages/create">
            <Button variant="primary">
              <Plus /> Create Page
            </Button>
          </Link>
        )}
      </div>

      <div className="px-6 py-4">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-ui-fg-subtle mb-4">No pages created yet</p>
            {hasPermission("pages", "create") && (
              <Link to="/pages/create">
                <Button variant="primary">
                  <Plus /> Create Your First Page
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Slug</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Published</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Actions
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pages.map((page) => (
                <Table.Row key={page.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      {page.is_published ? (
                        <Eye className="text-ui-fg-subtle" />
                      ) : (
                        <EyeSlash className="text-ui-fg-subtle" />
                      )}
                      {page.title}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-sm">{page.slug}</code>
                  </Table.Cell>
                  <Table.Cell>
                    {page.deleted_at ? (
                      <Badge color="red">Deleted</Badge>
                    ) : page.is_published ? (
                      <Badge color="green">Published</Badge>
                    ) : (
                      <Badge color="grey">Draft</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {page.published_at && page.is_published && !page.deleted_at
                      ? new Date(page.published_at).toLocaleDateString()
                      : "-"}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {page.deleted_at ? (
                      hasPermission("pages", "update") && (
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => handleRestore(page.id)}
                        >
                          <ArrowPathMini />
                        </Button>
                      )
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("pages", "update") && (
                          <Link to={`/pages/${page.id}`}>
                            <Button variant="transparent" size="small">
                              <PencilSquare />
                            </Button>
                          </Link>
                        )}
                        {hasPermission("pages", "delete") && (
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={() => handleDelete(page.id, page.title)}
                          >
                            <Trash className="text-ui-fg-error" />
                          </Button>
                        )}
                      </div>
                    )}
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
  label: "Pages",
  icon: Plus,
});

export default PagesListPage;
