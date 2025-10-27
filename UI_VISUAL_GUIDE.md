# 🎨 Complete UI Flow - Visual Guide

## 📍 Where to Find the Pincode Pricing UI

```
Medusa Admin Panel
└── http://localhost:9000/app
    └── Login with your admin credentials
        └── Left Sidebar Menu
            └── 📍 Pincode Pricing ← Click here!
                └── http://localhost:9000/app/pincode-pricing
```

---

## 🖼️ Complete UI Screen Layout

```
╔═══════════════════════════════════════════════════════════════════════╗
║  MEDUSA ADMIN PANEL                                     [Admin Name] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌─────────────┐                                                      ║
║  │ 🏠 Home     │                                                      ║
║  │ 📦 Products │                                                      ║
║  │ 🛒 Orders   │   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  │ 👥 Customers│   ┃  Pincode-Based Pricing                      ┃  ║
║  │ ⚙️  Settings│   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║
║  │ 📍 Pincode  │◄──┃  [📍 Pricing Upload] [🏢 Dealers (5)]       ┃  ║
║  │   Pricing   │   ┃  [📍 Pincode Mappings]                       ┃  ║
║  └─────────────┘   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ║
║                    ┃                                               ┃  ║
║                    ┃  Upload Pricing CSV                           ┃  ║
║                    ┃  Download template, fill in pricing...        ┃  ║
║                    ┃                                               ┃  ║
║                    ┃  [⬇️ Download CSV Template]                   ┃  ║
║                    ┃                                               ┃  ║
║                    ┃  Paste CSV Data                               ┃  ║
║                    ┃  ┌─────────────────────────────────────────┐ ┃  ║
║                    ┃  │ sku,variant_id,pincode,dealer,price_inr │ ┃  ║
║                    ┃  │ SHIRT-001,var_123,110001,DEALER_D,2999  │ ┃  ║
║                    ┃  │ SHIRT-001,var_123,400001,DEALER_M,3199  │ ┃  ║
║                    ┃  │ SHIRT-002,var_456,110001,DEALER_D,1999  │ ┃  ║
║                    ┃  │ SHIRT-002,var_456,560001,DEALER_B,1899  │ ┃  ║
║                    ┃  │                                          │ ┃  ║
║                    ┃  │                                          │ ┃  ║
║                    ┃  └─────────────────────────────────────────┘ ┃  ║
║                    ┃  Format: sku, variant_id, pincode,          ┃  ║
║                    ┃  dealer_code, price_inr                      ┃  ║
║                    ┃                                               ┃  ║
║                    ┃  [⬆️ Upload Pricing CSV] [Clear]             ┃  ║
║                    ┃                                               ┃  ║
║                    ┃  ┌─────────────────────────────────────────┐ ┃  ║
║                    ┃  │ 📝 CSV Format Requirements:              │ ┃  ║
║                    ┃  │ • sku: Product SKU                       │ ┃  ║
║                    ┃  │ • variant_id: Medusa variant ID          │ ┃  ║
║                    ┃  │ • pincode: 6-digit Indian pincode        │ ┃  ║
║                    ┃  │ • dealer_code: Dealer code               │ ┃  ║
║                    ┃  │ • price_inr: Price in INR (paise)        │ ┃  ║
║                    ┃  └─────────────────────────────────────────┘ ┃  ║
║                    ┃                                               ┃  ║
║                    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Complete Workflow - Step by Step

### STEP 1: Create Product (No Price) ✅

```
1. Go to: Products → Create Product
2. Fill:
   ├── Name: "Premium Cotton T-Shirt"
   ├── Description: "Comfortable..."
   ├── Images: Upload images
   ├── Variants: Add sizes (S, M, L, XL)
   └── ❌ DON'T SET PRICE!
3. Save Product
```

### STEP 2: Create Dealers 🏢

```
1. Go to: Pincode Pricing → [🏢 Dealers] tab
2. Click: [+ Add Dealer]
3. Fill form:
   ┌──────────────────────────────────────┐
   │ Dealer Code*:     DEALER_DELHI       │
   │ Dealer Name*:     Delhi Warehouse    │
   │ City:             New Delhi          │
   │ State:            Delhi              │
   │ Contact Name:     Rajesh Kumar       │
   │ Contact Phone:    +91-9876543210     │
   │ Contact Email:    rajesh@dealer.com  │
   │                                      │
   │ [Create Dealer] [Cancel]             │
   └──────────────────────────────────────┘
4. Repeat for all dealers (Mumbai, Bangalore, etc.)
```

Result:

```
╔════════════════════════════════════════════════════════╗
║  Dealers / Suppliers                    [+ Add Dealer] ║
╠════════════════════════════════════════════════════════╣
║  Code           │ Name              │ Location         ║
╟────────────────┼───────────────────┼──────────────────╢
║  DEALER_DELHI  │ Delhi Warehouse   │ New Delhi, Delhi ║
║  DEALER_MUMBAI │ Mumbai Warehouse  │ Mumbai, MH       ║
║  DEALER_BGLR   │ Bangalore Hub     │ Bangalore, KA    ║
╚════════════════════════════════════════════════════════╝
```

### STEP 3: Map Pincodes to Dealers 📍

```
1. Go to: Pincode Pricing → [📍 Pincode Mappings] tab
2. Click: [+ Add Mapping]
3. Fill form:
   ┌──────────────────────────────────────┐
   │ Pincode*:         110001             │
   │ Dealer*:          Delhi Warehouse ▼  │
   │ Delivery Days:    2                  │
   │ ☑️ COD Available                     │
   │                                      │
   │ [Create Mapping] [Cancel]            │
   └──────────────────────────────────────┘
4. Repeat for all pincode-dealer combinations
```

### STEP 4: Download CSV Template 📥

```
1. Go to: Pincode Pricing → [📍 Pricing Upload] tab
2. Click: [⬇️ Download CSV Template]
3. Browser downloads: pricing-template-2025-10-27.csv
```

Template looks like:

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLUE-S,var_01JHK1234ABC,,,,
TSHIRT-BLUE-M,var_01JHK1234DEF,,,,
TSHIRT-BLUE-L,var_01JHK1234GHI,,,,
TSHIRT-BLUE-XL,var_01JHK1234JKL,,,,
SHIRT-WHITE-M,var_01JHK5678MNO,,,,
SHIRT-WHITE-L,var_01JHK5678PQR,,,,
```

### STEP 5: Fill Pricing Data 📝

Open in Excel/Google Sheets and fill:

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLUE-S,var_01JHK1234ABC,110001,DEALER_DELHI,1999
TSHIRT-BLUE-S,var_01JHK1234ABC,110002,DEALER_DELHI,1999
TSHIRT-BLUE-S,var_01JHK1234ABC,400001,DEALER_MUMBAI,2099
TSHIRT-BLUE-S,var_01JHK1234ABC,560001,DEALER_BGLR,1899
TSHIRT-BLUE-M,var_01JHK1234DEF,110001,DEALER_DELHI,1999
TSHIRT-BLUE-M,var_01JHK1234DEF,400001,DEALER_MUMBAI,2099
TSHIRT-BLUE-L,var_01JHK1234GHI,110001,DEALER_DELHI,2199
TSHIRT-BLUE-L,var_01JHK1234GHI,560001,DEALER_BGLR,1999
```

**Multiple Dealers Example:**

```csv
TSHIRT-BLUE-S,var_01JHK1234ABC,560001,DEALER_BGLR_1,1899
TSHIRT-BLUE-S,var_01JHK1234ABC,560001,DEALER_BGLR_2,1799
```

(Same pincode, different dealers, different prices - system picks lowest!)

### STEP 6: Upload Pricing 📤

```
1. Select all CSV data (Ctrl+A)
2. Copy (Ctrl+C)
3. Go back to: Pincode Pricing → [📍 Pricing Upload] tab
4. Paste in textarea (Ctrl+V)
5. Click: [⬆️ Upload Pricing CSV]
6. ✅ Success! Toast shows: "Successfully uploaded 127 prices!"
```

---

## 🎯 Real Example - Complete Flow

### Example Product: "Premium Cotton T-Shirt"

**Variants created (no price):**

- Blue - S (var_abc123)
- Blue - M (var_abc456)
- Blue - L (var_abc789)
- White - M (var_def123)

**Dealers created:**

- DEALER_DELHI (Delhi)
- DEALER_MUMBAI (Mumbai)
- DEALER_BANGALORE_1 (Bangalore East)
- DEALER_BANGALORE_2 (Bangalore West)

**Pincode Mappings:**

- 110001 → DEALER_DELHI (2 days, COD)
- 110002 → DEALER_DELHI (2 days, COD)
- 400001 → DEALER_MUMBAI (3 days, COD)
- 560001 → DEALER_BANGALORE_1 (2 days, COD)
- 560001 → DEALER_BANGALORE_2 (3 days, COD)

**CSV Data:**

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLUE-S,var_abc123,110001,DEALER_DELHI,1999
TSHIRT-BLUE-S,var_abc123,400001,DEALER_MUMBAI,2099
TSHIRT-BLUE-S,var_abc123,560001,DEALER_BANGALORE_1,1999
TSHIRT-BLUE-S,var_abc123,560001,DEALER_BANGALORE_2,1799
TSHIRT-BLUE-M,var_abc456,110001,DEALER_DELHI,1999
TSHIRT-BLUE-M,var_abc456,560001,DEALER_BANGALORE_1,1899
```

**Customer Query: Pincode 560001, Variant var_abc123**

```json
{
  "price": 179900,
  "price_inr": 1799,
  "dealer": "DEALER_BANGALORE_2",
  "delivery_days": 3
}
```

→ System picked lowest price (₹1799) from DEALER_BANGALORE_2

---

## 🎨 UI Component Details

### File Structure:

```
src/admin/routes/pincode-pricing/
└── page.tsx
    ├── Exports: default PincodePricingPage component
    ├── Exports: config with label "Pincode Pricing" and MapPin icon
    │
    ├── State:
    │   ├── dealers (array)
    │   ├── activeTab (pricing/dealers/mappings)
    │   ├── csvData (string)
    │   ├── newDealer (object)
    │   └── newMapping (object)
    │
    ├── Functions:
    │   ├── fetchDealers()
    │   ├── handleDownloadTemplate()
    │   ├── handleUploadCSV()
    │   ├── handleCreateDealer()
    │   └── handleCreateMapping()
    │
    └── JSX:
        ├── Header with title
        ├── Tab navigation (3 tabs)
        ├── Tab 1: CSV upload UI
        ├── Tab 2: Dealers table + form
        └── Tab 3: Pincode mapping form
```

### Medusa Components Used:

```typescript
import {
  Container, // Main wrapper
  Heading, // Titles (h1, h2, h3)
  Button, // Actions
  Table, // Data display
  Badge, // Status chips
  toast, // Notifications
  Input, // Text inputs
  Label, // Form labels
  Textarea, // CSV textarea
} from "@medusajs/ui";

import {
  ArrowDownTray, // Download icon
  ArrowUpTray, // Upload icon
  Plus, // Add icon
  MapPin, // Pincode icon
  BuildingStorefront, // Dealer icon
} from "@medusajs/icons";
```

---

## 🚀 Access Instructions

### Local Development:

```bash
# 1. Build project
npm run build

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:9000/app/login

# 4. Login with admin credentials
Email: admin@medusa-test.com
Password: supersecret

# 5. Navigate to Pincode Pricing
Click "Pincode Pricing" in left sidebar
OR
Go directly: http://localhost:9000/app/pincode-pricing
```

---

## 🎉 Summary

**Backend:** ✅ 6 API endpoints  
**Database:** ✅ 3 tables  
**Admin UI:** ✅ Complete interface with 3 tabs  
**CSV:** ✅ Download template + Upload functionality  
**Dealers:** ✅ Create and manage  
**Mappings:** ✅ Pincode-dealer assignment

**Everything is ready to use!** 🚀

Just build, run, and access: `http://localhost:9000/app/pincode-pricing`
