import { model } from "@medusajs/framework/utils";
import Dealer from "./dealer";

/**
 * Product Pincode Pricing
 * Stores product variant prices for each pincode-dealer combination
 */
const ProductPincodePrice = model.define("product_pincode_price", {
  id: model.id().primaryKey(),
  variant_id: model.text(), // Links to product_variant.id
  sku: model.text(), // For easier CSV mapping
  pincode: model.text(), // 6-digit pincode
  dealer: model.belongsTo(() => Dealer, {
    mappedBy: "prices",
  }),
  price: model.bigNumber(), // Price in paise (smallest unit of INR)
  is_active: model.boolean().default(true),
});

export default ProductPincodePrice;
