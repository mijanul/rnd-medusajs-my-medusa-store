/**
 * Menu Configuration with Permission-based Visibility
 *
 * This module provides utilities to check user permissions and
 * conditionally hide menu items based on those permissions.
 */

import { useEffect, useState } from "react";

/**
 * Fetch current user's permissions from dedicated endpoint
 */
async function fetchUserPermissions(): Promise<string[]> {
  try {
    console.log(
      "🔄 Fetching user permissions from /admin/users/me/permissions"
    );

    const response = await fetch("/admin/users/me/permissions", {
      credentials: "include",
    });

    // If 401 (unauthorized), user is not logged in yet - return empty permissions
    if (response.status === 401) {
      console.log("⚠️ User not authenticated - skipping permission check");
      return [];
    }

    if (!response.ok) {
      console.error("❌ Failed to fetch user permissions:", response.status);
      return [];
    }

    const data = await response.json();

    console.log("📦 Raw API Response:", data);

    // Check if user is super admin
    if (data.roles && data.roles.includes("super-admin")) {
      console.log("👑 User is super-admin, granting all permissions");
      return ["all-all"];
    }

    // Extract permission names from the response
    const permissions: string[] = [];

    if (data.permissions && Array.isArray(data.permissions)) {
      for (const perm of data.permissions) {
        if (perm.name) {
          permissions.push(perm.name);
        }
      }
    }

    console.log("✅ Extracted Permissions:", permissions);
    console.log("📊 Total Permissions:", permissions.length);

    return permissions;
  } catch (error) {
    console.error("❌ Error fetching permissions:", error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
function hasPermission(permissions: string[], required: string): boolean {
  // Super admin has all permissions
  if (permissions.includes("all-all")) {
    return true;
  }

  // Check for exact match
  if (permissions.includes(required)) {
    return true;
  }

  // Check for wildcard permissions (e.g., "customers-all" grants "customers-list")
  const [resource] = required.split("-");
  if (permissions.includes(`${resource}-all`)) {
    return true;
  }

  return false;
}

/**
 * Hook to check user permissions
 */
export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions().then((perms) => {
      setPermissions(perms);
      setLoading(false);
    });
  }, []);

  return {
    permissions,
    loading,
    hasPermission: (required: string) => hasPermission(permissions, required),
    hasAnyPermission: (...required: string[]) =>
      required.some((perm) => hasPermission(permissions, perm)),
  };
}

/**
 * Menu items that require permissions
 */
export const PROTECTED_MENU_ITEMS = {
  customers: {
    path: "/app/customers",
    requiredPermissions: ["customers-list", "customers-view"],
  },
  "customer-groups": {
    path: "/app/customer-groups",
    requiredPermissions: ["customers-list", "customers-view"],
  },
} as const;

/**
 * Check if a menu item should be visible based on user permissions
 */
export function shouldShowMenuItem(
  itemKey: keyof typeof PROTECTED_MENU_ITEMS,
  permissions: string[]
): boolean {
  const item = PROTECTED_MENU_ITEMS[itemKey];
  return item.requiredPermissions.some((perm) =>
    hasPermission(permissions, perm)
  );
}
