import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Button, Input, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";

/**
 * Pincode Pricing Widget for Product Detail Page
 *
 * Displays and manages pincode-based prices for a product.
 * Features:
 * 1. List view of all pincode prices
 * 2. Search by pincode
 * 3. Edit individual prices
 * 4. Support multiple dealers per pincode
 * 5. Update single pincode price across all dealers
 */
const ProductPincodePricingWidget = ({ data }: { data: any }) => {
  const [pincodePrices, setPincodePrices] = useState<any[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchPincode, setSearchPincode] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const productId = data?.id;

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch pincode prices for this product
        const pricesResponse = await fetch(
          `/admin/pincode-pricing/prices?product_id=${productId}`,
          {
            credentials: "include",
          }
        );

        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json();
          setPincodePrices(pricesData.prices || []);
          setFilteredPrices(pricesData.prices || []);
        }
      } catch (error) {
        console.error("Error fetching pincode pricing data:", error);
        toast.error("Error loading pincode pricing");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, refreshKey]);

  // Filter prices based on search
  useEffect(() => {
    if (searchPincode.trim() === "") {
      setFilteredPrices(pincodePrices);
    } else {
      const filtered = pincodePrices.filter((price) =>
        price.pincode.includes(searchPincode.trim())
      );
      setFilteredPrices(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchPincode, pincodePrices]);

  const handlePriceUpdate = async (priceId: string, newPrice: number) => {
    try {
      const response = await fetch(`/admin/pincode-pricing/prices/${priceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ price: newPrice }),
      });

      if (response.ok) {
        toast.success("Price updated successfully");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to update price");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Error updating price");
    }
  };

  const handleBulkPincodeUpdate = async (pincode: string, newPrice: number) => {
    try {
      const response = await fetch(
        `/admin/pincode-pricing/update-pincode/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ pincode, price: newPrice }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Updated ${result.updated_count} prices for pincode ${pincode}`
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to update pincode prices");
      }
    } catch (error) {
      console.error("Error updating pincode prices:", error);
      toast.error("Error updating pincode prices");
    }
  };

  const handleSyncFromCurrency = async () => {
    try {
      const response = await fetch(
        `/admin/pincode-pricing/sync-product/${productId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Prices synced from currency pricing");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to sync prices");
      }
    } catch (error) {
      console.error("Error syncing prices:", error);
      toast.error("Error syncing prices");
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center p-8">
          <p>Loading pincode pricing...</p>
        </div>
      </Container>
    );
  }

  const hasNoPrices = pincodePrices.length === 0;

  // Group prices by pincode for grouped view
  const pricesByPincode = pincodePrices.reduce((acc, price) => {
    if (!acc[price.pincode]) {
      acc[price.pincode] = [];
    }
    acc[price.pincode].push(price);
    return acc;
  }, {} as Record<string, any[]>);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPrices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrices = filteredPrices.slice(startIndex, endIndex);

  // For grouped view pagination
  const filteredPincodes = Array.from(
    new Set(filteredPrices.map((p) => p.pincode))
  ).sort();
  const totalPincodePages = Math.ceil(filteredPincodes.length / itemsPerPage);
  const pincodeStartIndex = (currentPage - 1) * itemsPerPage;
  const pincodeEndIndex = pincodeStartIndex + itemsPerPage;
  const paginatedPincodes = filteredPincodes.slice(
    pincodeStartIndex,
    pincodeEndIndex
  );

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2">Pincode-Based Pricing</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage prices for different pincodes and dealers
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleSyncFromCurrency}
              disabled={loading}
            >
              Sync from Currency Price
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.open("/app/pincode-pricing", "_blank")}
            >
              Manage via CSV
            </Button>
          </div>
        </div>

        {hasNoPrices ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-ui-fg-subtle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium">No pincode prices yet</p>
                <p className="text-ui-fg-subtle text-sm mt-1">
                  Click "Sync from Currency Price" to auto-generate prices for
                  all pincodes,
                  <br />
                  or use "Manage via CSV" to bulk upload prices
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="primary" onClick={handleSyncFromCurrency}>
                  Sync from Currency Price
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open("/app/pincode-pricing", "_blank")}
                >
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Search and View Mode Controls */}
            <div className="mb-4 flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by pincode (e.g., 110001)"
                  value={searchPincode}
                  onChange={(e) => setSearchPincode(e.target.value)}
                  className="w-full max-w-md"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "primary" : "secondary"}
                  onClick={() => setViewMode("list")}
                  size="small"
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === "grouped" ? "primary" : "secondary"}
                  onClick={() => setViewMode("grouped")}
                  size="small"
                >
                  Grouped View
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-4 p-4 bg-ui-bg-subtle rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">Total Pincodes:</span>{" "}
                  {Object.keys(pricesByPincode).length}
                </div>
                <div>
                  <span className="font-medium">Total Prices:</span>{" "}
                  {pincodePrices.length}
                </div>
                <div>
                  <span className="font-medium">Showing:</span>{" "}
                  {filteredPrices.length} results
                </div>
              </div>
            </div>

            {/* List View */}
            {viewMode === "list" && (
              <ListView
                prices={paginatedPrices}
                onUpdate={handlePriceUpdate}
                onBulkUpdate={handleBulkPincodeUpdate}
              />
            )}

            {/* Grouped View */}
            {viewMode === "grouped" && (
              <GroupedView
                pricesByPincode={pricesByPincode}
                pincodes={paginatedPincodes}
                onUpdate={handlePriceUpdate}
                onBulkUpdate={handleBulkPincodeUpdate}
              />
            )}

            {/* Pagination Controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-ui-fg-subtle">
                Showing{" "}
                {viewMode === "list"
                  ? `${startIndex + 1}-${Math.min(
                      endIndex,
                      filteredPrices.length
                    )} of ${filteredPrices.length} prices`
                  : `${pincodeStartIndex + 1}-${Math.min(
                      pincodeEndIndex,
                      filteredPincodes.length
                    )} of ${filteredPincodes.length} pincodes`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm">
                    Page {currentPage} of{" "}
                    {viewMode === "list" ? totalPages : totalPincodePages}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={
                    currentPage ===
                    (viewMode === "list" ? totalPages : totalPincodePages)
                  }
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Pincode pricing is the only pricing
            mechanism. Each pincode can have multiple dealers. Click "Edit" to
            update individual prices or "Update All" to change all dealers for a
            pincode.
          </p>
        </div>
      </div>
    </Container>
  );
};

/**
 * List View Component - Shows all prices in a flat list
 */
const ListView = ({
  prices,
  onUpdate,
}: {
  prices: any[];
  onUpdate: (id: string, price: number) => void;
  onBulkUpdate: (pincode: string, price: number) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Pincode</Table.HeaderCell>
            <Table.HeaderCell>Dealer</Table.HeaderCell>
            <Table.HeaderCell>Price (₹)</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {prices.length === 0 ? (
            <Table.Row>
              <Table.Cell className="text-center py-8">
                No prices found for the search criteria
              </Table.Cell>
            </Table.Row>
          ) : (
            prices.map((priceEntry: any) => (
              <Table.Row key={priceEntry.id}>
                <Table.Cell>
                  <span className="font-mono font-medium">
                    {priceEntry.pincode}
                  </span>
                </Table.Cell>
                <Table.Cell>{priceEntry.dealer?.name || "Unknown"}</Table.Cell>
                <Table.Cell>
                  {editingId === priceEntry.id ? (
                    <PriceEditCell
                      priceId={priceEntry.id}
                      currentPrice={Number(priceEntry.price)}
                      onUpdate={(id, price) => {
                        onUpdate(id, price);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <span>₹{Number(priceEntry.price).toFixed(2)}</span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setEditingId(priceEntry.id)}
                      disabled={editingId !== null}
                    >
                      Edit
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  );
};

/**
 * Grouped View Component - Shows prices grouped by pincode
 */
const GroupedView = ({
  pricesByPincode,
  pincodes,
  onUpdate,
  onBulkUpdate,
}: {
  pricesByPincode: Record<string, any[]>;
  pincodes: string[];
  onUpdate: (id: string, price: number) => void;
  onBulkUpdate: (pincode: string, price: number) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkEditPincode, setBulkEditPincode] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState("");

  return (
    <div className="space-y-4">
      {pincodes.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          No prices found for the search criteria
        </div>
      ) : (
        pincodes.map((pincode: string) => {
          const prices = pricesByPincode[pincode];

          return (
            <div key={pincode} className="border rounded-lg overflow-hidden">
              <div className="bg-ui-bg-subtle p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-lg">{pincode}</span>
                  <span className="text-sm text-ui-fg-subtle">
                    {prices.length} dealer(s)
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  {bulkEditPincode === pincode ? (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        placeholder="New price"
                        className="w-32"
                        autoFocus
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          const price = parseFloat(bulkPrice);
                          if (!isNaN(price) && price > 0) {
                            onBulkUpdate(pincode, price);
                            setBulkEditPincode(null);
                            setBulkPrice("");
                          }
                        }}
                      >
                        Save All
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setBulkEditPincode(null);
                          setBulkPrice("");
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setBulkEditPincode(pincode);
                        setBulkPrice("");
                      }}
                    >
                      Update All Dealers
                    </Button>
                  )}
                </div>
              </div>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Dealer</Table.HeaderCell>
                    <Table.HeaderCell>Price (₹)</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {prices.map((priceEntry: any) => (
                    <Table.Row key={priceEntry.id}>
                      <Table.Cell>
                        {priceEntry.dealer?.name || "Unknown"}
                      </Table.Cell>
                      <Table.Cell>
                        {editingId === priceEntry.id ? (
                          <PriceEditCell
                            priceId={priceEntry.id}
                            currentPrice={Number(priceEntry.price)}
                            onUpdate={(id, price) => {
                              onUpdate(id, price);
                              setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <span>₹{Number(priceEntry.price).toFixed(2)}</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setEditingId(priceEntry.id)}
                          disabled={
                            editingId !== null || bulkEditPincode !== null
                          }
                        >
                          Edit
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          );
        })
      )}
    </div>
  );
};

/**
 * Inline editable price cell component
 */
const PriceEditCell = ({
  priceId,
  currentPrice,
  onUpdate,
  onCancel,
}: {
  priceId: string;
  currentPrice: number;
  onUpdate: (priceId: string, newPrice: number) => void;
  onCancel?: () => void;
}) => {
  const [value, setValue] = useState(currentPrice.toString());

  const handleSave = () => {
    const newPrice = parseFloat(value);
    if (!isNaN(newPrice) && newPrice > 0) {
      onUpdate(priceId, newPrice);
    }
  };

  const handleCancel = () => {
    setValue(currentPrice.toString());
    if (onCancel) onCancel();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <Button size="small" onClick={handleSave}>
        ✓
      </Button>
      <Button size="small" variant="secondary" onClick={handleCancel}>
        ✕
      </Button>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductPincodePricingWidget;
