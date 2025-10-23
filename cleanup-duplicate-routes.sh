#!/bin/bash

# Cleanup script to remove duplicate-causing route overrides
# This will remove the UI route files that create duplicate menu items

echo "🧹 Cleaning up duplicate route overrides..."

# Remove route override directories
rm -rf src/admin/routes/orders
rm -rf src/admin/routes/products
rm -rf src/admin/routes/customers

echo "✅ Removed route overrides:"
echo "   - src/admin/routes/orders/"
echo "   - src/admin/routes/products/"
echo "   - src/admin/routes/customers/"

# Check if routes directory is empty (except pages and settings)
remaining=$(ls -A src/admin/routes/ 2>/dev/null | grep -v "pages" | grep -v "settings" | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo ""
  echo "✅ All duplicate-causing routes removed!"
else
  echo ""
  echo "ℹ️  Other custom routes still exist in src/admin/routes/"
  ls -la src/admin/routes/
fi

echo ""
echo "🔒 API protection is still active in:"
echo "   - src/api/admin/orders/"
echo "   - src/api/admin/products/"
echo "   - src/api/admin/customers/"

echo ""
echo "✅ Cleanup complete! Restart Medusa to see changes:"
echo "   npm run dev"
