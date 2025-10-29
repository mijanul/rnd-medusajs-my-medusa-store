/**
 * Pincode Metadata Adapter Service
 *
 * Purpose: Provides clean access to pincode metadata (serviceability, delivery info)
 * Created: Day 5 - Service Layer Foundation
 *
 * This service wraps the pincode_metadata table created in Day 2,
 * providing a simple interface for checking pincode serviceability,
 * delivery times, COD availability, etc.
 *
 * Key Features:
 * - Check if pincode is serviceable
 * - Get delivery information
 * - Validate pincode format
 * - Cache-friendly design
 * - Links to region data from Day 4 migration
 */

type MedusaContainer = any;

interface PincodeMetadata {
  pincode: string;
  region_code: string | null;
  state: string | null;
  city: string | null;
  delivery_days: number;
  is_cod_available: boolean;
  is_serviceable: boolean;
}

interface ServiceabilityResult {
  isServiceable: boolean;
  pincode: string;
  deliveryDays?: number;
  isCodAvailable?: boolean;
  region?: {
    id: string;
    name: string;
  };
  city?: string;
  state?: string;
}

export class PincodeMetadataAdapter {
  private container: MedusaContainer;

  constructor(container: MedusaContainer) {
    this.container = container;
  }

  /**
   * Check if a pincode is serviceable
   *
   * This is the main method you'll call before showing products to customers.
   * Returns detailed serviceability info including delivery times.
   *
   * @param pincode - The pincode to check (e.g., "110001")
   * @returns Serviceability result with delivery details
   *
   * @example
   * const result = await metadataAdapter.checkServiceability("110001");
   * if (result.isServiceable) {
   *   console.log(`Delivers in ${result.deliveryDays} days`);
   * }
   */
  async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    try {
      // Validate pincode format first
      if (!this.isValidPincodeFormat(pincode)) {
        return {
          isServiceable: false,
          pincode: pincode,
        };
      }

      const query = await this.container.resolve("query");

      // Query pincode_metadata table
      const metadataResult = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "region_code",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {
          pincode: pincode,
        },
      });

      // If not found, pincode is not serviceable
      if (!metadataResult.data || metadataResult.data.length === 0) {
        return {
          isServiceable: false,
          pincode: pincode,
        };
      }

      const metadata = metadataResult.data[0];

      // Check if marked as serviceable
      if (!metadata.is_serviceable) {
        return {
          isServiceable: false,
          pincode: pincode,
          city: metadata.city,
          state: metadata.state,
        };
      }

      // If serviceable, get region info
      let region;
      if (metadata.region_code) {
        const regionResult = await query.graph({
          entity: "region",
          fields: ["id", "name"],
          filters: {
            name: `India - ${pincode}`,
          },
        });

        if (regionResult.data && regionResult.data.length > 0) {
          region = {
            id: regionResult.data[0].id,
            name: regionResult.data[0].name,
          };
        }
      }

      return {
        isServiceable: true,
        pincode: pincode,
        deliveryDays: metadata.delivery_days,
        isCodAvailable: metadata.is_cod_available,
        city: metadata.city,
        state: metadata.state,
        region: region,
      };
    } catch (error) {
      console.error("Error checking pincode serviceability:", error);
      // On error, return not serviceable to be safe
      return {
        isServiceable: false,
        pincode: pincode,
      };
    }
  }

  /**
   * Get full metadata for a pincode
   * Returns all available information
   *
   * @param pincode - The pincode to query
   * @returns Complete metadata or null if not found
   */
  async getMetadata(pincode: string): Promise<PincodeMetadata | null> {
    try {
      const query = await this.container.resolve("query");

      const result = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "region_code",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {
          pincode: pincode,
        },
      });

      if (!result.data || result.data.length === 0) {
        return null;
      }

      return result.data[0] as PincodeMetadata;
    } catch (error) {
      console.error("Error fetching pincode metadata:", error);
      return null;
    }
  }

  /**
   * Get metadata for multiple pincodes in one query
   * Useful for bulk operations
   *
   * @param pincodes - Array of pincodes
   * @returns Map of pincode to metadata
   */
  async getBulkMetadata(
    pincodes: string[]
  ): Promise<Map<string, PincodeMetadata>> {
    const results = new Map<string, PincodeMetadata>();

    try {
      const query = await this.container.resolve("query");

      // Query all pincodes at once
      const result = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "region_code",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {
          pincode: { $in: pincodes },
        },
      });

      if (result.data && result.data.length > 0) {
        for (const metadata of result.data) {
          results.set(metadata.pincode, metadata as PincodeMetadata);
        }
      }
    } catch (error) {
      console.error("Error fetching bulk metadata:", error);
    }

    return results;
  }

  /**
   * Get all serviceable pincodes
   * Useful for admin dashboard
   *
   * @returns Array of serviceable pincodes with details
   */
  async getAllServiceablePincodes(): Promise<PincodeMetadata[]> {
    try {
      const query = await this.container.resolve("query");

      const result = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "region_code",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {
          is_serviceable: true,
        },
      });

      return result.data || [];
    } catch (error) {
      console.error("Error fetching serviceable pincodes:", error);
      return [];
    }
  }

  /**
   * Search pincodes by city or state
   *
   * @param searchTerm - City or state name to search
   * @returns Array of matching pincodes
   */
  async searchPincodes(searchTerm: string): Promise<PincodeMetadata[]> {
    try {
      const query = await this.container.resolve("query");

      // Search in both city and state fields
      const result = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "region_code",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {
          $or: [
            { city: { $ilike: `%${searchTerm}%` } },
            { state: { $ilike: `%${searchTerm}%` } },
          ],
        },
      });

      return result.data || [];
    } catch (error) {
      console.error("Error searching pincodes:", error);
      return [];
    }
  }

  /**
   * Validate pincode format
   * Indian pincodes are 6 digits
   *
   * @param pincode - The pincode to validate
   * @returns True if format is valid
   */
  isValidPincodeFormat(pincode: string): boolean {
    // Remove whitespace
    const cleaned = pincode.trim();

    // Check if 6 digits
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(cleaned);
  }

  /**
   * Normalize pincode (remove whitespace, ensure 6 digits)
   *
   * @param pincode - The pincode to normalize
   * @returns Normalized pincode or null if invalid
   */
  normalizePincode(pincode: string): string | null {
    const cleaned = pincode.trim();

    if (this.isValidPincodeFormat(cleaned)) {
      return cleaned;
    }

    return null;
  }

  /**
   * Get pincode statistics
   * Useful for admin dashboard
   *
   * @returns Statistics about pincode coverage
   */
  async getStatistics(): Promise<{
    totalPincodes: number;
    serviceablePincodes: number;
    codAvailablePincodes: number;
    averageDeliveryDays: number;
    uniqueStates: number;
    uniqueCities: number;
  }> {
    try {
      const query = await this.container.resolve("query");

      // Get all metadata
      const result = await query.graph({
        entity: "pincode_metadata",
        fields: [
          "pincode",
          "state",
          "city",
          "delivery_days",
          "is_cod_available",
          "is_serviceable",
        ],
        filters: {},
      });

      const data = result.data || [];

      // Calculate statistics
      const totalPincodes = data.length;
      const serviceablePincodes = data.filter(
        (p: any) => p.is_serviceable
      ).length;
      const codAvailablePincodes = data.filter(
        (p: any) => p.is_cod_available
      ).length;

      const avgDeliveryDays =
        data.length > 0
          ? data.reduce(
              (sum: number, p: any) => sum + (p.delivery_days || 0),
              0
            ) / data.length
          : 0;

      const uniqueStates = new Set(
        data.map((p: any) => p.state).filter(Boolean)
      ).size;
      const uniqueCities = new Set(data.map((p: any) => p.city).filter(Boolean))
        .size;

      return {
        totalPincodes,
        serviceablePincodes,
        codAvailablePincodes,
        averageDeliveryDays: Math.round(avgDeliveryDays * 10) / 10, // Round to 1 decimal
        uniqueStates,
        uniqueCities,
      };
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return {
        totalPincodes: 0,
        serviceablePincodes: 0,
        codAvailablePincodes: 0,
        averageDeliveryDays: 0,
        uniqueStates: 0,
        uniqueCities: 0,
      };
    }
  }

  /**
   * Update metadata for a pincode
   * Useful for admin operations
   *
   * @param pincode - The pincode to update
   * @param updates - Fields to update
   * @returns True if update successful
   */
  async updateMetadata(
    pincode: string,
    updates: Partial<Omit<PincodeMetadata, "pincode">>
  ): Promise<boolean> {
    try {
      const query = await this.container.resolve("query");

      // Note: This is a simplified version. In production, you'd use
      // Medusa's proper update mechanism through the module

      // For now, this is a placeholder that shows the intent
      console.log(`Would update pincode ${pincode} with:`, updates);

      // TODO: Implement actual update using Medusa's ORM
      // This would typically be done through the PincodePricingService

      return true;
    } catch (error) {
      console.error("Error updating metadata:", error);
      return false;
    }
  }
}

/**
 * Factory function to create PincodeMetadataAdapter
 * Use this in your API routes
 *
 * @example
 * import { createPincodeMetadataAdapter } from "./services/pincode-metadata-adapter";
 *
 * export async function GET(req: Request) {
 *   const metadataAdapter = createPincodeMetadataAdapter(req.scope);
 *   const result = await metadataAdapter.checkServiceability("110001");
 *
 *   if (!result.isServiceable) {
 *     return Response.json({ error: "Not serviceable" }, { status: 400 });
 *   }
 *
 *   // Continue with price lookup...
 * }
 */
export function createPincodeMetadataAdapter(
  container: MedusaContainer
): PincodeMetadataAdapter {
  return new PincodeMetadataAdapter(container);
}
