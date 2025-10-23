import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DocumentText } from "@medusajs/icons";

type PageStats = {
  total: number;
  published: number;
  draft: number;
};

const PagesWidget = () => {
  const [stats, setStats] = useState<PageStats>({
    total: 0,
    published: 0,
    draft: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/admin/pages", {
        credentials: "include",
      });
      const data = await response.json();
      const pages = data.pages || [];

      setStats({
        total: pages.length,
        published: pages.filter((p: any) => p.is_published).length,
        draft: pages.filter((p: any) => !p.is_published).length,
      });
    } catch (error) {
      console.error("Error fetching page stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <DocumentText />
          <Heading level="h2">Pages Overview</Heading>
        </div>
        <Link
          to="/pages"
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm font-medium"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="px-6 py-8">
          <p className="text-ui-fg-subtle text-center">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 divide-x">
          <div className="flex flex-col items-center justify-center px-6 py-8">
            <p className="text-ui-fg-subtle mb-1 text-sm">Total Pages</p>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-8">
            <p className="text-ui-fg-subtle mb-1 text-sm">Published</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold">{stats.published}</p>
              <Badge color="green" size="small">
                Live
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center px-6 py-8">
            <p className="text-ui-fg-subtle mb-1 text-sm">Drafts</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold">{stats.draft}</p>
              <Badge color="grey" size="small">
                Draft
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

// export const config = defineWidgetConfig({
//   zone: "product.list.before",
// });

export default PagesWidget;
