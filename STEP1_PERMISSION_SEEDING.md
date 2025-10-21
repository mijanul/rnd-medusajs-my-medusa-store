# Step 1: Permission Seeding Implementation

## Overview

This step implements comprehensive permission seeding for all core Medusa modules and custom modules.

## Modules Covered

1. **Orders** - Medusa core module
2. **Products** - Medusa core module
3. **Inventory** - Medusa core module
4. **Customers** - Medusa core module
5. **Promotions** - Medusa core module
6. **Price Lists** - Medusa core module
7. **Settings** - Medusa core module
8. **Pages** - Custom module

## Permissions Created

For each module, the following 5 permissions are created:

- ✅ **create** - Create new items
- ✅ **delete** - Delete items
- ✅ **list** - List all items
- ✅ **view** - View item details
- ✅ **update** - Update existing items

**Total**: 8 modules × 5 actions = **40 permissions**

## Database Schema

Each permission has the following fields:

- `id` - Unique identifier (format: `perm_{resource}_{action}`)
- `name` - Permission name (format: `{resource}-{action}`)
- `resource` - The module/resource name
- `action` - The action type
- `description` - Human-readable description
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `deleted_at` - Soft delete timestamp (nullable)

## Example Permissions

### Orders Module

- `perm_orders_create` | `orders-create` | Create new items in Orders
- `perm_orders_delete` | `orders-delete` | Delete items in Orders
- `perm_orders_list` | `orders-list` | List all items in Orders
- `perm_orders_view` | `orders-view` | View item details in Orders
- `perm_orders_update` | `orders-update` | Update existing items in Orders

### Pages Module (Custom)

- `perm_pages_create` | `pages-create` | Create new items in Pages (Custom)
- `perm_pages_delete` | `pages-delete` | Delete items in Pages (Custom)
- `perm_pages_list` | `pages-list` | List all items in Pages (Custom)
- `perm_pages_view` | `pages-view` | View item details in Pages (Custom)
- `perm_pages_update` | `pages-update` | Update existing items in Pages (Custom)

## How to Run

### 1. Run the Permission Seeding Script

```bash
npx medusa exec ./src/scripts/seed-roles.ts
```

This will:

- Check for existing permissions
- Create only new permissions (avoiding duplicates)
- Show detailed progress and summary
- Create all 40 permissions across 8 modules

### 2. Verify the Permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

This will display:

- Total permission count
- Permissions grouped by resource
- Permissions grouped by action
- Validation check for all expected resources and actions

## Expected Output

### Seeding Output

```
Starting comprehensive permission seeding...
Creating 40 new permissions...
Batch 1: Created 40 permissions
✅ Permission seeding completed successfully!
Total permissions created: 40

Permissions created by resource:
  - Orders: 5 permissions (create, delete, list, view, update)
  - Products: 5 permissions (create, delete, list, view, update)
  - Inventory: 5 permissions (create, delete, list, view, update)
  - Customers: 5 permissions (create, delete, list, view, update)
  - Promotions: 5 permissions (create, delete, list, view, update)
  - Price Lists: 5 permissions (create, delete, list, view, update)
  - Settings: 5 permissions (create, delete, list, view, update)
  - Pages (Custom): 5 permissions (create, delete, list, view, update)
```

### Verification Output

```
============================================================
PERMISSION VERIFICATION REPORT
============================================================

📊 Total Permissions: 40

📁 CUSTOMERS (5 permissions):
  ✓ create     | customers-create        | Create new items in Customers
  ✓ delete     | customers-delete        | Delete items in Customers
  ✓ list       | customers-list          | List all items in Customers
  ✓ view       | customers-view          | View item details in Customers
  ✓ update     | customers-update        | Update existing items in Customers

[... similar for other modules ...]

============================================================
EXPECTED RESOURCES CHECK:
============================================================
  ✅ orders         : All 5 actions present
  ✅ products       : All 5 actions present
  ✅ inventory      : All 5 actions present
  ✅ customers      : All 5 actions present
  ✅ promotions     : All 5 actions present
  ✅ price_lists    : All 5 actions present
  ✅ settings       : All 5 actions present
  ✅ pages          : All 5 actions present

✅ Verification complete!
```

## Files Modified/Created

### Modified Files

1. `/src/scripts/seed-roles.ts` - Updated to seed all 40 permissions

### New Files

1. `/src/scripts/verify-permissions.ts` - Verification script
2. `/STEP1_PERMISSION_SEEDING.md` - This documentation

## Database Queries

### View All Permissions

```sql
SELECT resource, action, name, description
FROM permission
ORDER BY resource, action;
```

### Count Permissions by Resource

```sql
SELECT resource, COUNT(*) as permission_count
FROM permission
GROUP BY resource
ORDER BY resource;
```

### Check Specific Resource

```sql
SELECT *
FROM permission
WHERE resource = 'orders';
```

## Next Steps

After verifying that Step 1 is working correctly:

1. ✅ Confirm all 40 permissions are created
2. ✅ Verify database structure matches expectations
3. ✅ Check that duplicate permissions are not created on re-run
4. 🔄 Move to **Step 2**: Auto-permission creation for new custom models
5. 🔄 Move to **Step 3**: Sidebar hiding and restricted UI based on permissions

## Troubleshooting

### Issue: Permissions already exist

**Solution**: The script automatically skips existing permissions. This is normal behavior.

### Issue: Database connection error

**Solution**: Make sure your Medusa server is running and database is accessible.

### Issue: Permission count mismatch

**Solution**: Run the verification script to identify which permissions are missing or extra.

## Support

If you encounter any issues, please check:

1. Database connection is working
2. Migration has been run successfully
3. Permission table structure matches the model definition
