import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading } from "@medusajs/ui";
import { ShieldCheck, Users, Key } from "@medusajs/icons";
import { useNavigate } from "react-router-dom";

const RoleManagementSettingsWidget = () => {
  const navigate = useNavigate();

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Access Control</Heading>
        <p className="text-ui-fg-subtle mt-1 text-sm">
          Manage roles, permissions, and user access
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-3">
        <button
          onClick={() => navigate("/settings/role-management")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-3 rounded-lg border p-6 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-ui-bg-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <ShieldCheck className="text-ui-fg-base h-5 w-5" />
            </div>
            <div>
              <h3 className="text-ui-fg-base font-medium">Role Management</h3>
              <p className="text-ui-fg-subtle text-xs">
                Create and manage roles with custom permissions
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/team")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-3 rounded-lg border p-6 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-ui-bg-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <Users className="text-ui-fg-base h-5 w-5" />
            </div>
            <div>
              <h3 className="text-ui-fg-base font-medium">Team Members</h3>
              <p className="text-ui-fg-subtle text-xs">
                Assign roles to team members
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/role-management")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-3 rounded-lg border p-6 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="bg-ui-bg-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <Key className="text-ui-fg-base h-5 w-5" />
            </div>
            <div>
              <h3 className="text-ui-fg-base font-medium">Permissions</h3>
              <p className="text-ui-fg-subtle text-xs">
                View and configure available permissions
              </p>
            </div>
          </div>
        </button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.list.after",
});

export default RoleManagementSettingsWidget;
