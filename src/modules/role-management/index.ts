import { Module } from "@medusajs/framework/utils";
import RoleManagementService from "./service";

export const ROLE_MANAGEMENT_MODULE = "roleManagementModuleService";

export default Module(ROLE_MANAGEMENT_MODULE, {
  service: RoleManagementService,
});
