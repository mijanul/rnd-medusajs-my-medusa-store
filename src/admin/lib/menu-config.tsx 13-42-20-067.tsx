/**
 * Menu Configuration with Permission-based Visibility
 *
 * This module provides utilities to fetch user permissions
 * and check if menu items should be visible
 */

import { useEffect, useState } from "react";

/**
 * Fetch current user's permissions
 */
async function fetchUserPermissions(): Promise<string[]> {
  try {
    const response = await fetch("/admin/users/me/permissions", {
      credentials: "include",
    });

    // If 401 (unauthorized), user is not logged in yet
    if (response.status === 401) {
      console.log("⚠️ User not authenticated - skipping permission check");
      return [];
    }

    if (!response.ok) {
      console.error("❌ Failed to fetch user permissions:", response.status);
      return [];
    }

    const data = await response.json();
    const permissions = data.permissions?.map((p: any) => p.name) || [];

    console.log("✅ User permissions loaded:", permissions);
    return permissions;
  } catch (error) {
    console.error("❌ Error fetching permissions:", error);
    return [];
  }
}

/**
 * Hook to get user permissions
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
  };
}
