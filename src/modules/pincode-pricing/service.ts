import { MedusaService } from "@medusajs/framework/utils";
import Dealer from "./models/dealer";
import PincodeDealer from "./models/pincode-dealer";
import ProductPincodePrice from "./models/product-pincode-price";
import PincodeMetadata from "./models/pincode-metadata";

class PincodePricingService extends MedusaService({
  Dealer,
  PincodeDealer,
  ProductPincodePrice,
  PincodeMetadata,
}) {
  /**
   * Check if a pincode is serviceable
   */
  async isPincodeServiceable(pincode: string): Promise<boolean> {
    const dealers = await this.listPincodeDealers({
      pincode,
      is_serviceable: true,
    });
    return dealers.length > 0;
  }

  /**
   * Get all dealers serving a specific pincode
   */
  async getDealersForPincode(pincode: string) {
    return await this.listPincodeDealers(
      {
        pincode,
        is_serviceable: true,
      },
      {
        relations: ["dealer"],
        order: { priority: "ASC" }, // Sort by priority
      }
    );
  }

  /**
   * Get product price for a specific pincode
   * Returns the best available dealer price
   * NOTE: Works with product_id directly (no variants)
   */
  async getProductPrice(productId: string, pincode: string) {
    // Get all dealers for this pincode
    const dealers = await this.getDealersForPincode(pincode);

    if (dealers.length === 0) {
      throw new Error(
        `We don't serve your area (pincode: ${pincode}) yet. Please try a different pincode or contact support.`
      );
    }

    // Get prices from all available dealers
    const dealerIds = dealers.map((pd) => pd.dealer.id);
    const prices = await this.listProductPincodePrices({
      product_id: productId,
      pincode,
      dealer_id: dealerIds,
      is_active: true,
    });

    if (prices.length === 0) {
      throw new Error(
        `This product is not available in your area (pincode: ${pincode}) at the moment.`
      );
    }

    // Sort by price (lowest first) and return best option
    prices.sort((a, b) => Number(a.price) - Number(b.price));
    const bestPrice = prices[0];

    // Get dealer info for the best price
    // Note: dealer_id removed in new system, keeping for backward compatibility
    const dealerInfo = dealers.find(
      (d) => d.dealer.id === (bestPrice as any).dealer_id
    );

    return {
      price: bestPrice.price,
      dealer: (bestPrice as any).dealer || null,
      delivery_days: dealerInfo?.delivery_days || 3,
      is_cod_available: dealerInfo?.is_cod_available || false,
    };
  }

  /**
   * Get product price by SKU (useful for CSV imports)
   */
  async getProductPriceBySku(sku: string, pincode: string) {
    const prices = await this.listProductPincodePrices({
      sku,
      pincode,
      is_active: true,
    });

    if (prices.length === 0) {
      return null;
    }

    return prices;
  }

  /**
   * Bulk import prices from CSV data
   * NOTE: Works with product_id directly (no variants)
   */
  async bulkImportPrices(
    pricesData: Array<{
      sku: string;
      product_id: string;
      pincode: string;
      dealer_code: string;
      price: number;
    }>
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const data of pricesData) {
      try {
        // Find dealer by code
        const dealers = await this.listDealers({ code: data.dealer_code });
        if (dealers.length === 0) {
          results.failed++;
          results.errors.push(`Dealer ${data.dealer_code} not found`);
          continue;
        }

        // Create or update price
        // Note: dealer_id removed in new system, using type assertion for backward compatibility
        await this.createProductPincodePrices({
          product_id: data.product_id,
          sku: data.sku,
          pincode: data.pincode,
          price: data.price,
          is_active: true,
        } as any);

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error importing ${data.sku}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Bulk import prices from CSV data (simplified without dealer)
   * Each price entry is for a specific product and pincode
   * NOTE: Works with product_id directly (no variants)
   */
  async bulkImportPricesSimple(
    pricesData: Array<{
      sku: string;
      product_id: string;
      pincode: string;
      price: number;
    }>
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get or create a default dealer if needed (for backward compatibility)
    // Since we still need dealer_id in the model
    let defaultDealer;
    const dealers = await this.listDealers({ code: "DEFAULT" });

    if (dealers.length === 0) {
      // Create a default dealer
      defaultDealer = await this.createDealers({
        name: "Default Dealer",
        code: "DEFAULT",
        is_active: true,
      });
    } else {
      defaultDealer = dealers[0];
    }

    for (const data of pricesData) {
      try {
        // Check if price already exists for this product + pincode
        const existingPrices = await this.listProductPincodePrices({
          product_id: data.product_id,
          pincode: data.pincode,
        });

        if (existingPrices.length > 0) {
          // Update existing price
          await this.updateProductPincodePrices({
            id: existingPrices[0].id,
            price: data.price,
            sku: data.sku,
            is_active: true,
          } as any);
        } else {
          // Create new price
          await this.createProductPincodePrices({
            product_id: data.product_id,
            sku: data.sku,
            pincode: data.pincode,
            price: data.price,
            is_active: true,
          } as any);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error importing ${data.sku} for pincode ${data.pincode}: ${error.message}`
        );
      }
    }

    return results;
  }

  /**
   * Delete all pricing data for a specific product
   * Used when product is deleted
   */
  async deleteProductPricing(productId: string) {
    const prices = await this.listProductPincodePrices({
      product_id: productId,
    });

    if (prices.length === 0) {
      return { deleted: 0 };
    }

    const priceIds = prices.map((price) => price.id);
    await this.deleteProductPincodePrices(priceIds);

    return { deleted: prices.length };
  }

  /**
   * Delete all pricing data for a specific pincode
   */
  async deletePincodePricing(pincode: string) {
    const prices = await this.listProductPincodePrices({
      pincode,
    });

    if (prices.length === 0) {
      return { deleted: 0 };
    }

    const priceIds = prices.map((price) => price.id);
    await this.deleteProductPincodePrices(priceIds);

    return { deleted: prices.length };
  }

  /**
   * Delete specific pricing entries
   */
  async deletePricing(priceIds: string[]) {
    if (priceIds.length === 0) {
      return { deleted: 0 };
    }

    await this.deleteProductPincodePrices(priceIds);
    return { deleted: priceIds.length };
  }
}

export default PincodePricingService;
