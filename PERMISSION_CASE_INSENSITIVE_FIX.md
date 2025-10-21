# Permission Case-Insensitive Fix

## Problem Summary

The permission system had case sensitivity issues where:

- Some resources in the database use lowercase: `orders`, `products`, `customers`, `inventory`, `promotions`, `settings`
- Some resources use Title Case: `Pages`, `Price Lists`
- Frontend code used lowercase: `hasPermission("pages", "list")`

This caused permission checks to fail when database casing didn't match frontend casing.

## Solution: Case-Insensitive Permission Lookup

Instead of updating every frontend file to match database casing, we made the `hasPermission` function **case-insensitive**.

### Changes Made

**File: `src/admin/lib/use-permissions.ts`**

Updated three functions to perform case-insensitive resource lookups:

#### 1. `hasPermission` Function

```typescript
const hasPermission = (resource: string, action: string): boolean => {
  if (!permissions) return false;
  if (permissions.is_super_admin) return true;

  // Case-insensitive resource lookup
  const resourceKey = Object.keys(permissions.permissions_by_resource).find(
    (key) => key.toLowerCase() === resource.toLowerCase()
  );

  if (!resourceKey) return false;

  const resourcePermissions = permissions.permissions_by_resource[resourceKey];
  if (!resourcePermissions) return false;

  return (
    resourcePermissions.includes(action) || resourcePermissions.includes("all")
  );
};
```

#### 2. `hasAnyPermission` Function

```typescript
const hasAnyPermission = (resource: string): boolean => {
  if (!permissions) return false;
  if (permissions.is_super_admin) return true;

  // Case-insensitive resource lookup
  const resourceKey = Object.keys(permissions.permissions_by_resource).find(
    (key) => key.toLowerCase() === resource.toLowerCase()
  );

  return !!resourceKey;
};
```

#### 3. `checkPermission` Helper Function

```typescript
export const checkPermission = async (
  resource: string,
  action: string
): Promise<boolean> => {
  // ... auth checks ...

  // Case-insensitive resource lookup
  const resourceKey = Object.keys(data.permissions_by_resource).find(
    (key) => key.toLowerCase() === resource.toLowerCase()
  );

  if (!resourceKey) return false;

  const resourcePermissions = data.permissions_by_resource[resourceKey];
  // ... rest of logic
};
```

## Benefits

### ✅ Flexibility

- Frontend can use any casing: `"pages"`, `"Pages"`, or `"PAGES"` - all work
- No need to remember exact database casing

### ✅ Consistency

- All permission checks work the same way across the application
- Developers can use consistent lowercase naming in frontend code

### ✅ Future-Proof

- If database casing changes, frontend code doesn't need updates
- Works with mixed casing scenarios (some resources lowercase, others Title Case)

### ✅ Backward Compatible

- Existing code continues to work without changes
- No breaking changes to the API

## Database Permission Structure

Current database state (as of 2025-10-21):

| Resource Type    | Casing     | Examples                                                                 |
| ---------------- | ---------- | ------------------------------------------------------------------------ |
| Core Resources   | lowercase  | `orders`, `products`, `customers`, `inventory`, `promotions`, `settings` |
| Custom Resources | Title Case | `Pages`, `Price Lists`                                                   |

## Usage Examples

All of these now work correctly:

```typescript
// Lowercase (recommended for consistency)
hasPermission("pages", "list");
hasPermission("orders", "view");
hasPermission("products", "create");

// Title Case (matches database for custom resources)
hasPermission("Pages", "list");
hasPermission("Price Lists", "view");

// Even mixed case works (though not recommended)
hasPermission("PAGES", "list");
hasPermission("pAGeS", "list");
```

## Recommendation

For code consistency, we recommend:

- **Use lowercase in frontend code**: `hasPermission("pages", "list")`
- This makes code more readable and follows common naming conventions
- The case-insensitive lookup handles the database mapping automatically

## Testing

Test with different permission scenarios:

1. **Lowercase resources** (orders, products, customers):

   ```typescript
   hasPermission("orders", "list"); // ✅ Works
   hasPermission("Orders", "list"); // ✅ Also works
   ```

2. **Title Case resources** (Pages, Price Lists):

   ```typescript
   hasPermission("pages", "list"); // ✅ Works
   hasPermission("Pages", "list"); // ✅ Also works
   hasPermission("price lists", "view"); // ✅ Works
   hasPermission("Price Lists", "view"); // ✅ Also works
   ```

3. **Multi-word resources with spaces**:
   ```typescript
   hasPermission("price lists", "create"); // ✅ Works
   hasPermission("Price Lists", "create"); // ✅ Works
   ```

## Migration Notes

- ✅ No database changes required
- ✅ No frontend code changes required (existing code still works)
- ✅ All existing permission checks continue to function
- 🔄 Optional: Standardize frontend code to use lowercase for consistency

## Performance Impact

**Minimal** - The case-insensitive lookup uses `Array.find()` with `toLowerCase()`:

- Runs once per permission check
- Permission objects are typically small (< 50 resources per user)
- Modern JavaScript engines optimize string comparison
- No noticeable performance impact in practice
