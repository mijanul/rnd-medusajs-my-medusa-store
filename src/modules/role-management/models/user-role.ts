import { model } from "@medusajs/framework/utils";

const UserRole = model.define("user_role", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  role_id: model.text(),
});

export default UserRole;
