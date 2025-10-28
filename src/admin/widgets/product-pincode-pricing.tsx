import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, Input, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";

/**
 * Pincode Pricing Widget for Product Detail Page
 *
 * Displays and manages pincode-based prices for a product.
 * Features:
 * 1. One price per pincode (applies to all dealers)
 * 2. Search by pincode
 * 3. Edit individual prices
 * 4. Unique constraint: product_id + pincode
 */
const ProductPincodePricingWidget = ({ data }: { data: any }) => {
  const [pincodePrices, setPincodePrices] = useState<any[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchPincode, setSearchPincode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPincodes, setNewPincodes] = useState<
    Array<{ pincode: string; price: string }>
  >([{ pincode: "", price: "" }]);

  const productId = data?.id;

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        console.log("Fetching prices for product ID:", productId);

        // Fetch pincode prices for this product
        const pricesResponse = await fetch(
          `/admin/pincode-pricing/prices?product_id=${productId}`,
          {
            credentials: "include",
          }
        );

        if (pricesResponse.ok) {
          const pricesData = await pricesResponse.json();
          console.log("Fetched prices data:", pricesData);
          setPincodePrices(pricesData.prices || []);
          setFilteredPrices(pricesData.prices || []);
        } else {
          console.error("Failed to fetch prices:", pricesResponse.status);
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

  const handlePriceDelete = async (priceId: string) => {
    if (!confirm("Are you sure you want to delete this price?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/pincode-pricing/prices/${priceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Price deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to delete price");
      }
    } catch (error) {
      console.error("Error deleting price:", error);
      toast.error("Error deleting price");
    }
  };

  const handleAddPincode = () => {
    setNewPincodes([...newPincodes, { pincode: "", price: "" }]);
  };

  const handleRemovePincode = (index: number) => {
    const updated = newPincodes.filter((_, i) => i !== index);
    setNewPincodes(updated);
  };

  const handlePincodeChange = (
    index: number,
    field: "pincode" | "price",
    value: string
  ) => {
    const updated = [...newPincodes];
    updated[index][field] = value;
    setNewPincodes(updated);
  };

  const handleSavePincodes = async () => {
    // Validate inputs
    const validPincodes = newPincodes.filter(
      (item) => item.pincode.trim() !== "" && item.price.trim() !== ""
    );

    if (validPincodes.length === 0) {
      toast.error("Please enter at least one pincode and price");
      return;
    }

    // Validate pincode format (6 digits)
    const invalidPincodes = validPincodes.filter(
      (item) => !/^\d{6}$/.test(item.pincode.trim())
    );

    if (invalidPincodes.length > 0) {
      toast.error("Pincode must be exactly 6 digits");
      return;
    }

    // Validate price (positive number)
    const invalidPrices = validPincodes.filter(
      (item) => isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0
    );

    if (invalidPrices.length > 0) {
      toast.error("Price must be a positive number");
      return;
    }

    try {
      const response = await fetch(`/admin/pincode-pricing/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          prices: validPincodes.map((item) => ({
            pincode: item.pincode.trim(),
            price: parseFloat(item.price),
          })),
        }),
      });

      console.log("Create request - Product ID:", productId);
      console.log("Create request - Pincodes:", validPincodes);

      if (response.ok) {
        const result = await response.json();
        console.log("Create response:", result);
        toast.success(`Successfully added ${validPincodes.length} pincode(s)`);
        setShowAddForm(false);
        setNewPincodes([{ pincode: "", price: "" }]);
        setRefreshKey((prev) => prev + 1);
      } else {
        const error = await response.json();
        console.error("Create failed:", error);
        toast.error(error.message || "Failed to add pincodes");
      }
    } catch (error) {
      console.error("Error adding pincodes:", error);
      toast.error("Error adding pincodes");
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

  // Pagination calculations for grouped view
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
              Manage prices for different pincodes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : "Add Pincode"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSyncFromCurrency}
              disabled={loading}
            >
              Sync from Currency Price
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/app/pincode-pricing")}
            >
              Manage via CSV
            </Button>
          </div>
        </div>

        {/* Add Pincode Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-ui-bg-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add New Pincodes</h3>
            </div>
            <div className="space-y-3">
              {newPincodes.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Pincode (6 digits)"
                      value={item.pincode}
                      onChange={(e) =>
                        handlePincodeChange(index, "pincode", e.target.value)
                      }
                      maxLength={6}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price (₹)"
                      value={item.price}
                      onChange={(e) =>
                        handlePincodeChange(index, "price", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleRemovePincode(index)}
                    disabled={newPincodes.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={handleAddPincode}>
                + Add More
              </Button>
              <Button variant="primary" onClick={handleSavePincodes}>
                Save All
              </Button>
            </div>
          </div>
        )}

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
                  onClick={() =>
                    (window.location.href = "/app/pincode-pricing")
                  }
                >
                  Upload CSV
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Search Controls */}
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search by pincode (e.g., 110001)"
                value={searchPincode}
                onChange={(e) => setSearchPincode(e.target.value)}
                className="w-full max-w-md"
              />
            </div>

            {/* Statistics */}
            <div className="mb-4 p-4 bg-ui-bg-subtle rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">Total Pincodes:</span>{" "}
                  {Object.keys(pricesByPincode).length}
                </div>
                <div>
                  <span className="font-medium">Showing:</span>{" "}
                  {filteredPrices.length} results
                </div>
              </div>
            </div>

            {/* Grouped View */}
            <GroupedView
              pricesByPincode={pricesByPincode}
              pincodes={paginatedPincodes}
              onUpdate={handlePriceUpdate}
              onDelete={handlePriceDelete}
            />

            {/* Pagination Controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-ui-fg-subtle">
                Showing {pincodeStartIndex + 1}-
                {Math.min(pincodeEndIndex, filteredPincodes.length)} of{" "}
                {filteredPincodes.length} pincodes
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
                    Page {currentPage} of {totalPincodePages}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={currentPage === totalPincodePages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

/**
 * Grouped View Component - Shows prices grouped by pincode
 */
const GroupedView = ({
  pricesByPincode,
  pincodes,
  onUpdate,
  onDelete,
}: {
  pricesByPincode: Record<string, any[]>;
  pincodes: string[];
  onUpdate: (id: string, price: number) => void;
  onDelete: (id: string) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {pincodes.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          No prices found for the search criteria
        </div>
      ) : (
        pincodes.map((pincode: string) => {
          const prices = pricesByPincode[pincode];
          // Should only be one price per pincode now
          const priceEntry = prices[0];

          return (
            <div key={pincode} className="border rounded-lg overflow-hidden">
              <div className="bg-ui-bg-subtle p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-lg">{pincode}</span>
                </div>
                <div className="flex gap-2 items-center">
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
                    <>
                      <span className="font-semibold text-lg">
                        ₹{Number(priceEntry.price).toFixed(2)}
                      </span>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setEditingId(priceEntry.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => onDelete(priceEntry.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
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
