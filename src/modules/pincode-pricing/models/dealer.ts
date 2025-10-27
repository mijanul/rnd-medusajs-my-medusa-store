import { model } from "@medusajs/framework/utils";

/**
 * Dealer Model
 * Represents a dealer/supplier who can fulfill orders in specific pincodes
 */
const Dealer = model.define("dealer", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text().unique(), // e.g., "DEALER_001", "DEALER_MUMBAI"
  contact_name: model.text().nullable(),
  contact_email: model.text().nullable(),
  contact_phone: model.text().nullable(),
  address: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export default Dealer;
