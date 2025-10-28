import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, toast, Label } from "@medusajs/ui";
import { useState, useRef } from "react";
import { ArrowDownTray, ArrowUpTray, MapPin } from "@medusajs/icons";

const PincodePricingPage = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      toast.info("Downloading CSV template...");

      const response = await fetch(
        `/admin/pincode-pricing/template?format=csv`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pricing-template-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("CSV template downloaded successfully!");
      } else {
        toast.error("Failed to download template");
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - only CSV
      const validTypes = [".csv", "text/csv"];
      const isValid =
        validTypes.some((type) => file.name.endsWith(type)) ||
        validTypes.some((type) => file.type.includes(type));

      if (!isValid) {
        toast.error("Please select a CSV file (.csv)");
        return;
      }
      setCsvFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleUploadCSV = async () => {
    if (!csvFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // Read as text for CSV files
      const fileData = await csvFile.text();

      const response = await fetch("/admin/pincode-pricing/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv_data: fileData, file_type: "csv" }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Successfully uploaded ${data.imported} prices! ${
            data.failed > 0 ? `(${data.failed} failed)` : ""
          }`
        );
        if (data.errors && data.errors.length > 0) {
          console.error("Upload errors:", data.errors);
        }
        // Clear the file input
        setCsvFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-4 p-8">
      <div className="flex items-center justify-between">
        <Heading level="h1">Pincode-Based Pricing</Heading>
      </div>

      <Container>
        <div className="p-6 space-y-6">
          <div>
            <Heading level="h2" className="mb-4">
              Upload Pricing File
            </Heading>
            <p className="text-ui-fg-subtle text-sm mb-4">
              Download the CSV template with pincodes as columns, fill in prices
              for each product and pincode, then upload the file here. Note:
              Products do not have variants.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleDownloadTemplate}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowDownTray />
              Download CSV Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File to Upload</Label>
            <div className="border border-ui-border-base rounded-lg p-4">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-ui-fg-subtle
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-ui-bg-base file:text-ui-fg-base
                  hover:file:bg-ui-bg-subtle-hover
                  cursor-pointer"
              />
            </div>
            {csvFile && (
              <p className="text-xs text-ui-fg-subtle flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Selected: <strong>{csvFile.name}</strong> (
                {(csvFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-ui-fg-subtle">
              Accepts CSV (.csv) files only
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleUploadCSV}
              disabled={uploading || !csvFile}
              className="flex items-center gap-2"
            >
              <ArrowUpTray />
              {uploading ? "Uploading..." : "Upload Pricing File"}
            </Button>
            {csvFile && (
              <Button
                onClick={() => {
                  setCsvFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                variant="secondary"
              >
                Clear
              </Button>
            )}
          </div>
          <div className="bg-ui-bg-subtle p-4 rounded-md border border-ui-border-base">
            <p className="text-sm font-medium mb-2">
              📝 CSV File Format (Pincodes as Columns):
            </p>
            <ul className="text-sm text-ui-fg-subtle space-y-1 list-disc list-inside">
              <li>
                <strong>Column 1 - sku</strong>: Product SKU (e.g., SHIRT-001)
              </li>
              <li>
                <strong>Column 2 - product_id</strong>: Medusa product ID (from
                database)
              </li>
              <li>
                <strong>Column 3 - product_title</strong>: Product name (for
                reference only)
              </li>
              <li>
                <strong>Column 4+ - Pincodes</strong>: Each remaining column is
                a pincode with prices
              </li>
              <li>Leave cells empty where product is not available</li>
              <li>Prices in INR (e.g., 2999 for ₹2999)</li>
              <li className="text-green-700 font-medium">
                <strong>Existing prices are pre-filled</strong> in the
                downloaded template
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Pincode Pricing",
  icon: MapPin,
});

export default PincodePricingPage;
