# Week 2 Quick Reference

## Admin API Endpoints - Pincode Pricing v2

> **Quick access guide for developers using the new Admin API**

---

## 🚀 Base URL

```
/admin/pincode-pricing-v2/
```

---

## 📡 Endpoints

### 1️⃣ Get Product Pricing Overview

```http
GET /admin/pincode-pricing-v2/products/:product_id
```

**Returns:** All pincodes, prices, statistics

**Example:**

```bash
curl http://localhost:9000/admin/pincode-pricing-v2/products/prod_123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 2️⃣ Update Product Price

```http
POST /admin/pincode-pricing-v2/products/:product_id/prices
```

**Body:**

```json
{
  "pincode": "110001",
  "price": 299900,
  "delivery_days": 3
}
```

**Example:**

```bash
curl -X POST http://localhost:9000/admin/pincode-pricing-v2/products/prod_123/prices \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pincode":"110001","price":299900,"delivery_days":3}'
```

---

### 3️⃣ Delete Product Price

```http
DELETE /admin/pincode-pricing-v2/products/:product_id/pincodes/:pincode
```

**Example:**

```bash
curl -X DELETE http://localhost:9000/admin/pincode-pricing-v2/products/prod_123/pincodes/110001 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 4️⃣ CSV Upload

```http
POST /admin/pincode-pricing-v2/upload
```

**Body:**

```json
{
  "file": "BASE64_ENCODED_FILE",
  "filename": "prices.csv"
}
```

**CSV Format:**

```csv
SKU,110001,110002,110003
product-handle-1,2999,3199,2899
product-handle-2,1999,2099,1899
```

**Example:**

```bash
base64_file=$(base64 -i prices.csv)
curl -X POST http://localhost:9000/admin/pincode-pricing-v2/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"file\":\"$base64_file\",\"filename\":\"prices.csv\"}"
```

---

### 5️⃣ Download Template

```http
GET /admin/pincode-pricing-v2/template
GET /admin/pincode-pricing-v2/template?pincodes=110001,110002
GET /admin/pincode-pricing-v2/template?pincodes=110001&prefill=true
```

**Example:**

```bash
curl http://localhost:9000/admin/pincode-pricing-v2/template?pincodes=110001,110002 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o template.csv
```

---

## 🧪 Testing

### Run Test Suite

```bash
npx tsx src/scripts/test-admin-api-routes.ts
```

### Environment Variables

```bash
export MEDUSA_BACKEND_URL="http://localhost:9000"
export ADMIN_EMAIL="admin@medusa-test.com"
export ADMIN_PASSWORD="supersecret"
```

---

## 🔧 Common Use Cases

### Update Single Price

```typescript
await fetch(`/admin/pincode-pricing-v2/products/${productId}/prices`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    pincode: "110001",
    price: 299900, // ₹2,999 in cents
    delivery_days: 3,
  }),
});
```

### Bulk Upload CSV

```typescript
// Convert file to base64
const base64 = await fileToBase64(file);

// Upload
await fetch("/admin/pincode-pricing-v2/upload", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    file: base64,
    filename: file.name,
  }),
});
```

### Download Template

```typescript
const response = await fetch(
  "/admin/pincode-pricing-v2/template?pincodes=110001,110002&prefill=true",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "template.csv";
a.click();
```

---

## ⚠️ Error Codes

| Code                 | Status | Meaning                |
| -------------------- | ------ | ---------------------- |
| `MISSING_PRODUCT_ID` | 400    | Product ID missing     |
| `INVALID_PINCODE`    | 400    | Pincode not 6 digits   |
| `INVALID_PRICE`      | 400    | Price negative/invalid |
| `PRODUCT_NOT_FOUND`  | 404    | Product doesn't exist  |
| `PINCODE_NOT_FOUND`  | 404    | Region not found       |
| `PRICE_NOT_FOUND`    | 404    | Price not found        |
| `MISSING_FILE`       | 400    | File data missing      |
| `INVALID_FILE`       | 400    | File format invalid    |
| `PROCESSING_ERROR`   | 500    | CSV processing failed  |
| `INTERNAL_ERROR`     | 500    | Server error           |

---

## 💾 Data Format

### Price Format

**In API:** Cents (299900 = ₹2,999.00)  
**In CSV:** Rupees (2999 = ₹2,999.00)

### Pincode Format

**Always:** 6 digits (e.g., "110001")

### SKU Format

**Use:** Product handle (e.g., "premium-headphones")

---

## 📚 Full Documentation

- [Admin API Documentation](./ADMIN_API_DOCUMENTATION_V2.md)
- [Week 2 Summary](./WEEK_2_SUMMARY.md)
- [Store API Documentation](./STORE_API_DOCUMENTATION.md)

---

**Last Updated:** Week 2, Day 6  
**Version:** 2.0 (Medusa Native Pricing)
