import { model } from "@medusajs/framework/utils";

const Role = model.define("role", {
  id: model.id().primaryKey(),
  name: model.text().unique(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export default Role;
