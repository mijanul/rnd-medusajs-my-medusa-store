# Permission Deletion & Cleanup Utilities

## Overview

Two scripts are provided for managing and cleaning up permissions in your database:

1. **cleanup-permissions.ts** - Automatic cleanup of test permissions
2. **delete-permissions.ts** - Flexible deletion with custom configuration

---

## Script 1: Quick Cleanup (Recommended for Your Case)

### Purpose

Automatically finds and deletes test permissions (Test and Test2 resources).

### Usage

```bash
npx medusa exec ./src/scripts/cleanup-permissions.ts
```

### What It Does

1. Lists all permissions in the database
2. Automatically detects "Test" and "Test2" resources
3. Deletes all permissions for these test resources
4. Shows before/after summary

### Expected Output

```
============================================================
PERMISSION CLEANUP UTILITY
============================================================

📊 Total Permissions in Database: 48

📁 Resources in Database:
  Test                 | 3 permission(s)
  Test2                | 5 permission(s)
  customers            | 5 permission(s)
  inventory            | 5 permission(s)
  orders               | 5 permission(s)
  pages                | 5 permission(s)
  price_lists          | 5 permission(s)
  products             | 5 permission(s)
  promotions           | 5 permission(s)
  settings             | 5 permission(s)

============================================================
⚠️  FOUND TEST PERMISSIONS TO CLEAN UP
============================================================
  Test       | create     | test-create              | 01K7PCCMTK2WP2X22Y5X13R3HA
  Test       | delete     | test-delete              | 01K7PCCMTRZE5DVXDP1Y7QS2EW
  Test       | list       | test-list                | 01K7PCCMTATKMEH4RT0MY1CGGQ
  Test2      | create     | test2-create             | 01K7PE03AC2SR41G80ZD0AW4RZ
  Test2      | delete     | test2-delete             | 01K7PE03AH400N8X83564C9B8K
  Test2      | edit       | test2-edit               | 01K7PE03AFRYYPYV8D74KR4K0S
  Test2      | list       | test2-list               | 01K7PE039T58DSSQZEG1M8PM1H
  Test2      | view       | test2-view               | 01K7PE03AATG21QVRNN0T8T94X

🗑️  Deleting 8 test permission(s)...
  ✓ Removed X role-permission associations
  ✓ Deleted 8 permission(s)

✅ Test permissions cleaned up successfully!

============================================================
FINAL DATABASE STATE
============================================================
Total Permissions: 40

  ✓ customers           : 5 permission(s)
  ✓ inventory           : 5 permission(s)
  ✓ orders              : 5 permission(s)
  ✓ pages               : 5 permission(s)
  ✓ price_lists         : 5 permission(s)
  ✓ products            : 5 permission(s)
  ✓ promotions          : 5 permission(s)
  ✓ settings            : 5 permission(s)

============================================================
```

---

## Script 2: Custom Deletion (Advanced)

### Purpose

Flexible deletion tool for specific permissions or resources.

### Usage

1. Edit `/src/scripts/delete-permissions.ts`
2. Configure the `DELETE_CONFIG` object
3. Run: `npx medusa exec ./src/scripts/delete-permissions.ts`

### Configuration Options

#### Option 1: Delete by Resource

Deletes ALL permissions for specified resources.

```typescript
const DELETE_CONFIG = {
  deleteByResource: [
    "Test", // Deletes all Test permissions
    "Test2", // Deletes all Test2 permissions
    "old_module", // Deletes all old_module permissions
  ],
  // ...
};
```

#### Option 2: Delete by Permission Name

Deletes specific permissions by their name.

```typescript
const DELETE_CONFIG = {
  deleteByName: ["orders-create", "products-view", "old-permission-name"],
  // ...
};
```

#### Option 3: Delete by Permission ID

Deletes specific permissions by their ID.

```typescript
const DELETE_CONFIG = {
  deleteById: ["perm_orders_create", "01K7PCCMTK2WP2X22Y5X13R3HA"],
  // ...
};
```

#### Dry Run Mode

Test before actually deleting:

```typescript
const DELETE_CONFIG = {
  // ... your deletion config ...

  confirmDelete: false, // Dry run - shows what would be deleted
  // confirmDelete: true, // Actually delete
};
```

### Examples

#### Example 1: Delete Test Resources (Your Current Need)

```typescript
const DELETE_CONFIG = {
  deleteByResource: ["Test", "Test2"],
  deleteByName: [],
  deleteById: [],
  confirmDelete: true,
};
```

#### Example 2: Delete Specific Permissions

```typescript
const DELETE_CONFIG = {
  deleteByResource: [],
  deleteByName: ["old-module-create", "old-module-delete"],
  deleteById: [],
  confirmDelete: true,
};
```

#### Example 3: Delete by IDs

```typescript
const DELETE_CONFIG = {
  deleteByResource: [],
  deleteByName: [],
  deleteById: ["01K7PCCMTK2WP2X22Y5X13R3HA", "01K7PCCMTATKMEH4RT0MY1CGGQ"],
  confirmDelete: true,
};
```

#### Example 4: Mixed Deletion

```typescript
const DELETE_CONFIG = {
  deleteByResource: ["Test"], // All Test permissions
  deleteByName: ["test2-create"], // Plus specific Test2 permission
  deleteById: ["01K7PE03AH400N8X83564C9B8K"], // Plus specific ID
  confirmDelete: true,
};
```

---

## Safety Features

### 1. Dry Run Mode

Always test first:

```typescript
confirmDelete: false; // See what would be deleted
```

Then confirm:

```typescript
confirmDelete: true; // Actually delete
```

### 2. Foreign Key Handling

Both scripts automatically:

- Delete `role_permission` associations first
- Then delete the permissions
- Prevents foreign key constraint errors

### 3. Duplicate Detection

Prevents deleting the same permission multiple times if specified in multiple ways.

---

## Common Use Cases

### Use Case 1: Remove Test Data (Your Current Need)

**Script**: `cleanup-permissions.ts`

```bash
npx medusa exec ./src/scripts/cleanup-permissions.ts
```

✅ Automatic, no configuration needed

### Use Case 2: Remove Old Custom Module

**Script**: `delete-permissions.ts`

Edit the script:

```typescript
const DELETE_CONFIG = {
  deleteByResource: ["old_module_name"],
  deleteByName: [],
  deleteById: [],
  confirmDelete: true,
};
```

Run:

```bash
npx medusa exec ./src/scripts/delete-permissions.ts
```

### Use Case 3: Remove Specific Action Across All Resources

**Script**: Query first, then use `delete-permissions.ts`

Find all 'create' actions:

```sql
SELECT id, name, resource
FROM permission
WHERE action = 'create';
```

Then delete specific ones:

```typescript
const DELETE_CONFIG = {
  deleteByName: ["resource1-create", "resource2-create"],
  // ...
};
```

### Use Case 4: Clean Up After Module Refactoring

If you renamed a module from "blog" to "posts":

```typescript
const DELETE_CONFIG = {
  deleteByResource: ["blog"], // Remove old permissions
  // Then run seed-roles.ts to create new "posts" permissions
};
```

---

## Verification

### After Deletion, Verify with SQL

#### Check Total Count

```sql
SELECT COUNT(*) FROM permission;
```

#### List All Resources

```sql
SELECT resource, COUNT(*) as count
FROM permission
GROUP BY resource
ORDER BY resource;
```

#### Verify Specific Resource is Gone

```sql
SELECT * FROM permission WHERE resource = 'Test';
-- Should return 0 rows
```

### Or Use Verification Script

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

---

## Files Overview

| File                     | Purpose                | When to Use                        |
| ------------------------ | ---------------------- | ---------------------------------- |
| `cleanup-permissions.ts` | Auto-delete Test/Test2 | One-time cleanup, no config needed |
| `delete-permissions.ts`  | Custom deletion        | Flexible deletion, requires config |
| `verify-permissions.ts`  | Check database state   | After any changes                  |
| `seed-roles.ts`          | Create permissions     | Add new permissions                |

---

## Workflow for Managing Permissions

### 1. View Current State

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

### 2. Delete Unwanted Permissions

Option A (for Test/Test2):

```bash
npx medusa exec ./src/scripts/cleanup-permissions.ts
```

Option B (custom):
Edit `delete-permissions.ts`, then:

```bash
npx medusa exec ./src/scripts/delete-permissions.ts
```

### 3. Verify Deletion

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

### 4. Add New Permissions (if needed)

```bash
npx medusa exec ./src/scripts/seed-roles.ts
```

---

## Troubleshooting

### Error: Foreign Key Constraint

**Cause**: Trying to delete permissions that are assigned to roles
**Solution**: Both scripts automatically handle this by deleting role_permission entries first

### Error: Permission Not Found

**Cause**: Permission name/ID doesn't exist
**Solution**: Use verify-permissions.ts to see actual permission names/IDs

### Error: No Permissions Deleted

**Cause**: confirmDelete is set to false (dry run mode)
**Solution**: Set `confirmDelete: true` in delete-permissions.ts

---

## Quick Reference

### Delete Test Permissions (Your Need)

```bash
npx medusa exec ./src/scripts/cleanup-permissions.ts
```

### Delete Custom Resource

Edit `delete-permissions.ts`:

```typescript
deleteByResource: ["your_resource_name"];
confirmDelete: true;
```

Then run:

```bash
npx medusa exec ./src/scripts/delete-permissions.ts
```

### View All Permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

---

**Created**: October 21, 2025  
**Status**: Ready to use
