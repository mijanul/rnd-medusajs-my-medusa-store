# Admin API Documentation - Pincode Pricing v2

## Medusa Native Pricing System

> **Week 2 Implementation**: Admin API & CSV Import
>
> This documentation covers the NEW admin endpoints that work with Medusa's native pricing system (regions, prices, price_rules).

---

## Overview

The Admin API provides full CRUD operations for managing pincode-based pricing:

1. **View** product pricing across pincodes
2. **Update** prices for specific pincodes
3. **Delete** prices for pincodes
4. **Upload** bulk prices via CSV/Excel
5. **Download** CSV templates

All endpoints use **Medusa's native pricing** system:

- Regions = Pincodes (e.g., `pincode-110001`)
- Prices = Stored in `price` table
- Price Rules = Link prices to regions

---

## Endpoints

### 1. Get Product Pricing Overview

**GET** `/admin/pincode-pricing-v2/products/:product_id`

Get all pincodes where a product is available with prices and statistics.

#### Request

```bash
GET /admin/pincode-pricing-v2/products/prod_123abc
```

#### Response

```json
{
  "product_id": "prod_123abc",
  "statistics": {
    "total_pincodes": 150,
    "price_range": {
      "min": 249900,
      "max": 299900,
      "avg": 274900,
      "min_formatted": "₹2,499.00",
      "max_formatted": "₹2,999.00",
      "avg_formatted": "₹2,749.00"
    },
    "coverage": {
      "states": 5,
      "cities": 12
    }
  },
  "pincodes": [
    {
      "pincode": "110001",
      "price": {
        "amount": 299900,
        "formatted": "₹2,999.00"
      },
      "location": {
        "city": "New Delhi",
        "state": "Delhi"
      },
      "delivery_days": 3
    }
  ],
  "by_state": {
    "Delhi": 45,
    "Maharashtra": 30
  },
  "by_city": {
    "New Delhi": 25,
    "Mumbai": 20
  }
}
```

#### Use Cases

- Admin dashboard: "Where is this product available?"
- View pricing distribution
- Export pricing data
- Analyze coverage by region

---

### 2. Update Product Price for Pincode

**POST** `/admin/pincode-pricing-v2/products/:product_id/prices`

Set or update the price for a product in a specific pincode.

#### Request

```bash
POST /admin/pincode-pricing-v2/products/prod_123abc/prices
Content-Type: application/json

{
  "pincode": "110001",
  "price": 299900,
  "delivery_days": 3
}
```

**Body Parameters:**

| Field           | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `pincode`       | string | ✅       | 6-digit pincode                |
| `price`         | number | ✅       | Price in cents (2999 = ₹29.99) |
| `delivery_days` | number | ❌       | Delivery time (default: 3)     |

#### Response

```json
{
  "success": true,
  "message": "Updated price for 2 variant(s)",
  "product": {
    "id": "prod_123abc",
    "title": "Premium Headphones"
  },
  "pincode": "110001",
  "region_id": "reg_123",
  "price": {
    "amount": 299900,
    "formatted": "₹2,999.00"
  },
  "delivery_days": 3,
  "updates": [
    {
      "variant_id": "var_123",
      "price_id": "price_456",
      "amount": 299900
    }
  ]
}
```

#### What Happens

1. **Region Creation**: If pincode doesn't exist, creates new region `pincode-110001`
2. **Price Update**: Updates all variant prices for this region
3. **Metadata**: Stores pincode and delivery_days in region metadata
4. **Price Rules**: Creates price_rule linking to region

#### Use Cases

- Admin sets price for new pincode
- Admin updates existing price
- Admin changes delivery days

---

### 3. Delete Product Price for Pincode

**DELETE** `/admin/pincode-pricing-v2/products/:product_id/pincodes/:pincode`

Remove price for a product in a specific pincode (makes product unavailable).

#### Request

```bash
DELETE /admin/pincode-pricing-v2/products/prod_123abc/pincodes/110001
```

#### Response

```json
{
  "success": true,
  "message": "Deleted price for 2 variant(s)",
  "product": {
    "id": "prod_123abc",
    "title": "Premium Headphones"
  },
  "pincode": "110001",
  "deleted_count": 2
}
```

#### Use Cases

- Admin stops selling in a pincode
- Admin removes incorrect price
- Admin updates serviceability

---

### 4. CSV/Excel Upload

**POST** `/admin/pincode-pricing-v2/upload`

Bulk upload prices for multiple products and pincodes via CSV or Excel file.

#### Request

```bash
POST /admin/pincode-pricing-v2/upload
Content-Type: application/json

{
  "file": "base64_encoded_file_content",
  "filename": "prices.csv"
}
```

**Body Parameters:**

| Field      | Type   | Required | Description                        |
| ---------- | ------ | -------- | ---------------------------------- |
| `file`     | string | ✅       | Base64 encoded file (CSV/XLSX/XLS) |
| `filename` | string | ❌       | Filename for type detection        |

#### CSV Format

```csv
SKU,110001,110002,110003,400001,400002,560001
product-handle-1,2999,3199,2899,2999,3099,2899
product-handle-2,1999,2099,1899,1999,2049,1899
product-handle-3,999,1099,899,999,1049,899
```

**Format Rules:**

- **First Row**: Header with pincodes
- **First Column**: Product SKU (handle)
- **Cells**: Prices in rupees (e.g., 2999 = ₹2999.00)
- **Empty Cells**: Product not available in that pincode

#### Response

```json
{
  "success": true,
  "message": "Successfully updated 450 prices for 75 products across 6 pincodes",
  "statistics": {
    "total_rows": 75,
    "products_processed": 75,
    "pincodes_found": 6,
    "prices_updated": 450,
    "regions_created": 3,
    "errors": 0
  },
  "errors": []
}
```

#### Error Response (Partial Success)

```json
{
  "success": true,
  "message": "Successfully updated 400 prices for 70 products across 6 pincodes",
  "statistics": {
    "total_rows": 75,
    "products_processed": 70,
    "pincodes_found": 6,
    "prices_updated": 400,
    "regions_created": 2,
    "errors": 5
  },
  "errors": [
    {
      "row": 12,
      "sku": "invalid-product",
      "message": "Product not found with handle: invalid-product"
    },
    {
      "row": 23,
      "sku": "product-handle-5",
      "pincode": "110001",
      "message": "Invalid price: abc"
    }
  ]
}
```

#### What Happens

1. **File Parsing**:

   - Detects CSV, XLSX, or XLS format
   - Handles tab and comma separators
   - Handles quoted values

2. **Region Management**:

   - Creates regions for new pincodes
   - Updates metadata for existing regions

3. **Price Updates**:

   - Updates prices for all product variants
   - Creates price_rules linking to regions
   - Converts rupees to cents automatically

4. **Error Handling**:
   - Continues processing even if some rows fail
   - Returns detailed error report
   - Status 207 if partial success

#### Use Cases

- Bulk price updates
- Initial data import
- Regular price synchronization
- Migration from old system

---

### 5. Download CSV Template

**GET** `/admin/pincode-pricing-v2/template`

Download a CSV template for bulk upload. Optionally prefill with existing prices.

#### Request

```bash
# Empty template
GET /admin/pincode-pricing-v2/template

# With specific pincodes
GET /admin/pincode-pricing-v2/template?pincodes=110001,110002,400001

# Prefilled with existing prices
GET /admin/pincode-pricing-v2/template?pincodes=110001,110002&prefill=true
```

**Query Parameters:**

| Field      | Type    | Required | Description                              |
| ---------- | ------- | -------- | ---------------------------------------- |
| `pincodes` | string  | ❌       | Comma-separated pincodes                 |
| `prefill`  | boolean | ❌       | Include existing prices (default: false) |

#### Response

**Content-Type:** `text/csv`
**Content-Disposition:** `attachment; filename="pincode-pricing-template.csv"`

```csv
SKU,110001,110002,110003
product-handle-1,2999,3199,2899
product-handle-2,1999,2099,1899
product-handle-3,,,
```

#### Use Cases

- Admin downloads template to fill out
- Admin exports current prices for editing
- Admin generates template for specific pincodes

---

## Error Codes

All endpoints follow a consistent error format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional details (dev mode only)"
}
```

### Common Error Codes

| Code                 | Status | Description                  |
| -------------------- | ------ | ---------------------------- |
| `MISSING_PRODUCT_ID` | 400    | Product ID not provided      |
| `INVALID_PINCODE`    | 400    | Pincode is not 6 digits      |
| `INVALID_PRICE`      | 400    | Price is negative or invalid |
| `PRODUCT_NOT_FOUND`  | 404    | Product doesn't exist        |
| `PINCODE_NOT_FOUND`  | 404    | No region for pincode        |
| `PRICE_NOT_FOUND`    | 404    | No price for product+pincode |
| `MISSING_FILE`       | 400    | File data not provided       |
| `INVALID_FILE`       | 400    | File format invalid          |
| `PROCESSING_ERROR`   | 500    | CSV processing failed        |
| `INTERNAL_ERROR`     | 500    | Server error                 |

---

## Integration Examples

### Example 1: Update Price via Admin Panel

```typescript
async function updateProductPrice(
  productId: string,
  pincode: string,
  price: number
) {
  const response = await fetch(
    `/admin/pincode-pricing-v2/products/${productId}/prices`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        pincode: pincode,
        price: price * 100, // Convert rupees to cents
        delivery_days: 3,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update price");
  }

  return await response.json();
}

// Usage
await updateProductPrice("prod_123", "110001", 2999);
```

### Example 2: Bulk Upload via CSV

```typescript
async function uploadPricingCSV(file: File) {
  // Read file as base64
  const base64 = await fileToBase64(file);

  const response = await fetch("/admin/pincode-pricing-v2/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
    }),
  });

  return await response.json();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Example 3: Download Template

```typescript
async function downloadTemplate(pincodes?: string[], prefill = false) {
  const params = new URLSearchParams();

  if (pincodes) {
    params.set("pincodes", pincodes.join(","));
  }

  if (prefill) {
    params.set("prefill", "true");
  }

  const response = await fetch(`/admin/pincode-pricing-v2/template?${params}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  // Download as file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pincode-pricing-template.csv";
  a.click();
}

// Usage
await downloadTemplate(["110001", "110002", "400001"], true);
```

---

## Testing

### Test CSV Upload

Create a test CSV file:

```csv
SKU,110001,110002,110003
test-product-1,2999,3199,2899
test-product-2,1999,2099,1899
```

Upload via cURL:

```bash
# Convert CSV to base64
base64_content=$(base64 -i test-prices.csv)

# Upload
curl -X POST http://localhost:9000/admin/pincode-pricing-v2/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d "{
    \"file\": \"$base64_content\",
    \"filename\": \"test-prices.csv\"
  }"
```

---

## Migration Notes

### Differences from Old System

| Feature          | Old System                     | New System                             |
| ---------------- | ------------------------------ | -------------------------------------- |
| **Storage**      | Custom `pincode_pricing` table | Medusa `region`, `price`, `price_rule` |
| **Dealers**      | Required dealer assignment     | Not needed (regions)                   |
| **Base Path**    | `/admin/pincode-pricing`       | `/admin/pincode-pricing-v2`            |
| **Price Format** | Stored as rupees               | Stored as cents                        |
| **Promotions**   | Manual implementation          | Automatic via Medusa                   |

### Backward Compatibility

- Old CSV format still works
- Old endpoints remain available during transition
- Data migrated to new system in Week 1 (Days 1-4)

---

## Next Steps

- **Week 3**: UI Components (Admin Dashboard, CSV Upload UI)
- **Week 4-5**: Testing & Deployment

---

## Support

For issues or questions:

1. Check error messages in response
2. Enable dev mode for detailed errors
3. Check Medusa logs for pricing module errors
4. Verify products exist before uploading

---

**Last Updated:** Week 2, Day 6  
**API Version:** v2 (Medusa Native Pricing)
