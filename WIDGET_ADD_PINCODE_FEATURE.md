# Widget Enhancement: Add Pincode Pricing Form

## Summary

Added functionality to create new pincode prices directly from the widget, with support for adding multiple pincodes at once. Also fixed CSV link to open in same tab instead of new tab.

---

## Changes Made

### 1. Widget UI - Add Pincode Form

**File**: `src/admin/widgets/product-pincode-pricing.tsx`

**New Features**:

- ✅ "Add Pincode" button in header
- ✅ Collapsible form to add new pincodes
- ✅ "Add More" button to add multiple pincodes at once
- ✅ Input validation (6-digit pincode, positive price)
- ✅ "Save All" button to bulk create
- ✅ Cancel button to close form

**New States**:

```typescript
const [showAddForm, setShowAddForm] = useState(false);
const [newPincodes, setNewPincodes] = useState<
  Array<{ pincode: string; price: string }>
>([{ pincode: "", price: "" }]);
```

**New Handlers**:

- `handleAddPincode()` - Add another pincode row
- `handleRemovePincode(index)` - Remove a pincode row
- `handlePincodeChange(index, field, value)` - Update pincode/price
- `handleSavePincodes()` - Save all new pincodes via API

---

### 2. CSV Link Fix

**Before**:

```typescript
onClick={() => window.open("/app/pincode-pricing", "_blank")}
```

**After**:

```typescript
onClick={() => window.location.href = "/app/pincode-pricing"}
```

**Result**: CSV page now opens in same tab instead of new tab ✅

---

### 3. New API Endpoint

**File**: `src/api/admin/pincode-pricing/prices/route.ts`

**Added**: `POST /admin/pincode-pricing/prices`

**Request Body**:

```json
{
  "product_id": "prod_123",
  "prices": [
    { "pincode": "110001", "price": 2500 },
    { "pincode": "110002", "price": 2600 },
    { "pincode": "110003", "price": 2700 }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "created": 3,
  "prices": [...],
  "errors": [
    { "pincode": "110004", "error": "Pincode already exists for this product" }
  ]
}
```

**Features**:

- ✅ Validates pincode format (6 digits)
- ✅ Validates price (positive number)
- ✅ Checks for duplicates (product_id + pincode)
- ✅ Returns created entries and any errors
- ✅ Gets product SKU automatically

---

## UI Screenshots

### Header with Add Pincode Button

```
┌──────────────────────────────────────────────────────────────┐
│ Pincode-Based Pricing                                        │
│ Manage prices for different pincodes                         │
│                                                               │
│            [Add Pincode] [Sync] [Manage via CSV]            │
└──────────────────────────────────────────────────────────────┘
```

### Add Pincode Form (Collapsed)

```
┌──────────────────────────────────────────────────────────────┐
│ Add New Pincodes                                             │
├──────────────────────────────────────────────────────────────┤
│ [Pincode (6 digits)    ] [Price (₹)        ] [Remove]       │
│ [Pincode (6 digits)    ] [Price (₹)        ] [Remove]       │
│ [Pincode (6 digits)    ] [Price (₹)        ] [Remove]       │
├──────────────────────────────────────────────────────────────┤
│ [+ Add More]  [Save All]                                     │
└──────────────────────────────────────────────────────────────┘
```

### Example Usage

**Step 1**: Click "Add Pincode" button

```
Form appears with one empty row
```

**Step 2**: Enter first pincode

```
Pincode: 110001
Price: 2500
```

**Step 3**: Click "+ Add More" for additional pincodes

```
Row 1: 110001, 2500
Row 2: 110002, 2600
Row 3: 110003, 2700
```

**Step 4**: Click "Save All"

```
✅ Successfully added 3 pincode(s)
Form closes, widget refreshes
```

---

## Validation Rules

### Pincode Validation

- ✅ Must be exactly 6 digits
- ✅ Cannot be empty
- ✅ Must be numeric only
- ❌ Invalid: "1100" (too short)
- ❌ Invalid: "11000A" (contains letter)
- ✅ Valid: "110001"

### Price Validation

- ✅ Must be positive number
- ✅ Cannot be empty
- ✅ Decimal allowed (e.g., 2500.50)
- ❌ Invalid: "0" (must be > 0)
- ❌ Invalid: "-100" (negative)
- ✅ Valid: "2500" or "2500.50"

### Duplicate Check

- ✅ Checks if pincode already exists for this product
- ✅ Shows error: "Pincode already exists for this product"
- ✅ Skips duplicate, creates others

---

## User Workflows

### Workflow 1: Add Single Pincode

```
1. Click "Add Pincode" button
2. Enter pincode: 110001
3. Enter price: 2500
4. Click "Save All"
5. ✅ Success toast appears
6. Form closes automatically
7. Widget refreshes with new pincode
```

### Workflow 2: Add Multiple Pincodes

```
1. Click "Add Pincode" button
2. Enter first pincode: 110001, price: 2500
3. Click "+ Add More"
4. Enter second pincode: 110002, price: 2600
5. Click "+ Add More"
6. Enter third pincode: 110003, price: 2700
7. Click "Save All"
8. ✅ Successfully added 3 pincode(s)
9. Form closes, widget shows all 3 new pincodes
```

### Workflow 3: Remove Unwanted Row

```
1. Click "Add Pincode" button
2. Enter pincode 1: 110001, 2500
3. Click "+ Add More"
4. Enter pincode 2: 110002, 2600
5. Click "+ Add More"
6. Changed mind about third pincode
7. Click "Remove" on third row
8. Now have 2 rows
9. Click "Save All"
10. ✅ Successfully added 2 pincode(s)
```

### Workflow 4: Cancel Adding

```
1. Click "Add Pincode" button
2. Form opens
3. Start entering data
4. Changed mind
5. Click "Cancel" (or "Add Pincode" button again)
6. Form closes without saving
7. No changes made
```

---

## Error Handling

### Client-Side Validation

**Empty Fields**:

```
User clicks "Save All" with empty fields
❌ Toast: "Please enter at least one pincode and price"
```

**Invalid Pincode Format**:

```
User enters: "1100" (only 4 digits)
❌ Toast: "Pincode must be exactly 6 digits"
```

**Invalid Price**:

```
User enters: "-100" (negative)
❌ Toast: "Price must be a positive number"
```

### Server-Side Validation

**Duplicate Pincode**:

```json
{
  "success": true,
  "created": 2,
  "errors": [
    { "pincode": "110001", "error": "Pincode already exists for this product" }
  ]
}
```

**Product Not Found**:

```json
{
  "message": "Product not found"
}
Status: 404
```

---

## API Details

### POST /admin/pincode-pricing/prices

**Purpose**: Create multiple pincode prices for a product

**Authentication**: Required (admin only)

**Request**:

```typescript
{
  product_id: string; // Product ID
  prices: Array<{
    pincode: string; // 6-digit pincode
    price: number; // Positive number
  }>;
}
```

**Response Success**:

```typescript
{
  success: true;
  created: number;        // Number of prices created
  prices: Array<...>;     // Created price objects
  errors?: Array<{        // Optional errors array
    pincode: string;
    error: string;
  }>;
}
```

**Response Error**:

```typescript
{
  message: string;
  error?: string;
}
```

**Status Codes**:

- `200` - Success (even if some pincodes failed)
- `400` - Bad request (missing product_id or prices)
- `404` - Product not found
- `500` - Server error

---

## Implementation Details

### State Management

**Form Visibility**:

```typescript
const [showAddForm, setShowAddForm] = useState(false);
```

**Pincode Entries**:

```typescript
const [newPincodes, setNewPincodes] = useState<
  Array<{ pincode: string; price: string }>
>([
  { pincode: "", price: "" }, // Start with one empty row
]);
```

### Add Row Function

```typescript
const handleAddPincode = () => {
  setNewPincodes([...newPincodes, { pincode: "", price: "" }]);
};
```

### Remove Row Function

```typescript
const handleRemovePincode = (index: number) => {
  const updated = newPincodes.filter((_, i) => i !== index);
  setNewPincodes(updated);
};
```

### Update Field Function

```typescript
const handlePincodeChange = (
  index: number,
  field: "pincode" | "price",
  value: string
) => {
  const updated = [...newPincodes];
  updated[index][field] = value;
  setNewPincodes(updated);
};
```

---

## Testing Checklist

### UI Tests

- [ ] Click "Add Pincode" - form appears
- [ ] Click "Cancel" - form closes
- [ ] Enter pincode and price - inputs work
- [ ] Click "+ Add More" - new row appears
- [ ] Click "Remove" - row disappears
- [ ] Remove button disabled when only 1 row
- [ ] Form stays visible while entering data

### Validation Tests

- [ ] Empty pincode - shows error
- [ ] 5-digit pincode - shows error
- [ ] 7-digit pincode - shows error
- [ ] Pincode with letters - shows error
- [ ] Valid 6-digit pincode - accepts
- [ ] Zero price - shows error
- [ ] Negative price - shows error
- [ ] Valid positive price - accepts
- [ ] Decimal price (2500.50) - accepts

### API Tests

- [ ] Create single pincode - success
- [ ] Create multiple pincodes - success
- [ ] Create duplicate pincode - error shown but others created
- [ ] Invalid product_id - 404 error
- [ ] Widget refreshes after successful save
- [ ] Form closes after successful save
- [ ] Success toast appears

### CSV Link Tests

- [ ] Click "Manage via CSV" in header - opens same tab
- [ ] Click "Upload CSV" in empty state - opens same tab
- [ ] No new tabs opened

---

## Benefits

### 1. Faster Workflow

- ✅ No need to switch to CSV page for simple additions
- ✅ Add 1-5 pincodes quickly from widget
- ✅ Immediate feedback and validation

### 2. Better UX

- ✅ All operations in one place
- ✅ CSV link opens in same tab (no tab clutter)
- ✅ Clear error messages
- ✅ Bulk add with "Add More"

### 3. Data Integrity

- ✅ Client-side validation before API call
- ✅ Server-side validation for duplicates
- ✅ Partial success (creates valid ones, skips invalid)
- ✅ Clear error reporting

---

## Files Modified/Created

1. ✅ `src/admin/widgets/product-pincode-pricing.tsx` - Added form UI and handlers
2. ✅ `src/api/admin/pincode-pricing/prices/route.ts` - Added POST endpoint

---

## Summary

✅ **"Add Pincode" button in widget**  
✅ **Add multiple pincodes with "Add More"**  
✅ **Client + server validation**  
✅ **CSV opens in same tab**  
✅ **Clean, intuitive UI**

Your widget now supports creating pincodes directly without leaving the product page! 🎉
