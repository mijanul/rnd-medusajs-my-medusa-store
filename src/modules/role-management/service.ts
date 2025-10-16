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
}) {}

export default RoleManagementService;
