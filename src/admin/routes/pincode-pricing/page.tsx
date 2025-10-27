import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  toast,
  Label,
  Textarea,
} from "@medusajs/ui";
import { useState } from "react";
import { ArrowDownTray, ArrowUpTray, MapPin } from "@medusajs/icons";

const PincodePricingPage = () => {
  const [csvData, setCsvData] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      toast.info("Downloading CSV template...");

      const response = await fetch("/admin/pincode-pricing/template", {
        credentials: "include",
      });

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

        toast.success("Template downloaded successfully!");
      } else {
        toast.error("Failed to download template");
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleUploadCSV = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/admin/pincode-pricing/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv_data: csvData }),
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
        setCsvData("");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to upload CSV");
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Failed to upload CSV");
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
              Upload Pricing CSV
            </Heading>
            <p className="text-ui-fg-subtle text-sm mb-4">
              Download the template with pincodes as columns, fill in prices for
              each variant and pincode, then upload it here.
            </p>
          </div>

          <div className="flex gap-4">
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
            <Label htmlFor="csv-data">Paste CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder="skuvariant_idproduct_titlevariant_title110001400001560001
SHIRT-S-BLACKvar_123Medusa T-ShirtS / Black299931992899"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-ui-fg-subtle">
              Copy the entire CSV content including headers and paste it here
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleUploadCSV}
              disabled={uploading || !csvData.trim()}
              className="flex items-center gap-2"
            >
              <ArrowUpTray />
              {uploading ? "Uploading..." : "Upload Pricing CSV"}
            </Button>
            {csvData && (
              <Button onClick={() => setCsvData("")} variant="secondary">
                Clear
              </Button>
            )}
          </div>

          <div className="bg-ui-bg-subtle p-4 rounded-md border border-ui-border-base">
            <p className="text-sm font-medium mb-2">
              📝 New CSV Format (Pincodes as Columns):
            </p>
            <ul className="text-sm text-ui-fg-subtle space-y-1 list-disc list-inside">
              <li>
                <strong>Column 1 - sku</strong>: Product SKU (e.g.,
                SHIRT-S-BLACK)
              </li>
              <li>
                <strong>Column 2 - variant_id</strong>: Medusa variant ID (from
                template)
              </li>
              <li>
                <strong>Column 3 - product_title</strong>: Product name (for
                reference)
              </li>
              <li>
                <strong>Column 4 - variant_title</strong>: Variant name (for
                reference)
              </li>
              <li>
                <strong>Columns 5+ - Pincodes</strong>: Each column header is a
                6-digit pincode
              </li>
              <li>
                <strong>Cell values</strong>: Price in INR for that
                variant-pincode combination
              </li>
              <li>
                Leave cells empty if variant not available in that pincode
              </li>
            </ul>
            <div className="mt-3 p-3 bg-ui-bg-base rounded border border-ui-border-strong">
              <p className="text-xs font-medium mb-2">Example:</p>
              <pre className="text-xs overflow-x-auto">
                {`sku              variant_id    product_title    variant_title    110001    400001    560001
SHIRT-S-BLACK    var_123       Medusa T-Shirt   S / Black        2999      3199      2899
SHIRT-M-WHITE    var_124       Medusa T-Shirt   M / White        3199      3399      3099`}
              </pre>
            </div>
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
