import { model } from "@medusajs/framework/utils";

/**
 * Pincode Metadata
 *
 * Stores delivery and serviceability information for pincodes.
 * Does NOT store prices (prices are in Medusa's native price table).
 *
 * This is a lightweight reference table that maps pincodes to regions
 * and stores delivery-related metadata.
 */
const PincodeMetadata = model.define("pincode_metadata", {
  id: model.id().primaryKey(),

  // Pincode (6-digit Indian postal code)
  pincode: model.text().unique(), // e.g., "110001"

  // Region mapping (optional - for grouping pincodes)
  region_code: model.text().nullable(), // e.g., "IN-DEL" for Delhi NCR

  // Geographic information
  state: model.text().nullable(), // e.g., "Delhi"
  city: model.text().nullable(), // e.g., "New Delhi"

  // Delivery information
  delivery_days: model.number().default(3), // Default delivery time
  is_cod_available: model.boolean().default(true),
  is_serviceable: model.boolean().default(true),

  // Additional metadata (can be extended)
  notes: model.text().nullable(),
});

export default PincodeMetadata;
