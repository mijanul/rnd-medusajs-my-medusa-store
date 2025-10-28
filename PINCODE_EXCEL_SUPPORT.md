# Pincode Pricing - Excel & CSV Support

## Overview

The pincode pricing system now supports both **Excel (.xlsx)** and **CSV (.csv)** file formats with proper formatting for Microsoft Excel compatibility.

## ✅ What's Been Fixed/Added

### 1. **Proper CSV Formatting for Excel**

- ✅ Uses **comma separation** instead of tabs
- ✅ Properly escapes values containing commas, quotes, or newlines
- ✅ Adds **UTF-8 BOM** for correct Excel encoding
- ✅ Uses **Windows line endings** (`\r\n`) for Excel compatibility
- ✅ CSV files now open perfectly formatted in Excel

### 2. **Excel File Support (.xlsx)**

- ✅ Download template as Excel file (recommended format)
- ✅ Upload Excel files directly
- ✅ Proper column widths for readability
- ✅ Native Excel format - no formatting issues

### 3. **Enhanced UI**

- ✅ Format selector (Excel/CSV) before download
- ✅ Excel format set as **default and recommended**
- ✅ File upload accepts: `.csv`, `.xlsx`, `.xls`
- ✅ Better file validation and error messages
- ✅ Shows selected file type and size

## 🎯 How to Use

### Download Template

1. Navigate to **Pincode Pricing** in the admin sidebar
2. Select your preferred format:
   - **Excel (.xlsx)** - ✅ Recommended (no formatting issues)
   - **CSV (.csv)** - Works, but Excel format is better
3. Click **"Download [Format] Template"**

### Edit Pricing

#### Using Excel (Recommended)

1. Open the downloaded `.xlsx` file in Microsoft Excel
2. Each row = one product
3. Each column after the first 3 = one pincode
4. Fill in prices in INR (e.g., 2999 for ₹2999)
5. Leave cells empty where product is not available
6. Save the file

#### Using CSV

1. Open the downloaded `.csv` file in Excel or text editor
2. Excel will now display columns properly (comma-separated)
3. Edit prices as needed
4. Save as CSV

### Upload Pricing

1. Click **"Select File to Upload"**
2. Choose your edited file (`.csv`, `.xlsx`, or `.xls`)
3. File type is automatically detected
4. Click **"Upload Pricing File"**
5. Success! Your prices are now updated

## 📊 File Format

### Column Structure

| Column | Name          | Description              | Example              |
| ------ | ------------- | ------------------------ | -------------------- |
| 1      | sku           | Product SKU              | SHIRT-001            |
| 2      | product_id    | Medusa product ID        | prod_01J...          |
| 3      | product_title | Product name (reference) | Cotton Shirt         |
| 4+     | Pincodes      | One column per pincode   | 110001, 400001, etc. |

### Example

```
sku,product_id,product_title,110001,400001,560001
SHIRT-001,prod_01J...,Cotton Shirt,2999,2999,2899
PANT-001,prod_01K...,Denim Jeans,3999,,3799
```

- Empty cells = product not available in that pincode
- Prices in INR (whole numbers)
- Existing prices are **pre-filled** in downloaded templates

## 🔧 Technical Details

### Dependencies Added

```json
{
  "xlsx": "^0.18.5"
}
```

### API Endpoints

#### GET `/admin/pincode-pricing/template`

**Query Parameters:**

- `format`: `"csv"` or `"xlsx"` (default: `"csv"`)
- `product_id`: Optional - filter by product

**Response:** File download

- CSV: `text/csv` with UTF-8 BOM
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### POST `/admin/pincode-pricing/upload`

**Body:**

```json
{
  "csv_data": "file content (text for CSV, base64 for Excel)",
  "file_type": "csv" | "xlsx" | "xls"
}
```

**Response:**

```json
{
  "message": "Pricing data uploaded successfully",
  "imported": 150,
  "failed": 5,
  "total_rows_processed": 50,
  "rows_skipped": 2,
  "errors": [...]
}
```

### File Processing

#### CSV Processing

- Detects separator (comma or tab)
- Properly handles quoted values
- Unescapes escaped quotes (`""` → `"`)
- Strips whitespace

#### Excel Processing

- Reads `.xlsx` and `.xls` files
- Uses `xlsx` library
- Converts to array of arrays
- Handles empty cells
- Type-safe conversion

## 🎨 UI Components

### Format Selector (Radio Buttons)

```tsx
- Excel (.xlsx) - Recommended ✓
- CSV (.csv)
```

### File Input

Accepts: `.csv, .xlsx, .xls`
Shows: Filename, size, validation status

### Upload Button

- Disabled when no file selected
- Shows "Uploading..." during upload
- Displays success/error messages

## 🐛 Bug Fixes

### Before

- ❌ CSV used tab separation - didn't work well in Excel
- ❌ No proper quoting/escaping
- ❌ Excel showed all data in one column
- ❌ Encoding issues with special characters
- ❌ No Excel file support

### After

- ✅ Proper comma-separated CSV
- ✅ Correct quoting and escaping
- ✅ Excel displays columns perfectly
- ✅ UTF-8 BOM for encoding
- ✅ Native Excel file support

## 💡 Recommendations

1. **Use Excel format** (.xlsx) for best experience
2. **Keep template files** for future updates
3. **Fill prices incrementally** - empty cells are ignored
4. **Download template before each upload** to get existing prices
5. **Verify file in Excel** before uploading

## 🔍 Troubleshooting

### Issue: CSV not opening correctly in Excel

**Solution:** Download as Excel format instead (recommended)

### Issue: Upload fails with Excel file

**Solution:**

- Ensure file is `.xlsx` or `.xls`
- Check file is not corrupted
- Try saving as CSV and uploading

### Issue: Some prices not imported

**Solution:**

- Check price format (numbers only)
- Ensure pincode headers are 6 digits
- Verify product IDs are correct
- Check console for detailed errors

## 📝 Notes

- Prices are stored in **paise** (smallest unit): 2999 → 299900
- Only **active pincodes** are included in template
- **Existing prices are pre-filled** - update as needed
- Empty cells in upload are **ignored** (not deleted)
- Invalid rows are **skipped** with error logging

## 🚀 Future Enhancements

Potential improvements:

- [ ] Bulk delete by leaving cell as `DELETE`
- [ ] Import from Google Sheets URL
- [ ] Export current prices to Excel
- [ ] Validation preview before upload
- [ ] Price history tracking
- [ ] Multi-sheet support for different regions

---

**Updated:** October 28, 2025
**Version:** 2.0
