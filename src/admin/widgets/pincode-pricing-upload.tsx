/**
 * Week 3 - UI Component 1: CSV Upload Widget for Admin Dashboard (ENHANCED)
 *
 * This widget allows admins to upload CSV/Excel files for bulk price updates.
 *
 * Location: Will be displayed in admin dashboard
 * Enhanced Features:
 * - File upload (CSV, XLSX, XLS) with validation
 * - Drag & drop support
 * - File size limit (10MB)
 * - Progress indicator with percentage
 * - Toast notifications
 * - Error display with details
 * - Success summary with statistics
 * - Template download
 * - Recent upload history
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, Text, Badge, toast } from "@medusajs/ui";
import { useState, useRef } from "react";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

interface UploadHistory {
  id: string;
  filename: string;
  timestamp: Date;
  success: boolean;
  productsProcessed: number;
  pricesUpdated: number;
}

const PincodePricingUploadWidget = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB limit. Please use a smaller file.`,
      };
    }

    // Check file extension
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload ${ALLOWED_EXTENSIONS.join(
          ", "
        )} files only.`,
      };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      return {
        valid: false,
        error: `Invalid file format. Please upload CSV or Excel files only.`,
      };
    }

    return { valid: true };
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        toast.error("File Validation Failed", {
          description: validation.error,
          duration: 5000,
        });
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);
      toast.success("File Selected", {
        description: `${selectedFile.name} (${(
          selectedFile.size / 1024
        ).toFixed(2)} KB)`,
      });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validation = validateFile(droppedFile);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        toast.error("File Validation Failed", {
          description: validation.error,
          duration: 5000,
        });
        return;
      }

      setFile(droppedFile);
      setResult(null);
      setError(null);
      toast.success("File Dropped", {
        description: `${droppedFile.name} ready to upload`,
      });
    }
  };

  // Handle file upload with progress
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      // Simulate progress for file reading (0-20%)
      setUploadProgress(10);
      const base64 = await fileToBase64(file);
      setUploadProgress(20);

      // Show upload started toast
      toast.info("Upload Started", {
        description: `Processing ${file.name}...`,
      });

      // Simulate progress for upload (20-90%)
      setUploadProgress(50);

      // Upload to API
      const response = await fetch("/admin/pincode-pricing-v2/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          file: base64,
          filename: file.name,
        }),
      });

      setUploadProgress(90);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUploadProgress(100);
      setResult(data);

      // Add to history
      const historyItem: UploadHistory = {
        id: Date.now().toString(),
        filename: file.name,
        timestamp: new Date(),
        success: data.success,
        productsProcessed: data.statistics?.products_processed || 0,
        pricesUpdated: data.statistics?.prices_updated || 0,
      };
      setUploadHistory((prev) => [historyItem, ...prev].slice(0, 5)); // Keep last 5

      // Show success toast
      toast.success("Upload Complete!", {
        description: `${
          data.statistics?.products_processed || 0
        } products processed, ${
          data.statistics?.prices_updated || 0
        } prices updated`,
        duration: 7000,
      });

      // Clear file after successful upload
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message);
      setUploadProgress(0);

      // Show error toast
      toast.error("Upload Failed", {
        description: err.message || "An error occurred during upload",
        duration: 7000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      toast.info("Downloading Template", {
        description: "Preparing CSV template...",
      });

      const response = await fetch("/admin/pincode-pricing-v2/template", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pincode-pricing-template.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Template Downloaded", {
        description: "Fill in the template and upload it back",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to download template";
      setError(errorMsg);
      toast.error("Download Failed", {
        description: errorMsg,
        duration: 5000,
      });
    }
  };

  // Clear selection
  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h2">Pincode Pricing - Bulk Upload</Heading>
          <Text className="text-sm text-gray-600 mt-1">
            Upload CSV or Excel files to update prices for multiple pincodes at
            once
          </Text>
        </div>
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          📥 Download Template
        </Button>
      </div>

      <div className="space-y-6">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }
            ${
              uploading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-blue-400"
            }
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">
              {isDragging ? "📂" : file ? "✅" : "📄"}
            </div>

            {file ? (
              <>
                <Text className="font-medium text-gray-900">{file.name}</Text>
                <Text className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB • Ready to upload
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  disabled={uploading}
                >
                  Clear Selection
                </Button>
              </>
            ) : (
              <>
                <Text className="font-medium text-gray-700">
                  {isDragging ? "Drop file here" : "Drag & drop your file here"}
                </Text>
                <Text className="text-sm text-gray-500">
                  or click to browse • CSV, XLSX, XLS • Max{" "}
                  {MAX_FILE_SIZE / (1024 * 1024)}MB
                </Text>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Text className="text-gray-700">Uploading...</Text>
              <Text className="text-gray-700 font-medium">
                {uploadProgress}%
              </Text>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            isLoading={uploading}
            className="flex-1"
          >
            {uploading ? `Uploading ${uploadProgress}%` : "🚀 Upload Prices"}
          </Button>
          {file && !uploading && (
            <Button variant="secondary" onClick={handleClearFile}>
              Cancel
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <Text className="text-red-800 font-medium">Error</Text>
            <Text className="text-red-600">{error}</Text>
          </div>
        )}

        {/* Success Display */}
        {result && result.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <Text className="text-green-800 font-medium mb-2">
              ✓ Upload Successful
            </Text>
            <div className="space-y-1 text-sm">
              <Text className="text-green-700">
                • {result.statistics.products_processed} products processed
              </Text>
              <Text className="text-green-700">
                • {result.statistics.prices_updated} prices updated
              </Text>
              <Text className="text-green-700">
                • {result.statistics.regions_created} regions created
              </Text>
              {result.statistics.errors > 0 && (
                <Text className="text-orange-600">
                  ⚠ {result.statistics.errors} errors (see below)
                </Text>
              )}
            </div>
          </div>
        )}

        {/* Errors List */}
        {result && result.errors && result.errors.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-center justify-between mb-3">
              <Text className="text-orange-800 font-medium">
                ⚠️ Errors ({result.errors.length})
              </Text>
              <Badge color="orange">{result.errors.length} issues</Badge>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {result.errors.slice(0, 10).map((err: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 bg-white rounded border border-orange-200"
                >
                  <Text className="text-sm font-medium text-orange-900">
                    Row {err.row}
                  </Text>
                  <Text className="text-sm text-orange-700">{err.message}</Text>
                  {(err.sku || err.pincode) && (
                    <Text className="text-xs text-orange-600 mt-1">
                      {err.sku && `SKU: ${err.sku}`}
                      {err.sku && err.pincode && " • "}
                      {err.pincode && `Pincode: ${err.pincode}`}
                    </Text>
                  )}
                </div>
              ))}
              {result.errors.length > 10 && (
                <Text className="text-orange-600 text-sm text-center py-2">
                  ... and {result.errors.length - 10} more errors
                </Text>
              )}
            </div>
          </div>
        )}

        {/* Recent Upload History */}
        {uploadHistory.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <Text className="text-gray-800 font-medium mb-3">
              📋 Recent Uploads
            </Text>
            <div className="space-y-2">
              {uploadHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text className="text-sm font-medium text-gray-900">
                        {item.filename}
                      </Text>
                      <Badge
                        color={item.success ? "green" : "red"}
                        size="small"
                      >
                        {item.success ? "✓ Success" : "✗ Failed"}
                      </Badge>
                    </div>
                    <Text className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()} •
                      {item.productsProcessed} products •{item.pricesUpdated}{" "}
                      prices
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <Text className="text-blue-800 font-medium mb-2">📋 How to use:</Text>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Download the CSV template above</li>
            <li>Fill in prices for each product-pincode combination</li>
            <li>Leave cells empty for unavailable products</li>
            <li>Upload the completed CSV file</li>
          </ol>
        </div>

        {/* CSV Format Example */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <Text className="text-gray-800 font-medium mb-2">📝 CSV Format:</Text>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {`SKU,110001,110002,110003
product-handle-1,2999,3199,2899
product-handle-2,1999,2099,1899
product-handle-3,999,,899`}
          </pre>
          <Text className="text-xs text-gray-500 mt-2">
            • First row: Pincodes
            <br />
            • First column: Product SKU (handle)
            <br />
            • Prices in rupees (2999 = ₹2,999)
            <br />• Empty cells = not available
          </Text>
        </div>
      </div>
    </Container>
  );
};

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default PincodePricingUploadWidget;
