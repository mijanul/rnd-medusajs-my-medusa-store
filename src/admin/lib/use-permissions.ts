import { useEffect, useState } from "react";

/**
 * User permissions structure
 */
export interface UserPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserPermissions {
  user_id: string;
  roles: string[];
  permissions: UserPermission[];
  permissions_by_resource: Record<string, string[]>;
  has_permissions: boolean;
  is_super_admin: boolean;
  total_permissions: number;
}

/**
 * Hook to fetch and manage current user's permissions
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/admin/users/me/permissions", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      setPermissions(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
      setError(err.message);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific permission
   * @param resource - Resource name (e.g., "pages", "products") - case-insensitive
   * @param action - Action name (e.g., "view", "create", "update")
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissions) return false;

    // Super admin has all permissions
    if (permissions.is_super_admin) return true;

    // Case-insensitive resource lookup
    const resourceKey = Object.keys(permissions.permissions_by_resource).find(
      (key) => key.toLowerCase() === resource.toLowerCase()
    );

    if (!resourceKey) return false;

    const resourcePermissions =
      permissions.permissions_by_resource[resourceKey];
    if (!resourcePermissions) return false;

    // Check if user has the specific action or "all" action for this resource
    return (
      resourcePermissions.includes(action) ||
      resourcePermissions.includes("all")
    );
  };

  /**
   * Check if user has any permission for a resource
   * @param resource - Resource name - case-insensitive
   */
  const hasAnyPermission = (resource: string): boolean => {
    if (!permissions) return false;
    if (permissions.is_super_admin) return true;

    // Case-insensitive resource lookup
    const resourceKey = Object.keys(permissions.permissions_by_resource).find(
      (key) => key.toLowerCase() === resource.toLowerCase()
    );

    return !!resourceKey;
  };

  /**
   * Check if user has multiple permissions
   * @param checks - Array of [resource, action] tuples
   */
  const hasPermissions = (checks: [string, string][]): boolean => {
    return checks.every(([resource, action]) =>
      hasPermission(resource, action)
    );
  };

  /**
   * Check if user has at least one of multiple permissions
   * @param checks - Array of [resource, action] tuples
   */
  const hasAnyOfPermissions = (checks: [string, string][]): boolean => {
    return checks.some(([resource, action]) => hasPermission(resource, action));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasPermissions,
    hasAnyOfPermissions,
    isSuperAdmin: permissions?.is_super_admin || false,
    refetch: fetchPermissions,
  };
};

/**
 * Helper function to check permissions without hook (for use in non-component contexts)
 */
export const checkPermission = async (
  resource: string,
  action: string
): Promise<boolean> => {
  try {
    const response = await fetch("/admin/users/me/permissions", {
      credentials: "include",
    });

    if (!response.ok) return false;

    const data: UserPermissions = await response.json();

    // Super admin has all permissions
    if (data.is_super_admin) return true;

    // Case-insensitive resource lookup
    const resourceKey = Object.keys(data.permissions_by_resource).find(
      (key) => key.toLowerCase() === resource.toLowerCase()
    );

    if (!resourceKey) return false;

    const resourcePermissions = data.permissions_by_resource[resourceKey];
    if (!resourcePermissions) return false;

    return (
      resourcePermissions.includes(action) ||
      resourcePermissions.includes("all")
    );
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};
