# Pincode Error Handling - "We Don't Serve Your Area"

## Overview

The pincode pricing system now provides clear, user-friendly error messages when a pincode is not serviceable, including the prominent "We don't serve your area" message.

## ✅ Updated Error Messages

### Before

- ❌ "Pincode 110001 is not serviceable" - Technical
- ❌ "No price found for product..." - Confusing
- ❌ Generic error messages

### After

- ✅ **"Sorry, we don't serve your area yet. Please try a different pincode."** - User-friendly
- ✅ **"This product is not available in your area at the moment."** - Clear distinction
- ✅ Includes error codes for programmatic handling
- ✅ Helpful suggestions for users

---

## 🎯 API Endpoints & Error Responses

### 1. Check Pincode Serviceability

**Endpoint:** `GET /store/pincode-check?code={pincode}`

#### Success Response (200)

```json
{
  "pincode": "110001",
  "is_serviceable": true,
  "delivery_days": 3,
  "is_cod_available": true,
  "dealer_name": "Delhi Warehouse",
  "alternative_dealers": 2
}
```

#### Error: Invalid Pincode (400)

```json
{
  "message": "Please enter a valid 6-digit pincode",
  "is_serviceable": false
}
```

#### Error: Pincode Not Serviceable (404)

```json
{
  "pincode": "999999",
  "is_serviceable": false,
  "message": "Sorry, we don't serve your area yet. Please check back later or contact support.",
  "error": "PINCODE_NOT_SERVICEABLE"
}
```

---

### 2. Get Product Price by Pincode

**Endpoint:** `GET /store/products/{product_id}/pincode-price?pincode={pincode}`

#### Success Response (200)

```json
{
  "product_id": "prod_01J...",
  "pincode": "110001",
  "price": 2999,
  "price_formatted": "₹2999.00",
  "currency": "INR",
  "dealer": "Delhi Warehouse",
  "delivery_days": 3,
  "is_cod_available": true
}
```

#### Error: Invalid Pincode (400)

```json
{
  "message": "Please enter a valid 6-digit pincode",
  "error": "INVALID_PINCODE"
}
```

#### Error: Pincode Not Serviceable (404)

```json
{
  "product_id": "prod_01J...",
  "pincode": "999999",
  "message": "Sorry, we don't serve your area yet. Please try a different pincode.",
  "error": "PINCODE_NOT_SERVICEABLE"
}
```

#### Error: Product Not Available in Pincode (404)

```json
{
  "product_id": "prod_01J...",
  "pincode": "110001",
  "message": "This product is not available in your area at the moment.",
  "error": "PRODUCT_NOT_AVAILABLE_IN_PINCODE"
}
```

---

## 🔧 Error Codes

| Error Code                         | HTTP Status | Meaning                                       | User Message                                               |
| ---------------------------------- | ----------- | --------------------------------------------- | ---------------------------------------------------------- |
| `INVALID_PINCODE`                  | 400         | Pincode format invalid (not 6 digits)         | "Please enter a valid 6-digit pincode"                     |
| `PINCODE_NOT_SERVICEABLE`          | 404         | Pincode not in serviceable areas              | "Sorry, we don't serve your area yet"                      |
| `PRODUCT_NOT_AVAILABLE_IN_PINCODE` | 404         | Pincode serviceable but product not available | "This product is not available in your area at the moment" |

---

## 🎨 Frontend Integration Examples

### Example 1: Check Pincode Availability

```javascript
async function checkPincodeAvailability(pincode) {
  try {
    const response = await fetch(`/store/pincode-check?code=${pincode}`);
    const data = await response.json();

    if (response.ok && data.is_serviceable) {
      // Show success message
      showSuccess(
        `Great! We deliver to ${pincode} in ${data.delivery_days} days`
      );
      return true;
    } else if (data.error === "PINCODE_NOT_SERVICEABLE") {
      // Show user-friendly error
      showError(
        "Sorry, we don't serve your area yet. Please try a different pincode."
      );
      return false;
    }
  } catch (error) {
    showError("Unable to check pincode. Please try again.");
    return false;
  }
}
```

### Example 2: Get Product Price

```javascript
async function getProductPrice(productId, pincode) {
  try {
    const response = await fetch(
      `/store/products/${productId}/pincode-price?pincode=${pincode}`
    );
    const data = await response.json();

    if (response.ok) {
      // Show price
      displayPrice(data.price_formatted, data.delivery_days);
      return data;
    } else {
      // Handle different error types
      if (data.error === "PINCODE_NOT_SERVICEABLE") {
        showError("😔 We don't serve your area yet");
      } else if (data.error === "PRODUCT_NOT_AVAILABLE_IN_PINCODE") {
        showError("This product is not available in your area");
      } else {
        showError(data.message);
      }
      return null;
    }
  } catch (error) {
    showError("Unable to fetch price. Please try again.");
    return null;
  }
}
```

### Example 3: React Component

```jsx
import { useState } from "react";

function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  const checkPincode = async () => {
    setError("");
    setDeliveryInfo(null);

    if (pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    const response = await fetch(`/store/pincode-check?code=${pincode}`);
    const data = await response.json();

    if (response.ok && data.is_serviceable) {
      setDeliveryInfo(data);
    } else if (data.error === "PINCODE_NOT_SERVICEABLE") {
      setError(
        "😔 Sorry, we don't serve your area yet. Please try a different pincode."
      );
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="pincode-checker">
      <input
        type="text"
        value={pincode}
        onChange={(e) => setPincode(e.target.value)}
        placeholder="Enter pincode"
        maxLength={6}
      />
      <button onClick={checkPincode}>Check Availability</button>

      {error && <div className="error-message">{error}</div>}

      {deliveryInfo && (
        <div className="success-message">
          ✅ We deliver to {pincode} in {deliveryInfo.delivery_days} days!
          {deliveryInfo.is_cod_available && <span> • COD Available</span>}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 UI/UX Best Practices

### 1. Error Message Display

```html
<!-- Bad ❌ -->
<div class="error">Error: Pincode 123456 is not serviceable</div>

<!-- Good ✅ -->
<div class="error-banner">
  <span class="icon">😔</span>
  <div>
    <strong>We don't serve your area yet</strong>
    <p>
      Please try a different pincode or <a href="/contact">contact support</a>
    </p>
  </div>
</div>
```

### 2. Progressive Enhancement

```javascript
// Step 1: Validate format first (client-side)
if (!/^\d{6}$/.test(pincode)) {
  showError("Please enter a valid 6-digit pincode");
  return;
}

// Step 2: Check serviceability
const check = await checkPincode(pincode);

// Step 3: Get product-specific pricing
if (check.is_serviceable) {
  const price = await getProductPrice(productId, pincode);
}
```

### 3. Helpful Suggestions

```javascript
function showPincodeError(pincode) {
  const nearbyPincodes = getNearbyServiceablePincodes(pincode);

  showError({
    title: "We don't serve your area yet",
    message: "Sorry, we don't deliver to " + pincode,
    suggestions:
      nearbyPincodes.length > 0
        ? `Try nearby areas: ${nearbyPincodes.join(", ")}`
        : "Please check back later or contact support",
    actions: [
      { label: "Try Different Pincode", action: () => clearPincode() },
      { label: "Contact Support", action: () => openSupport() },
    ],
  });
}
```

---

## 📊 Error Flow Diagram

```
User enters pincode
       ↓
[Validate Format]
       ↓
   Invalid? → "Please enter a valid 6-digit pincode"
       ↓
    Valid
       ↓
[Check Serviceability]
       ↓
Not Serviceable? → "Sorry, we don't serve your area yet"
       ↓
  Serviceable
       ↓
[Get Product Price]
       ↓
No Price Found? → "This product is not available in your area"
       ↓
 Price Found
       ↓
[Show Price & Delivery Info]
```

---

## 🔍 Testing Scenarios

### Test Case 1: Invalid Pincode Format

```bash
# Test with invalid format
curl -X GET "http://localhost:9000/store/pincode-check?code=123"

# Expected: 400 Bad Request
# Message: "Please enter a valid 6-digit pincode"
```

### Test Case 2: Non-Serviceable Pincode

```bash
# Test with non-existent pincode
curl -X GET "http://localhost:9000/store/pincode-check?code=999999"

# Expected: 404 Not Found
# Message: "Sorry, we don't serve your area yet"
```

### Test Case 3: Product Not Available in Area

```bash
# Test product in serviceable pincode but no price set
curl -X GET "http://localhost:9000/store/products/prod_123/pincode-price?pincode=110001"

# Expected: 404 Not Found
# Message: "This product is not available in your area at the moment"
```

### Test Case 4: Success Case

```bash
# Test with valid serviceable pincode
curl -X GET "http://localhost:9000/store/pincode-check?code=110001"

# Expected: 200 OK
# Response includes delivery_days, is_cod_available, etc.
```

---

## 🛠️ Service Layer Methods

### `isPincodeServiceable(pincode: string): Promise<boolean>`

- Returns `true` if pincode is serviceable
- Returns `false` if pincode not found or not serviceable

### `getProductPrice(productId: string, pincode: string)`

- **Throws:** "We don't serve your area..." if pincode not serviceable
- **Throws:** "This product is not available..." if no price found
- **Returns:** Price object if successful

---

## 💡 Recommendations

### For Frontend Developers

1. **Always check error codes** - Use `error` field, not just `message`
2. **Show helpful suggestions** - Provide alternative actions
3. **Use friendly language** - Avoid technical jargon
4. **Add visual cues** - Icons, colors to indicate error type
5. **Log errors properly** - Include pincode for debugging

### For Product Managers

1. **Track failed pincodes** - Identify expansion opportunities
2. **Show alternatives** - Suggest nearby serviceable areas
3. **Collect email** - Notify when area becomes serviceable
4. **Clear communication** - Set expectations about availability

### For Support Teams

1. Error code helps identify issue quickly
2. User sees friendly message, support sees technical details
3. Can search by pincode to see all issues
4. Track most requested non-serviceable areas

---

## 📝 Error Message Guidelines

### ✅ Good Error Messages

- "Sorry, we don't serve your area yet"
- "This product is not available in your area at the moment"
- "Please try a different pincode or contact support"

### ❌ Bad Error Messages

- "Pincode not serviceable"
- "Error 404"
- "Invalid request"
- "No data found"

### 🎯 Key Principles

1. **Be apologetic** - "Sorry..."
2. **Be clear** - Explain what's wrong
3. **Be helpful** - Suggest next steps
4. **Be human** - Use natural language
5. **Be honest** - Don't promise what you can't deliver

---

## 🚀 Future Enhancements

Potential improvements:

- [ ] Suggest nearest serviceable pincodes
- [ ] Email notification when area becomes serviceable
- [ ] Show expansion timeline
- [ ] Alternative delivery options (pickup points)
- [ ] Regional availability map

---

**Status:** ✅ Implementation Complete
**Date:** October 28, 2025
**Files Modified:**

- `src/api/store/pincode-check/route.ts`
- `src/api/store/products/[product_id]/pincode-price/route.ts`
- `src/modules/pincode-pricing/service.ts`
