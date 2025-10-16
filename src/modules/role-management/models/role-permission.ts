import { model } from "@medusajs/framework/utils";

const RolePermission = model.define("role_permission", {
  id: model.id().primaryKey(),
  role_id: model.text(),
  permission_id: model.text(),
});

export default RolePermission;
