# Week 3 - UI Components Testing Guide

## 🎯 Overview

This guide helps you test the new Week 3 UI components for the Pincode Pricing system. Follow these instructions step-by-step to ensure all features work correctly.

---

## 📋 Pre-Testing Setup

### 1. Ensure Backend is Ready

**Check that Week 2 API is working**:

```bash
# In terminal
curl http://localhost:9000/admin/pincode-pricing-v2/products/prod_123
```

Expected: Should return product pricing data or 404 if product doesn't exist.

### 2. Ensure Sample Data Exists

**Option A: Use existing data**

- If you migrated data in Week 2, you're good to go

**Option B: Upload test data**

1. Go to Admin → Products
2. Use CSV upload widget
3. Upload sample pricing data

**Sample CSV**:

```csv
product_id,pincode,price,delivery_days
prod_123,110001,12000,3
prod_123,400001,11500,4
prod_123,560001,12500,3
```

### 3. Start Dev Server

```bash
npm run dev
```

Wait for:

- ✅ Admin server running on http://localhost:9000
- ✅ No compilation errors

---

## 🧪 Test Suite 1: Product Pincode Pricing Widget

**File**: `/src/admin/widgets/product-pincode-pricing-v2.tsx`  
**Location**: Product detail page  
**Zone**: `product.details.after`

### Access the Widget

1. Navigate to: `http://localhost:9000/app`
2. Login with admin credentials
3. Go to **Products** (left sidebar)
4. Click on any product
5. Scroll down to find "Pincode Pricing" section

---

### Test 1.1: Loading State ✅

**Steps**:

1. Open product detail page
2. Observe initial loading

**Expected**:

- Shows animated skeleton loader
- 4 gray pulsing boxes (statistics)
- No flickering or layout shifts

**Pass Criteria**:

- [ ] Skeleton animation smooth
- [ ] Layout stable during loading
- [ ] Transitions to content smoothly

---

### Test 1.2: Statistics Display ✅

**Test with product that has pricing**:

**Steps**:

1. View product with 10+ pincodes
2. Check statistics cards

**Expected**:

- **Total Pincodes**: Shows correct count (blue card)
- **Min Price**: Shows lowest price (green card)
- **Max Price**: Shows highest price (purple card)
- **Avg Price**: Shows average price (orange card)
- All prices formatted as ₹X,XXX.XX

**Pass Criteria**:

- [ ] All 4 statistics cards visible
- [ ] Numbers are correct
- [ ] Currency formatting correct
- [ ] Colors match design (blue/green/purple/orange)

**Calculation Check**:

```javascript
// Manual verification:
// If pincodes have prices: [10000, 12000, 15000]
// Min = 10000 → ₹10,000.00 ✓
// Max = 15000 → ₹15,000.00 ✓
// Avg = 12333 → ₹12,333.33 ✓
```

---

### Test 1.3: Coverage Metrics ✅

**Steps**:

1. Check coverage cards below statistics
2. Verify state/city counts

**Expected**:

- **States Covered**: Shows unique state count
- **Cities Covered**: Shows unique city count
- Gray cards with black text

**Pass Criteria**:

- [ ] State count matches unique states in data
- [ ] City count matches unique cities in data
- [ ] Both cards visible side-by-side

**Verification**:

- If data has pincodes from Delhi (3), Maharashtra (5), Karnataka (2)
- States Covered = 3 ✓

---

### Test 1.4: Search Functionality ✅

**Test 4.1: Search by Pincode**

**Steps**:

1. Type "110001" in search box
2. Press Enter or wait for auto-filter

**Expected**:

- Table filters to show only matching pincodes
- Result count updates
- Pagination resets to page 1

**Pass Criteria**:

- [ ] Exact pincode match works
- [ ] Partial pincode match works (e.g., "1100" matches "110001", "110002")
- [ ] Result count correct
- [ ] No results shows "No results found"

**Test 4.2: Search by City**

**Steps**:

1. Type "Mumbai" in search box
2. Observe results

**Expected**:

- Shows all pincodes from Mumbai
- Case-insensitive ("mumbai", "MUMBAI", "Mumbai" all work)

**Pass Criteria**:

- [ ] City search works
- [ ] Case-insensitive
- [ ] Partial match works ("Mum" finds "Mumbai")

**Test 4.3: Search by State**

**Steps**:

1. Type "Maharashtra" in search box
2. Observe results

**Expected**:

- Shows all pincodes from Maharashtra
- Case-insensitive

**Pass Criteria**:

- [ ] State search works
- [ ] Case-insensitive
- [ ] Partial match works

**Test 4.4: Clear Search**

**Steps**:

1. Enter search term
2. Clear search box
3. Observe results

**Expected**:

- Returns to full list
- Pagination resets

**Pass Criteria**:

- [ ] Clear search works
- [ ] Full data restored
- [ ] No lingering filters

---

### Test 1.5: Pagination ✅

**Setup**: Need product with 21+ pincodes

**Test 5.1: First Page**

**Steps**:

1. View product with 50+ pincodes
2. Check first page

**Expected**:

- Shows first 20 items
- "Previous" button disabled
- "Next" button enabled
- Shows "Showing 1-20 of 50"

**Pass Criteria**:

- [ ] Shows exactly 20 items
- [ ] Previous button disabled/grayed
- [ ] Next button clickable
- [ ] Counter shows correct range

**Test 5.2: Navigation**

**Steps**:

1. Click "Next" button
2. Check page 2
3. Click "Previous" button

**Expected**:

- Page 2 shows items 21-40
- Both buttons enabled
- Counter updates to "21-40 of 50"
- Previous returns to page 1

**Pass Criteria**:

- [ ] Next navigation works
- [ ] Previous navigation works
- [ ] Counter updates correctly
- [ ] Both buttons enabled on middle pages

**Test 5.3: Last Page**

**Steps**:

1. Navigate to last page
2. Check button states

**Expected**:

- Shows remaining items (e.g., 41-50)
- "Next" button disabled
- "Previous" button enabled
- Shows "Showing 41-50 of 50"

**Pass Criteria**:

- [ ] Last page shows correct items
- [ ] Next button disabled
- [ ] Previous button enabled
- [ ] Counter correct

**Test 5.4: Pagination with Search**

**Steps**:

1. Enter search term
2. Check pagination updates

**Expected**:

- Pagination based on filtered results
- Resets to page 1 on search
- Page count updates

**Pass Criteria**:

- [ ] Pagination updates with search
- [ ] Resets to page 1
- [ ] Total count reflects filtered results

---

### Test 1.6: Table Display ✅

**Steps**:

1. View pincode table
2. Check all columns

**Expected Columns**:

1. **Pincode**: Badge with pincode number
2. **Price**: Formatted currency (₹X,XXX.XX)
3. **City**: Text showing city name
4. **State**: Text showing state name
5. **Delivery Days**: "X days" text

**Pass Criteria**:

- [ ] All 5 columns visible
- [ ] Headers clear and readable
- [ ] Data aligned properly
- [ ] Badge styling on pincode
- [ ] Price formatting correct
- [ ] Delivery days shows "X days"

**Sample Row**:

```
| 110001 | ₹12,000.00 | New Delhi | Delhi | 3 days |
```

---

### Test 1.7: State Distribution ✅

**Steps**:

1. Scroll to "Distribution by State" section
2. Check state list

**Expected**:

- Shows top 8 states by pincode count
- Sorted by count (descending)
- Each state shows count badge
- Grid layout (2-4 columns)

**Pass Criteria**:

- [ ] Shows up to 8 states
- [ ] Sorted correctly (highest first)
- [ ] Count badges visible
- [ ] Grid responsive

**Example**:

```
Maharashtra  25
Karnataka    15
Delhi        10
Tamil Nadu    8
...
```

---

### Test 1.8: Empty State ✅

**Test with product that has NO pricing**:

**Steps**:

1. View product with no pincode pricing
2. Check display

**Expected**:

- Shows "No pincode pricing configured" message
- Helpful text about using CSV upload
- Gray background card
- No statistics shown

**Pass Criteria**:

- [ ] Empty state message clear
- [ ] Helpful guidance provided
- [ ] No error state shown
- [ ] No broken UI elements

---

### Test 1.9: Error Handling ✅

**Test 9.1: Product Not Found**

**Steps**:

1. Manually navigate to invalid product ID
2. OR stop backend server

**Expected**:

- Shows error state
- Red border card
- Error message: "Product not found" or similar
- No crash or white screen

**Pass Criteria**:

- [ ] Error state displays
- [ ] Error message clear
- [ ] No console errors
- [ ] Can navigate away

**Test 9.2: Network Error**

**Steps**:

1. Stop backend server
2. Refresh product page

**Expected**:

- Shows error state
- Error message about failed request
- Can retry when server restarts

**Pass Criteria**:

- [ ] Network error caught
- [ ] Error message displayed
- [ ] No infinite loading

---

### Test 1.10: Help Section ✅

**Steps**:

1. Scroll to bottom of widget
2. Read help section

**Expected**:

- Blue background card
- 💡 icon
- 5-step instructions for updating prices
- Mentions CSV upload widget
- Shows product SKU/handle

**Pass Criteria**:

- [ ] Help section visible
- [ ] Instructions clear
- [ ] Product SKU shown
- [ ] Directs to CSV upload

---

### Test 1.11: Responsive Design ✅

**Test 11.1: Mobile View**

**Steps**:

1. Open in mobile device or resize browser to 375px width
2. Check layout

**Expected**:

- Statistics cards stack vertically (1 column)
- Coverage cards stack vertically
- Table scrollable horizontally
- Search box full width
- Pagination buttons stack if needed

**Pass Criteria**:

- [ ] Cards stack on mobile
- [ ] Table scrolls horizontally
- [ ] All content accessible
- [ ] No overflow issues

**Test 11.2: Tablet View**

**Steps**:

1. Resize browser to 768px width
2. Check layout

**Expected**:

- Statistics cards in 2-column grid
- Coverage cards side-by-side
- Table fits or scrolls
- Readable font sizes

**Pass Criteria**:

- [ ] 2-column layout
- [ ] Table readable
- [ ] No squished content

**Test 11.3: Desktop View**

**Steps**:

1. View on 1920px width
2. Check layout

**Expected**:

- Statistics cards in 4-column grid
- State distribution in 4 columns
- Table fits width
- All content properly spaced

**Pass Criteria**:

- [ ] 4-column layout
- [ ] Proper spacing
- [ ] No excessive white space

---

### Test 1.12: Performance ✅

**Test with large dataset (100+ pincodes)**:

**Steps**:

1. View product with 100+ pincodes
2. Test interactions

**Metrics**:

- Initial load: < 2 seconds
- Search: < 500ms
- Pagination: < 300ms
- No lag on typing

**Pass Criteria**:

- [ ] Fast initial load
- [ ] Smooth search
- [ ] Quick pagination
- [ ] No freezing

---

## 📊 Test Results Template

```markdown
## Test Results - Product Pincode Pricing Widget

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Browser**: [Chrome/Firefox/Safari]
**Device**: [Desktop/Mobile/Tablet]

### Summary

- Total Tests: 40
- Passed: \_\_
- Failed: \_\_
- Skipped: \_\_

### Failed Tests

| Test ID | Test Name         | Issue         | Severity |
| ------- | ----------------- | ------------- | -------- |
| 1.4.1   | Search by Pincode | Not filtering | High     |
| ...     | ...               | ...           | ...      |

### Notes

[Any additional observations]

### Screenshots

[Attach screenshots if needed]
```

---

## 🔍 Debugging Tips

### Issue: Widget Not Showing

**Check**:

1. Widget zone correct? (`product.details.after`)
2. Widget file in correct location? (`/src/admin/widgets/`)
3. Medusa dev server restarted?
4. Check browser console for errors

**Solution**:

```bash
# Restart dev server
npm run dev

# Check for compilation errors
npm run build
```

### Issue: API Returns 404

**Check**:

1. Product ID exists in database
2. API endpoint correct (`/admin/pincode-pricing-v2/products/{id}`)
3. Backend running on port 9000

**Solution**:

```bash
# Test API directly
curl http://localhost:9000/admin/pincode-pricing-v2/products/prod_123

# Check product exists
curl http://localhost:9000/admin/products/prod_123
```

### Issue: Statistics Wrong

**Check**:

1. Price data format correct in database
2. Currency calculation correct
3. Count logic correct

**Solution**:

- Check API response in Network tab
- Verify data structure matches expected format
- Check console.log(pricingData)

### Issue: Pagination Not Working

**Check**:

1. `currentPage` state updating?
2. `totalPages` calculated correctly?
3. Button click handlers attached?

**Solution**:

- Add console.log in onClick handlers
- Check state with React DevTools
- Verify filteredPincodes.length

---

## 🎉 Success Criteria

**Widget is ready for production when**:

✅ **All Tests Pass**:

- 40/40 tests passing
- No critical bugs
- No console errors

✅ **Performance**:

- Loads in < 2 seconds
- Smooth interactions
- No lag on large datasets

✅ **UI/UX**:

- Responsive on all devices
- Clear error messages
- Helpful empty states

✅ **Accessibility**:

- Keyboard navigation works
- Screen reader friendly
- Proper ARIA labels

✅ **Browser Support**:

- Works on Chrome
- Works on Firefox
- Works on Safari
- Works on Edge

---

## 📝 Next Steps After Testing

1. **Fix any failed tests**
2. **Document known issues**
3. **Move to Phase 2**: Enhance CSV Upload Widget
4. **Create Phase 3**: Dashboard Widget
5. **Final polish and deployment**

---

**Last Updated**: Week 3 Phase 1 Complete  
**Status**: Ready for Testing
