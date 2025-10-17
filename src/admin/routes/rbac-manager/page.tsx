import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading } from "@medusajs/ui";
import { ShieldCheck } from "@medusajs/icons";

const RBACManagerPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8" />
          <div>
            <Heading level="h1">RBAC Manager</Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">
              Role-Based Access Control Management
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="/app/rbac-manager/role-management"
            className="border-ui-border-base hover:bg-ui-bg-subtle-hover rounded-lg border p-6 transition-colors"
          >
            <Heading level="h2" className="mb-2">
              Role Management
            </Heading>
            <p className="text-ui-fg-subtle text-sm">
              Create and manage user roles, assign permissions, and control
              access levels
            </p>
          </a>

          {/* <a
            href="/app/rbac-manager/resource-management"
            className="border-ui-border-base hover:bg-ui-bg-subtle-hover rounded-lg border p-6 transition-colors"
          >
            <Heading level="h2" className="mb-2">
              Resource Management
            </Heading>
            <p className="text-ui-fg-subtle text-sm">
              Define permission Resource Management and configure access
              controls for different entities
            </p>
          </a> */}

          {/* <a
            href="/app/rbac-manager/user-management"
            className="border-ui-border-base hover:bg-ui-bg-subtle-hover rounded-lg border p-6 transition-colors"
          >
            <Heading level="h2" className="mb-2">
              User Management
            </Heading>
            <p className="text-ui-fg-subtle text-sm">
              Manage users and assign roles for access control
            </p>
          </a> */}
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "RBAC Manager",
  icon: ShieldCheck,
});

export default RBACManagerPage;
