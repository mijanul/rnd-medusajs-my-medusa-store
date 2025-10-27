import { Module } from "@medusajs/framework/utils";
import PincodePricingService from "./service";

export const PINCODE_PRICING_MODULE = "pincodePricing";

export default Module(PINCODE_PRICING_MODULE, {
  service: PincodePricingService,
});
