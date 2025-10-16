/**
 * Helper utility functions for role management
 */

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Check if a user has a specific permission
 * @param container - Medusa container
 * @param userId - User ID to check
 * @param permissionName - Permission name (e.g., "page-edit")
 * @returns Promise<boolean>
 */
export async function userHasPermission(
  container: any,
  userId: string,
  permissionName: string
): Promise<boolean> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Get user's roles
  const { data: userRoles } = await query.graph({
    entity: "user_role",
    fields: ["role_id"],
    filters: { user_id: userId },
  });

  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const roleIds = userRoles.map((ur: any) => ur.role_id);

  // Get permissions for these roles
  const { data: rolePermissions } = await query.graph({
    entity: "role_permission",
    fields: ["permission_id"],
    filters: { role_id: roleIds },
  });

  const permissionIds = rolePermissions.map((rp: any) => rp.permission_id);

  if (permissionIds.length === 0) {
    return false;
  }

  // Check if user has the specific permission or "all-all"
  const { data: permissions } = await query.graph({
    entity: "permission",
    fields: ["name"],
    filters: { id: permissionIds },
  });

  return permissions.some(
    (p: any) => p.name === permissionName || p.name === "all-all"
  );
}

/**
 * Check if a user has a specific role
 * @param container - Medusa container
 * @param userId - User ID to check
 * @param roleSlug - Role slug (e.g., "super-admin")
 * @returns Promise<boolean>
 */
export async function userHasRole(
  container: any,
  userId: string,
  roleSlug: string
): Promise<boolean> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Get the role by slug
  const { data: roles } = await query.graph({
    entity: "role",
    fields: ["id"],
    filters: { slug: roleSlug },
  });

  if (!roles || roles.length === 0) {
    return false;
  }

  const roleId = roles[0].id;

  // Check if user has this role
  const { data: userRoles } = await query.graph({
    entity: "user_role",
    fields: ["id"],
    filters: {
      user_id: userId,
      role_id: roleId,
    },
  });

  return userRoles && userRoles.length > 0;
}

/**
 * Get all permissions for a user
 * @param container - Medusa container
 * @param userId - User ID
 * @returns Promise<string[]> - Array of permission names
 */
export async function getUserPermissions(
  container: any,
  userId: string
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Get user's roles
  const { data: userRoles } = await query.graph({
    entity: "user_role",
    fields: ["role_id"],
    filters: { user_id: userId },
  });

  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  const roleIds = userRoles.map((ur: any) => ur.role_id);

  // Get permissions for these roles
  const { data: rolePermissions } = await query.graph({
    entity: "role_permission",
    fields: ["permission_id"],
    filters: { role_id: roleIds },
  });

  const permissionIds = rolePermissions.map((rp: any) => rp.permission_id);

  if (permissionIds.length === 0) {
    return [];
  }

  const { data: permissions } = await query.graph({
    entity: "permission",
    fields: ["name"],
    filters: { id: permissionIds },
  });

  return permissions.map((p: any) => p.name);
}

/**
 * Get all roles for a user
 * @param container - Medusa container
 * @param userId - User ID
 * @returns Promise<any[]> - Array of role objects
 */
export async function getUserRoles(
  container: any,
  userId: string
): Promise<any[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: userRoles } = await query.graph({
    entity: "user_role",
    fields: ["role_id"],
    filters: { user_id: userId },
  });

  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  const roleIds = userRoles.map((ur: any) => ur.role_id);

  const { data: roles } = await query.graph({
    entity: "role",
    fields: ["id", "name", "slug", "description", "is_active"],
    filters: { id: roleIds },
  });

  return roles;
}

/**
 * Check if user is super admin
 * @param container - Medusa container
 * @param userId - User ID
 * @returns Promise<boolean>
 */
export async function isSuperAdmin(
  container: any,
  userId: string
): Promise<boolean> {
  return userHasRole(container, userId, "super-admin");
}

/**
 * Check if user has any of the specified permissions
 * @param container - Medusa container
 * @param userId - User ID
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean>
 */
export async function userHasAnyPermission(
  container: any,
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(container, userId);

  // Check for super admin permission
  if (userPermissions.includes("all-all")) {
    return true;
  }

  return permissionNames.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 * @param container - Medusa container
 * @param userId - User ID
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean>
 */
export async function userHasAllPermissions(
  container: any,
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(container, userId);

  // Check for super admin permission
  if (userPermissions.includes("all-all")) {
    return true;
  }

  return permissionNames.every((perm) => userPermissions.includes(perm));
}
