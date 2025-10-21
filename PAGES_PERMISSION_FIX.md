# Pages Permission Access Issue - Fixed

## Problem Summary

Users with the `perm_pages_list` permission were seeing "Access Restricted" when trying to access the pages list page, even though they had the correct permission assigned to their role.

## Root Cause

**Case Sensitivity Mismatch** between database and frontend code:

### Database

- The permission resource was stored as `"Pages"` (capital P)
- This was set by the `update-permission-descriptions.ts` script which changed resource from `"pages"` → `"Pages"`

### Frontend Code

- The permission checks were using `"pages"` (lowercase p)
- Example: `hasPermission("pages", "list")`

When the `hasPermission` function looked up permissions, it checked:

```javascript
const resourcePermissions = permissions.permissions_by_resource["pages"];
```

But the API returned:

```javascript
permissions_by_resource: {
  "Pages": ["list", "view", "create", "update", "delete"]
}
```

Since `"pages"` !== `"Pages"`, the lookup failed and returned `undefined`, causing the permission check to fail.

## Solution Applied

Updated all frontend permission checks to use `"Pages"` (capital P) to match the database:

### Files Modified:

1. **src/admin/routes/pages/page.tsx**

   - Line 38: List page access check
   - Line 118: Create button visibility
   - Line 131: Empty state create button
   - Line 184: Restore button visibility
   - Line 195: Edit button visibility
   - Line 202: Delete button visibility

2. **src/admin/routes/pages/create/page.tsx**

   - Line 36: Create page access check

3. **src/admin/routes/pages/[id]/page.tsx**
   - Line 51: Edit page access check

### Changes Made:

```typescript
// BEFORE
hasPermission("pages", "list");
hasPermission("pages", "view");
hasPermission("pages", "create");
hasPermission("pages", "update");
hasPermission("pages", "delete");

// AFTER
hasPermission("Pages", "list");
hasPermission("Pages", "view");
hasPermission("Pages", "create");
hasPermission("Pages", "update");
hasPermission("Pages", "delete");
```

## Testing Recommendations

1. Log in as a user with the admin role that has `perm_pages_list` permission
2. Navigate to the Pages list page
3. Verify that the page loads and displays the list of pages
4. Test other permission-based features:
   - Users with only `list` permission should see the list but not action buttons
   - Users with `create` permission should see the "Create Page" button
   - Users with `update` permission should see edit buttons
   - Users with `delete` permission should see delete buttons

## Verification Script

A new script has been created to help verify permission resource names:

```bash
npx medusa exec ./src/scripts/verify-pages-permissions.ts
```

This script will:

- Show all page-related permissions in the database
- Display the resource name used (Pages vs pages)
- Warn if there are multiple variations (case mismatch)
- Recommend the correct resource name to use in frontend

## Prevention

To avoid this issue in the future:

1. **Standardize Resource Names**: Decide on a naming convention (e.g., all lowercase or PascalCase) and apply it consistently
2. **Case-Insensitive Lookups**: Consider modifying the `hasPermission` function to do case-insensitive resource lookups
3. **Documentation**: Document the exact resource names used in permissions
4. **Type Safety**: Consider creating TypeScript types/enums for resource names

## Alternative Solution (Case-Insensitive Approach)

If you want to avoid case sensitivity issues entirely, you could modify the `use-permissions.ts` hook:

```typescript
const hasPermission = (resource: string, action: string): boolean => {
  if (!permissions) return false;
  if (permissions.is_super_admin) return true;

  // Case-insensitive lookup
  const resourceKey = Object.keys(permissions.permissions_by_resource).find(
    (key) => key.toLowerCase() === resource.toLowerCase()
  );

  if (!resourceKey) return false;

  const resourcePermissions = permissions.permissions_by_resource[resourceKey];

  return (
    resourcePermissions.includes(action) || resourcePermissions.includes("all")
  );
};
```

This would allow both `"pages"` and `"Pages"` to work correctly.
