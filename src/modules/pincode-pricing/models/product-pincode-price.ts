import { model } from "@medusajs/framework/utils";
import Dealer from "./dealer";

/**
 * Product Pincode Pricing
 * Stores product prices for each pincode-dealer combination
 * NOTE: No variants - pricing is directly linked to products
 */
const ProductPincodePrice = model.define("product_pincode_price", {
  id: model.id().primaryKey(),
  product_id: model.text(), // Links to product.id
  sku: model.text(), // For easier CSV mapping (product SKU)
  pincode: model.text(), // 6-digit pincode
  dealer: model.belongsTo(() => Dealer, {
    mappedBy: "prices",
  }),
  price: model.bigNumber(), // Price as decimal (e.g., 24.00, 98.30)
  is_active: model.boolean().default(true),
});

export default ProductPincodePrice;
