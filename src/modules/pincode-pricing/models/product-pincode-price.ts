import { model } from "@medusajs/framework/utils";

/**
 * Product Pincode Pricing
 * Stores one price per product per pincode (applies to all dealers)
 * NOTE: No variants - pricing is directly linked to products
 * NOTE: No dealer relationship - one pincode = one price for all dealers
 *
 * Foreign Key Relationships:
 * - product_id: References product.id with CASCADE delete (auto-deletes when product is deleted)
 *
 * Unique Constraint:
 * - (product_id, pincode) must be unique - only one price per product per pincode
 */
const ProductPincodePrice = model
  .define("product_pincode_price", {
    id: model.id().primaryKey(),
    product_id: model.text(), // Foreign key to product.id (CASCADE delete)
    sku: model.text(), // For easier CSV mapping (product SKU)
    pincode: model.text(), // 6-digit pincode
    price: model.bigNumber(), // Price as decimal (e.g., 24.00, 98.30)
    is_active: model.boolean().default(true),
  })
  .indexes([
    {
      name: "idx_product_pincode_unique",
      on: ["product_id", "pincode"],
      unique: true,
    },
  ]);

export default ProductPincodePrice;
