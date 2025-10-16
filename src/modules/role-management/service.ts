import { MedusaService } from "@medusajs/framework/utils";
import Role from "./models/role";
import Permission from "./models/permission";
import RolePermission from "./models/role-permission";
import UserRole from "./models/user-role";

class RoleManagementService extends MedusaService({
  Role,
  Permission,
  RolePermission,
  UserRole,
}) {
  // Role methods
  async createRole(data: {
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean;
  }) {
    return await this.createRoles(data);
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      is_active?: boolean;
    }
  ) {
    return await this.updateRoles({
      selector: { id },
      data,
    });
  }

  async deleteRole(id: string) {
    // First, delete all role permissions
    const rolePermissions = await this.listRolePermissions({ role_id: id });
    for (const rp of rolePermissions) {
      await this.deleteRolePermissions(rp.id);
    }

    // Delete all user roles
    const userRoles = await this.listUserRoles({ role_id: id });
    for (const ur of userRoles) {
      await this.deleteUserRoles(ur.id);
    }

    // Finally delete the role
    return await this.deleteRoles(id);
  }

  async getRoleById(id: string) {
    const roles = await this.listRoles({ id });
    return roles.length > 0 ? roles[0] : null;
  }

  async getRoleBySlug(slug: string) {
    const roles = await this.listRoles({ slug });
    return roles.length > 0 ? roles[0] : null;
  }

  // Permission methods
  async createPermission(data: {
    name: string;
    resource: string;
    action: string;
    description?: string;
  }) {
    return await this.createPermissions(data);
  }

  async updatePermission(
    id: string,
    data: {
      name?: string;
      resource?: string;
      action?: string;
      description?: string;
    }
  ) {
    return await this.updatePermissions({
      selector: { id },
      data,
    });
  }

  async deletePermission(id: string) {
    // First, delete all role permissions that use this permission
    const rolePermissions = await this.listRolePermissions({
      permission_id: id,
    });
    for (const rp of rolePermissions) {
      await this.deleteRolePermissions(rp.id);
    }

    // Then delete the permission
    return await this.deletePermissions(id);
  }

  async getPermissionById(id: string) {
    const permissions = await this.listPermissions({ id });
    return permissions.length > 0 ? permissions[0] : null;
  }

  // Role-Permission methods
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const created: any[] = [];
    for (const permissionId of permissionIds) {
      // Check if already exists
      const existing = await this.listRolePermissions({
        role_id: roleId,
        permission_id: permissionId,
      });

      if (existing.length === 0) {
        const rp = await this.createRolePermissions({
          role_id: roleId,
          permission_id: permissionId,
        });
        created.push(rp);
      }
    }
    return created;
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]) {
    const deleted: any[] = [];
    for (const permissionId of permissionIds) {
      const rolePermissions = await this.listRolePermissions({
        role_id: roleId,
        permission_id: permissionId,
      });

      for (const rp of rolePermissions) {
        await this.deleteRolePermissions(rp.id);
        deleted.push(rp);
      }
    }
    return deleted;
  }

  async getRolePermissions(roleId: string) {
    return await this.listRolePermissions({ role_id: roleId });
  }

  // User-Role methods
  async assignRolesToUser(userId: string, roleIds: string[]) {
    const created: any[] = [];
    for (const roleId of roleIds) {
      // Check if already exists
      const existing = await this.listUserRoles({
        user_id: userId,
        role_id: roleId,
      });

      if (existing.length === 0) {
        const ur = await this.createUserRoles({
          user_id: userId,
          role_id: roleId,
        });
        created.push(ur);
      }
    }
    return created;
  }

  async removeRolesFromUser(userId: string, roleIds: string[]) {
    const deleted: any[] = [];
    for (const roleId of roleIds) {
      const userRoles = await this.listUserRoles({
        user_id: userId,
        role_id: roleId,
      });

      for (const ur of userRoles) {
        await this.deleteUserRoles(ur.id);
        deleted.push(ur);
      }
    }
    return deleted;
  }

  async getUserRoles(userId: string) {
    return await this.listUserRoles({ user_id: userId });
  }

  // Helper method to get all permissions for a resource
  async getPermissionsByResource(resource: string) {
    const allPermissions = await this.listPermissions({});
    return allPermissions.filter((p: any) => p.resource === resource);
  }

  // Helper method to delete all permissions for a resource
  async deletePermissionsByResource(resource: string) {
    const permissions = await this.getPermissionsByResource(resource);
    const deleted: any[] = [];
    for (const perm of permissions) {
      await this.deletePermission(perm.id);
      deleted.push(perm);
    }
    return deleted;
  }
}

export default RoleManagementService;
