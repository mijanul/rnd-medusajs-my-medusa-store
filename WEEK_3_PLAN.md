# Week 3 Plan: UI Components

## Pincode Pricing Migration - Admin Interface

> **Status:** 🚀 **READY TO START**  
> **Prerequisites:** Week 2 (Admin API) complete  
> **Duration:** 3-5 days

---

## 📋 Overview

Week 3 focuses on building **admin UI components** to manage pincode-based pricing through the Medusa admin dashboard.

### Goals

1. **CSV Upload Interface** - User-friendly bulk upload
2. **Product Pricing Widget** - Show pincode prices on product pages
3. **Dashboard Widget** - Overview and quick actions
4. **Integration** - Connect UI to Week 2 Admin API

---

## 🎨 Components to Build

### 1. CSV Upload Widget ✅ (Created)

**File:** `/src/admin/widgets/pincode-pricing-upload.tsx`

**Features:**

- File upload (CSV, XLSX, XLS)
- Drag & drop support
- Progress indicator
- Error display with details
- Success summary with statistics
- Template download button
- Format instructions
- Example CSV display

**Status:** ✅ Basic implementation complete

**API Integration:**

- `POST /admin/pincode-pricing-v2/upload` - Upload CSV
- `GET /admin/pincode-pricing-v2/template` - Download template

**Location:** Product list page (`product.list.before`)

---

### 2. Product Pincode Pricing Widget (To Update)

**File:** `/src/admin/widgets/product-pincode-pricing.tsx` (Exists, needs update)

**Current State:**

- Uses old API (`/admin/pincode-pricing/prices`)
- Needs migration to new API

**Required Updates:**

- Change API endpoint to `/admin/pincode-pricing-v2/products/:id`
- Update data structure for new API response
- Add statistics display (min/max/avg prices)
- Add coverage by state/city
- Improve table display with pagination
- Add export functionality

**New Features:**

- Display pricing statistics
- Show coverage metrics
- Filter by pincode/location
- Sort by price/pincode
- Quick search

**Location:** Product detail page (`product.details.after`)

---

### 3. Pricing Dashboard Widget (To Create)

**File:** `/src/admin/widgets/pincode-pricing-dashboard.tsx` (New)

**Features:**

- Overall statistics
  - Total products with pricing
  - Total pincodes covered
  - Total prices configured
  - States/cities covered
- Recent uploads
  - Last 5 CSV uploads
  - Success/failure status
  - Quick reupload
- Quick actions
  - Upload new CSV
  - Download template
  - View all prices
  - Export report
- Coverage map visualization
  - States with most coverage
  - Price distribution chart

**API Integration:**

- `GET /admin/pincode-pricing-v2/products/:id` - Get pricing data
- `GET /admin/pincode-pricing-v2/upload` - Upload CSV
- `GET /admin/pincode-pricing-v2/template` - Download template

**Location:** Dashboard (`dashboard.after`)

---

## 🔄 Implementation Plan

### Phase 1: Update Existing Widget (Day 1)

1. **Update Product Pincode Pricing Widget**
   - Migrate to new API endpoints
   - Update data structure
   - Add statistics display
   - Improve UI/UX
   - Test integration

**Tasks:**

- [ ] Update API endpoint to `/admin/pincode-pricing-v2/products/:id`
- [ ] Update response data handling
- [ ] Add statistics cards (min/max/avg)
- [ ] Add coverage metrics
- [ ] Improve table with pagination
- [ ] Add search and filter
- [ ] Test with real data

---

### Phase 2: Enhance CSV Upload Widget (Day 2)

1. **Improve CSV Upload Widget**
   - Add file validation
   - Improve error messages
   - Add download sample data
   - Better progress indication
   - Success/error toast notifications

**Tasks:**

- [ ] Add file type validation
- [ ] Add file size limit
- [ ] Show upload progress percentage
- [ ] Add detailed error parsing
- [ ] Add toast notifications
- [ ] Add sample data generation
- [ ] Test with large files
- [ ] Test error scenarios

---

### Phase 3: Create Dashboard Widget (Day 3)

1. **Create Pricing Dashboard Widget**
   - Overall statistics
   - Recent activity
   - Quick actions
   - Visualization

**Tasks:**

- [ ] Create dashboard widget file
- [ ] Fetch overall statistics
- [ ] Display key metrics
- [ ] Add recent uploads list
- [ ] Create quick action buttons
- [ ] Add chart for price distribution
- [ ] Add state coverage visualization
- [ ] Test integration

---

### Phase 4: Polish & Testing (Day 4-5)

1. **UI Polish**

   - Consistent styling
   - Responsive design
   - Loading states
   - Empty states
   - Error states

2. **Integration Testing**
   - Test all widgets together
   - Test API integration
   - Test error handling
   - Test performance
   - Test edge cases

**Tasks:**

- [ ] Ensure consistent UI across widgets
- [ ] Test mobile responsiveness
- [ ] Add loading skeletons
- [ ] Add empty state messages
- [ ] Test error scenarios
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation updates

---

## 📐 Design System

### Color Scheme

```
Primary: Blue (#3B82F6)
Success: Green (#10B981)
Warning: Orange (#F59E0B)
Error: Red (#EF4444)
Info: Purple (#8B5CF6)
```

### Typography

- Heading: `<Heading level="h2">`
- Body: `<Text>`
- Small: `<Text className="text-sm">`

### Components

- Buttons: `<Button>`
- Inputs: `<Input>`
- Containers: `<Container>`
- Badges: `<Badge>`
- Tables: `<Table>`
- Toast: `toast.success()`, `toast.error()`

---

## 🔌 API Integration

### Endpoints Used

1. **Get Product Pricing**

   ```
   GET /admin/pincode-pricing-v2/products/:product_id
   ```

   Response: pricing overview, statistics, all pincodes

2. **CSV Upload**

   ```
   POST /admin/pincode-pricing-v2/upload
   Body: { file: base64, filename: string }
   ```

   Response: upload statistics, errors

3. **Download Template**
   ```
   GET /admin/pincode-pricing-v2/template
   Query: ?pincodes=110001,110002
   ```
   Response: CSV file download

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Upload CSV with valid data
- [ ] Upload CSV with invalid data
- [ ] Upload Excel (XLSX) file
- [ ] Upload Excel (XLS) file
- [ ] Download template
- [ ] View product pricing
- [ ] Search pincodes
- [ ] Filter by location
- [ ] Export pricing data
- [ ] Handle large files (>1MB)
- [ ] Handle many products (>500)
- [ ] Handle many pincodes (>1000)

### UI/UX Testing

- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Loading states work
- [ ] Error messages clear
- [ ] Success feedback clear
- [ ] Empty states helpful
- [ ] Navigation intuitive
- [ ] Keyboard accessible
- [ ] Screen reader compatible

### Integration Testing

- [ ] Upload updates product pricing
- [ ] Template includes current products
- [ ] Statistics accurate
- [ ] Real-time updates work
- [ ] Multiple users can upload
- [ ] Concurrent uploads handled
- [ ] Cache invalidation works

---

## 📊 Success Criteria

### Must Have

✅ CSV upload widget working  
✅ Template download working  
🔄 Product pricing widget shows data  
⬜ Dashboard widget displays statistics  
⬜ All widgets use new API  
⬜ Error handling robust  
⬜ UI responsive and polished

### Nice to Have

⬜ Drag & drop file upload  
⬜ Price distribution chart  
⬜ State coverage map  
⬜ Export pricing report  
⬜ Batch operations  
⬜ Price history  
⬜ Audit log

---

## 🚀 Quick Start

### 1. Run Medusa Dev Server

```bash
cd /Users/mijanul/Projects/medusa/my-medusa-store
npm run dev
```

### 2. Access Admin Dashboard

```
http://localhost:9000/app
```

### 3. View Widgets

- **CSV Upload**: Product list page
- **Product Pricing**: Product detail page
- **Dashboard**: Main dashboard (after implementation)

---

## 📝 Current Progress

### Completed

✅ CSV Upload Widget basic implementation  
✅ Widget configuration  
✅ File upload handler  
✅ Error display  
✅ Success summary  
✅ Template download

### In Progress

🔄 Product Pricing Widget migration to new API

### To Do

⬜ Dashboard Widget creation  
⬜ UI polish and testing  
⬜ Performance optimization  
⬜ Documentation

---

## 🔗 Related Documentation

- [Week 2 Summary](./WEEK_2_SUMMARY.md) - Admin API implementation
- [Admin API Documentation](./ADMIN_API_DOCUMENTATION_V2.md) - API reference
- [Week 2 Quick Ref](./WEEK_2_QUICK_REF.md) - API quick reference

---

## 💡 Implementation Notes

### Using Medusa Admin SDK

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button } from "@medusajs/ui";

const MyWidget = () => {
  // Widget implementation
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default MyWidget;
```

### API Calls from Widgets

```typescript
// Fetch data
const response = await fetch("/admin/pincode-pricing-v2/products/" + productId);
const data = await response.json();

// Upload file
const formData = {
  file: base64Content,
  filename: file.name,
};

const response = await fetch("/admin/pincode-pricing-v2/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```

### File to Base64 Conversion

```typescript
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
```

---

## 🎯 Next Steps

1. **Update Product Pricing Widget** to use new API
2. **Create Dashboard Widget** with statistics
3. **Polish UI** for all widgets
4. **Test thoroughly** with real data
5. **Document** usage for admins

---

**Week 3 Status:** 🚀 IN PROGRESS (10% complete)  
**Overall Progress:** 82% (8.2/10 milestones)  
**Next Milestone:** Week 4-5 - Testing & Deployment

---

_Last Updated: Week 3, Day 1_  
_Version: 2.0 (Medusa Native Pricing)_
