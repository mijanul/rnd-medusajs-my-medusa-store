#!/bin/bash

# Test Script for Product Without Variants System
# Run this after starting your dev server: yarn dev

BASE_URL="http://localhost:9000"
ADMIN_TOKEN="your-admin-token-here"  # Replace with actual token

echo "🧪 Testing Product Without Variants System"
echo "=========================================="
echo ""

# Test 1: Download CSV Template
echo "📥 Test 1: Downloading CSV Template..."
curl -s -X GET "$BASE_URL/admin/pincode-pricing/template" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o test-template.csv

if [ -f "test-template.csv" ]; then
  echo "✅ Template downloaded successfully"
  echo "📄 First few lines of template:"
  head -n 3 test-template.csv
  echo ""
else
  echo "❌ Failed to download template"
  exit 1
fi

# Test 2: Upload Sample CSV Data
echo "📤 Test 2: Uploading Sample Pricing Data..."

# Create sample CSV data (replace with actual product IDs from your database)
SAMPLE_CSV="sku\tproduct_id\tproduct_title\t110001\t400001\t560001
SAMPLE-001\tprod_sample123\tSample Product\t2999\t3199\t2899"

RESPONSE=$(curl -s -X POST "$BASE_URL/admin/pincode-pricing/upload" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"csv_data\": \"$SAMPLE_CSV\"}")

echo "Response: $RESPONSE"
echo ""

# Test 3: Query Product Price by Pincode (Store Endpoint)
echo "🛒 Test 3: Querying Product Price (Store API)..."

# Replace with actual product ID
PRODUCT_ID="prod_sample123"
PINCODE="110001"

PRICE_RESPONSE=$(curl -s -X GET "$BASE_URL/store/products/$PRODUCT_ID/pincode-price?pincode=$PINCODE")

echo "Response: $PRICE_RESPONSE"
echo ""

# Test 4: Check Database
echo "💾 Test 4: Checking Database Schema..."
echo "Run this SQL command to verify the schema:"
echo "  SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_pincode_price';"
echo ""
echo "Expected columns:"
echo "  - id (text)"
echo "  - product_id (text)  ← Changed from variant_id"
echo "  - sku (text)"
echo "  - pincode (text)"
echo "  - dealer_id (text)"
echo "  - price (numeric)"
echo ""

echo "=========================================="
echo "✅ Testing Complete!"
echo ""
echo "📋 Manual Test Checklist:"
echo "  [ ] Go to Admin Panel → Pincode Pricing"
echo "  [ ] Download CSV template"
echo "  [ ] Verify 3 fixed columns (not 4)"
echo "  [ ] Fill sample prices"
echo "  [ ] Upload CSV"
echo "  [ ] Check success message"
echo "  [ ] Query store API with product_id"
echo ""
echo "For detailed documentation, see:"
echo "  PRODUCT_WITHOUT_VARIANTS_MIGRATION.md"
