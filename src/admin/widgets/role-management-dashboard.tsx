import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Badge } from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ShieldCheck, Key } from "@medusajs/icons";

type Stats = {
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
};

const RoleManagementWidget = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRoles: 0,
    activeRoles: 0,
    totalPermissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/admin/roles", { credentials: "include" }),
        fetch("/admin/permissions", { credentials: "include" }),
      ]);

      if (rolesRes.ok && permsRes.ok) {
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();

        const roles = rolesData.roles || [];
        setStats({
          totalRoles: roles.length,
          activeRoles: roles.filter((r: any) => r.is_active).length,
          totalPermissions: permsData.permissions?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-6">
          <p className="text-ui-fg-subtle text-sm">Loading...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Role Management</Heading>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-3">
        <button
          onClick={() => navigate("/roles")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="bg-ui-bg-subtle flex h-8 w-8 items-center justify-center rounded-lg">
              <ShieldCheck className="text-ui-fg-subtle" />
            </div>
            <span className="text-ui-fg-subtle text-sm">Total Roles</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold">{stats.totalRoles}</span>
            <Badge size="small" color="green">
              {stats.activeRoles} active
            </Badge>
          </div>
        </button>

        <button
          onClick={() => navigate("/permissions")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="bg-ui-bg-subtle flex h-8 w-8 items-center justify-center rounded-lg">
              <Key className="text-ui-fg-subtle" />
            </div>
            <span className="text-ui-fg-subtle text-sm">Permissions</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold">
              {stats.totalPermissions}
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate("/settings/team")}
          className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="bg-ui-bg-subtle flex h-8 w-8 items-center justify-center rounded-lg">
              <Users className="text-ui-fg-subtle" />
            </div>
            <span className="text-ui-fg-subtle text-sm">Manage Users</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm">Assign roles to team members</span>
          </div>
        </button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.list.after",
});

export default RoleManagementWidget;
