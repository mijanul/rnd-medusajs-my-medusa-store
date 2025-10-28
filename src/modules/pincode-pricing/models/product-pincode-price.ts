import { model } from "@medusajs/framework/utils";
import Dealer from "./dealer";

/**
 * Product Pincode Pricing
 * Stores product prices for each pincode-dealer combination
 * NOTE: No variants - pricing is directly linked to products
 *
 * Foreign Key Relationships:
 * - product_id: References product.id with CASCADE delete (auto-deletes when product is deleted)
 * - dealer_id: References dealer.id
 */
const ProductPincodePrice = model.define("product_pincode_price", {
  id: model.id().primaryKey(),
  product_id: model.text(), // Foreign key to product.id (CASCADE delete)
  sku: model.text(), // For easier CSV mapping (product SKU)
  pincode: model.text(), // 6-digit pincode
  dealer: model.belongsTo(() => Dealer, {
    mappedBy: "prices",
  }),
  price: model.bigNumber(), // Price as decimal (e.g., 24.00, 98.30)
  is_active: model.boolean().default(true),
});

export default ProductPincodePrice;
