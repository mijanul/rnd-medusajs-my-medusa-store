import { model } from "@medusajs/framework/utils";
import Dealer from "./dealer";

/**
 * Pincode-Dealer Mapping
 * Links pincodes to dealers with delivery information
 */
const PincodeDealer = model.define("pincode_dealer", {
  id: model.id().primaryKey(),
  pincode: model.text(), // 6-digit Indian pincode
  dealer: model.belongsTo(() => Dealer, {
    mappedBy: "pincodes",
  }),
  delivery_days: model.number().default(3), // Estimated delivery days
  is_serviceable: model.boolean().default(true),
  is_cod_available: model.boolean().default(true),
  priority: model.number().default(1), // Lower number = higher priority
});

export default PincodeDealer;
