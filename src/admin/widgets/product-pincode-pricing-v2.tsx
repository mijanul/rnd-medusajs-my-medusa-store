/**
 * Week 3 - UI Component 2: Product Pincode Pricing Widget (UPDATED)
 *
 * This widget displays pincode pricing information on the product detail page.
 * UPDATED to use new Admin API v2 endpoints.
 *
 * Location: Product detail page in admin
 * Features:
 * - Show all pincodes where product is available
 * - Display prices for each pincode
 * - Show statistics (min/max/avg prices)
 * - Coverage by state/city
 * - Search and filter functionality
 * - Pagination for large datasets
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  Text,
  Badge,
  Table,
  Input,
} from "@medusajs/ui";
import { useState, useEffect } from "react";

const ProductPincodePricingWidgetV2 = ({ data }: { data: any }) => {
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const productId = data?.id;

  // Fetch product pricing data using new API
  useEffect(() => {
    if (!productId) return;

    const fetchPricingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use new API endpoint
        const response = await fetch(
          `/admin/pincode-pricing-v2/products/${productId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
          } else {
            throw new Error("Failed to fetch pricing data");
          }
          return;
        }

        const result = await response.json();
        setPricingData(result);
      } catch (err: any) {
        console.error("Error fetching pricing data:", err);
        setError(err.message || "Failed to load pricing data");
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, [productId]);

  // Filter pincodes based on search
  const filteredPincodes =
    pricingData?.pincodes?.filter((item: any) => {
      const query = searchQuery.toLowerCase();
      return (
        item.pincode.includes(query) ||
        item.location?.city?.toLowerCase().includes(query) ||
        item.location?.state?.toLowerCase().includes(query)
      );
    }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredPincodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPincodes = filteredPincodes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return (
      <Container className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <Text className="text-red-800 font-medium">Error</Text>
          <Text className="text-red-600">{error}</Text>
        </div>
      </Container>
    );
  }

  if (!pricingData || pricingData.statistics?.total_pincodes === 0) {
    return (
      <Container className="p-6">
        <Heading level="h2" className="mb-4">
          Pincode Pricing
        </Heading>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <Text className="text-gray-600 mb-2">
            No pincode pricing configured for this product.
          </Text>
          <Text className="text-sm text-gray-500">
            Use the CSV upload widget to add prices for this product.
          </Text>
        </div>
      </Container>
    );
  }

  const stats = pricingData.statistics;

  return (
    <Container className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Heading level="h2">Pincode Pricing</Heading>
        <Badge size="large" color="blue">
          {stats.total_pincodes} Pincodes
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <Text className="text-xs text-blue-600 mb-1 uppercase font-medium">
            Total Pincodes
          </Text>
          <Text className="text-2xl font-bold text-blue-900">
            {stats.total_pincodes}
          </Text>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <Text className="text-xs text-green-600 mb-1 uppercase font-medium">
            Min Price
          </Text>
          <Text className="text-2xl font-bold text-green-900">
            {stats.price_range?.min_formatted || "₹0.00"}
          </Text>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <Text className="text-xs text-purple-600 mb-1 uppercase font-medium">
            Max Price
          </Text>
          <Text className="text-2xl font-bold text-purple-900">
            {stats.price_range?.max_formatted || "₹0.00"}
          </Text>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded">
          <Text className="text-xs text-orange-600 mb-1 uppercase font-medium">
            Avg Price
          </Text>
          <Text className="text-2xl font-bold text-orange-900">
            {stats.price_range?.avg_formatted || "₹0.00"}
          </Text>
        </div>
      </div>

      {/* Coverage Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <Text className="text-sm text-gray-600">States Covered</Text>
          <Text className="text-xl font-bold text-gray-900">
            {stats.coverage?.states || 0}
          </Text>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <Text className="text-sm text-gray-600">Cities Covered</Text>
          <Text className="text-xl font-bold text-gray-900">
            {stats.coverage?.cities || 0}
          </Text>
        </div>
      </div>

      {/* Search */}
      <div>
        <Input
          type="text"
          placeholder="Search by pincode, city, or state..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page
          }}
        />
        {searchQuery && (
          <Text className="text-sm text-gray-500 mt-1">
            Found {filteredPincodes.length} results
          </Text>
        )}
      </div>

      {/* Pincodes Table */}
      <div className="border border-gray-200 rounded overflow-hidden">
        {filteredPincodes.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Pincode</Table.HeaderCell>
                    <Table.HeaderCell>Price</Table.HeaderCell>
                    <Table.HeaderCell>City</Table.HeaderCell>
                    <Table.HeaderCell>State</Table.HeaderCell>
                    <Table.HeaderCell>Delivery Days</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paginatedPincodes.map((item: any) => (
                    <Table.Row key={item.pincode}>
                      <Table.Cell>
                        <Badge>{item.pincode}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="font-medium">
                          {item.price?.formatted || "N/A"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="text-sm text-gray-700">
                          {item.location?.city || "N/A"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="text-sm text-gray-700">
                          {item.location?.state || "N/A"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="text-sm text-gray-700">
                          {item.delivery_days || "N/A"} days
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
                <Text className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, filteredPincodes.length)}{" "}
                  of {filteredPincodes.length}
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-3">
                    <Text className="text-sm">
                      Page {currentPage} of {totalPages}
                    </Text>
                  </div>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Text className="text-gray-500">No results found</Text>
          </div>
        )}
      </div>

      {/* State Distribution */}
      {pricingData.by_state && Object.keys(pricingData.by_state).length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <Text className="font-medium text-gray-800 mb-3">
            Distribution by State
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(pricingData.by_state)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 8)
              .map(([state, count]) => (
                <div
                  key={state}
                  className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                >
                  <Text className="text-sm text-gray-700">{state}</Text>
                  <Badge size="small">{count as number}</Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <Text className="text-sm text-blue-800 mb-2 font-medium">
          💡 To update prices for this product:
        </Text>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Go to the Products list page</li>
          <li>Use the "Pincode Pricing - Bulk Upload" widget</li>
          <li>Download the CSV template</li>
          <li>
            Update prices for this product (SKU: {data?.handle || productId})
          </li>
          <li>Upload the CSV file</li>
        </ol>
      </div>
    </Container>
  );
};

// Widget configuration - show on product detail page
export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductPincodePricingWidgetV2;
