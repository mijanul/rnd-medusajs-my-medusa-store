import { model } from "@medusajs/framework/utils";

const Page = model.define("page", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique(),
  content: model.text(),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
  is_published: model.boolean().default(true),
  published_at: model.dateTime().nullable(),
});

export default Page;
