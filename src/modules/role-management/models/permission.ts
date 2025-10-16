import { model } from "@medusajs/framework/utils";

const Permission = model.define("permission", {
  id: model.id().primaryKey(),
  name: model.text().unique(),
  resource: model.text(), // e.g., "page", "product", "order", "all"
  action: model.text(), // e.g., "view", "add", "edit", "delete", "all"
  description: model.text().nullable(),
});

export default Permission;
