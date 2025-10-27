# 🎨 Pincode Pricing UI - Admin Panel

## ✅ UI Created! Here's Where to Find It

### Location in Medusa Admin

Once you start the server, go to:

```
http://localhost:9000/app/pincode-pricing
```

Or navigate via the **side menu** → **Pincode Pricing** (with MapPin icon)

---

## 🖥️ UI Features

### Tab 1: Pricing Upload 📤

**What you can do:**

- ✅ **Download CSV Template** button - Gets all your product variants in CSV format
- ✅ **Paste CSV Data** textarea - Paste your filled pricing data
- ✅ **Upload Pricing CSV** button - Bulk import all prices
- ✅ CSV format instructions displayed on screen

**Workflow:**

1. Click "Download CSV Template" → saves file like `pricing-template-2025-10-27.csv`
2. Open CSV in Excel/Sheets
3. Fill in pricing for each variant-pincode-dealer row
4. Copy all data (Ctrl+A, Ctrl+C)
5. Paste into textarea in admin
6. Click "Upload Pricing CSV"
7. Success toast shows how many prices imported! 🎉

### Tab 2: Dealers 🏢

**What you can do:**

- ✅ View all dealers in a table
- ✅ See dealer code, name, location, contact info, status
- ✅ **Add Dealer** button - Opens form to create new dealer
- ✅ Form has fields: Code, Name, City, State, Contact Name, Phone, Email

**Form fields:**

```
Dealer Code*:     DEALER_BANGALORE
Dealer Name*:     Bangalore Warehouse
City:             Bangalore
State:            Karnataka
Contact Name:     Rajesh Kumar
Contact Phone:    +91-9876543210
Contact Email:    contact@dealer.com
```

### Tab 3: Pincode Mappings 📍

**What you can do:**

- ✅ Map which pincodes are serviced by which dealers
- ✅ Set delivery days per dealer-pincode
- ✅ Enable/disable COD per dealer-pincode
- ✅ **Add Mapping** button - Opens form

**Form fields:**

```
Pincode*:         110001
Dealer*:          [Dropdown of all dealers]
Delivery Days:    2
COD Available:    [Checkbox]
```

---

## 📁 File Created

**Admin UI Component:**

```
src/admin/routes/pincode-pricing/page.tsx
```

This file contains:

- React component with 3 tabs
- CSV download functionality
- CSV upload with textarea
- Dealer management UI
- Pincode mapping UI
- All API integrations

---

## 🚀 How to Access

### 1. Build & Start Server

```bash
npm run build
npm run dev
```

### 2. Login to Admin

Go to: `http://localhost:9000/app/login`

### 3. Navigate to Pincode Pricing

- **Option A:** Click **"Pincode Pricing"** in left sidebar menu
- **Option B:** Go directly to `http://localhost:9000/app/pincode-pricing`

---

## 📸 What You'll See

### Screenshot Layout (Text Description):

```
┌─────────────────────────────────────────────────────┐
│  Pincode-Based Pricing                              │
├─────────────────────────────────────────────────────┤
│  [📍 Pricing Upload] [🏢 Dealers (3)] [📍 Mappings] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Upload Pricing CSV                                 │
│  Download the template, fill in pricing...          │
│                                                      │
│  [⬇️ Download CSV Template]                         │
│                                                      │
│  Paste CSV Data                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ sku,variant_id,pincode,dealer_code,price_inr │  │
│  │ SHIRT-001,var_123,110001,DEALER_DELHI,2999   │  │
│  │ SHIRT-001,var_123,400001,DEALER_MUMBAI,3199  │  │
│  │                                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [⬆️ Upload Pricing CSV]  [Clear]                   │
│                                                      │
│  📝 CSV Format Requirements:                        │
│  • sku: Product SKU                                 │
│  • variant_id: Medusa variant ID                   │
│  • pincode: 6-digit Indian pincode                 │
│  • dealer_code: Dealer code (must exist)           │
│  • price_inr: Price in INR                         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Complete User Journey

### Admin Journey:

1. **Go to Products** → Create product (name, images, variants) - **NO PRICE**
2. **Go to Pincode Pricing** → Click "Dealers" tab
3. **Add Dealer** → Fill form → Save (repeat for all warehouses)
4. **Go to "Pincode Mappings"** → Map pincodes to dealers
5. **Go to "Pricing Upload"** → Download template
6. **Open CSV** → Template has ALL variants with columns for pincode/dealer/price
7. **Fill pricing** → For each variant, add rows for different pincodes/dealers
8. **Copy CSV data** → Paste in textarea
9. **Upload** → Done! ✅

### Customer Journey (Frontend - needs separate implementation):

1. Browse product
2. Enter pincode (e.g., 110001)
3. System checks: `GET /store/pincode-check?pincode=110001`
4. If serviceable, fetch price: `GET /store/products/:variant_id/pincode-price?pincode=110001`
5. Show price, delivery time, COD availability
6. Add to cart

---

## 🔧 Technical Details

### React Component Structure:

```typescript
PincodePricingPage
├── State Management
│   ├── dealers[] - List of all dealers
│   ├── activeTab - Current tab (pricing/dealers/mappings)
│   ├── csvData - CSV textarea content
│   ├── newDealer - Form state for creating dealer
│   └── newMapping - Form state for pincode mapping
│
├── API Calls
│   ├── fetchDealers() - GET /admin/pincode-pricing/dealers
│   ├── handleDownloadTemplate() - GET /admin/pincode-pricing/template
│   ├── handleUploadCSV() - POST /admin/pincode-pricing/upload
│   ├── handleCreateDealer() - POST /admin/pincode-pricing/dealers
│   └── handleCreateMapping() - POST /admin/pincode-pricing/pincode-dealers
│
└── UI Components
    ├── Tab Navigation (3 tabs)
    ├── Pricing Upload Form (textarea + buttons)
    ├── Dealers Table + Create Form
    └── Mappings Form
```

### Medusa UI Components Used:

- `Container` - Main layout wrapper
- `Heading` - Titles and headings
- `Button` - Actions (download, upload, create)
- `Table` - Dealers list
- `Badge` - Status indicators (Active/Inactive)
- `Input` - Text inputs
- `Textarea` - CSV data input
- `Label` - Form labels
- `toast` - Success/error notifications

---

## ✅ CSV Template Structure

When you click "Download CSV Template", it generates:

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLACK,var_01JHK1234ABC,,,,
TSHIRT-WHITE,var_01JHK5678DEF,,,,
TSHIRT-BLUE,var_01JHK9012GHI,,,,
```

**You fill it like:**

```csv
sku,variant_id,pincode,dealer_code,price_inr
TSHIRT-BLACK,var_01JHK1234ABC,110001,DEALER_DELHI,1999
TSHIRT-BLACK,var_01JHK1234ABC,110002,DEALER_DELHI,1999
TSHIRT-BLACK,var_01JHK1234ABC,400001,DEALER_MUMBAI,2099
TSHIRT-BLACK,var_01JHK1234ABC,560001,DEALER_BANGALORE,1899
TSHIRT-WHITE,var_01JHK5678DEF,110001,DEALER_DELHI,1799
```

---

## 🎨 Design System

Uses **Medusa UI** design system:

- Follows Medusa admin panel design patterns
- Consistent with existing Medusa pages
- Responsive layout
- Toast notifications for feedback
- Form validation
- Loading states

---

## 🔍 Troubleshooting UI Issues

### UI not showing in menu?

**Fix:** Make sure server is rebuilt:

```bash
npm run build
npm run dev
```

### 404 on /app/pincode-pricing?

**Check:** File exists at `src/admin/routes/pincode-pricing/page.tsx`

### Download button not working?

**Check:** API endpoint at `src/api/admin/pincode-pricing/template/route.ts` exists

### Upload not working?

**Check:**

1. CSV format is correct (with header row)
2. Dealers exist first
3. Pincode mappings exist
4. Check browser console for errors

---

## 🎉 You're All Set!

Run the server and go to:

```
http://localhost:9000/app/pincode-pricing
```

Everything is ready:

- ✅ Backend APIs (6 endpoints)
- ✅ Database models (3 tables)
- ✅ Admin UI (3 tabs)
- ✅ CSV download/upload
- ✅ Dealer management
- ✅ Pincode mapping

**Next:** Build, seed data, and start using it! 🚀
