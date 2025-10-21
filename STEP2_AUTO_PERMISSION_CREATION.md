# Step 2: Auto-Permission Creation for Custom Models

## Overview

This step implements automatic permission creation for new custom modules. When you create a new custom module (like Brands, Categories, Reviews, etc.), you can automatically generate the 5 standard permissions (create, delete, list, view, update).

---

## 🎯 Three Ways to Add Permissions for Custom Modules

### Method 1: Auto-Detection (Recommended) ⭐

Automatically scans all custom modules and creates permissions.

```bash
npx medusa exec ./src/scripts/auto-detect-modules.ts
```

**What it does:**

- Scans `src/modules/` for custom modules
- Detects module names from `model.define()` calls
- Creates permissions for all discovered modules
- Skips system modules (role-management, permission, etc.)

**Use when:**

- You have multiple new custom modules
- You want a quick setup
- You want to ensure all modules have permissions

---

### Method 2: Manual Configuration (Precise)

Configure and create permissions for a specific module.

**Steps:**

1. Edit `/src/scripts/add-custom-module-permissions.ts`
2. Update the `CUSTOM_MODULE` configuration:
   ```typescript
   const CUSTOM_MODULE = {
     resourceName: "brands",
     resourceDescription: "Brands",
   };
   ```
3. Run:
   ```bash
   npx medusa exec ./src/scripts/add-custom-module-permissions.ts
   ```

**Use when:**

- You want precise control over module name/description
- Adding permissions for a single module
- The module name doesn't match the model name

---

### Method 3: Programmatic (Advanced)

Use the utility functions in your own code.

```typescript
import { createPermissionsForResource } from "../utils/permission-utils";

// In your script or service
await createPermissionsForResource(container, "brands", "Brands");
```

**Use when:**

- Integrating with custom setup scripts
- Building automated workflows
- Creating permissions as part of module installation

---

## 📝 Example: Adding Permissions for a Brand Module

### Scenario

You created a new Brand module at `src/modules/brand/`

**Module structure:**

```
src/modules/brand/
├── models/
│   └── brand.ts
├── index.ts
└── service.ts
```

**Model definition (brand.ts):**

```typescript
import { model } from "@medusajs/framework/utils";

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  // ...
});

export default Brand;
```

### Option A: Auto-Detect

```bash
npx medusa exec ./src/scripts/auto-detect-modules.ts
```

**Output:**

```
🔍 Scanning for custom modules...
📦 Found 2 custom module(s):
   - pages
   - brand

🚀 Creating permissions for custom modules...
✅ Created 5 permission(s) for resource 'brand'
   - brand-create
   - brand-delete
   - brand-list
   - brand-view
   - brand-update
```

### Option B: Manual Configuration

1. Edit `add-custom-module-permissions.ts`:

   ```typescript
   const CUSTOM_MODULE = {
     resourceName: "brand",
     resourceDescription: "Brands",
   };
   ```

2. Run:
   ```bash
   npx medusa exec ./src/scripts/add-custom-module-permissions.ts
   ```

## 🔧 Configuration Options

### Resource Name Guidelines

**Good resource names:**

- ✅ `brand` or `brands`
- ✅ `blog_posts`
- ✅ `product_categories`
- ✅ `customer_reviews`

**Avoid:**

- ❌ `Brand` (use lowercase)
- ❌ `brand-items` (use underscores, not hyphens)
- ❌ `BrandModel` (keep it simple)

### Resource Description

Optional, human-readable name for the resource:

- `"Brands"` for `brand`
- `"Blog Posts"` for `blog_posts`
- `"Product Categories"` for `product_categories`

If omitted, it auto-capitalizes the resource name.

---

## 🛠️ Utility Functions Reference

### `generatePermissionsForResource()`

Generate permission objects without saving to database.

```typescript
import { generatePermissionsForResource } from "../utils/permission-utils";

const permissions = generatePermissionsForResource("brands", "Brands");
// Returns array of permission objects
```

### `createPermissionsForResource()`

Create permissions in database for a single resource.

```typescript
import { createPermissionsForResource } from "../utils/permission-utils";

const result = await createPermissionsForResource(
  container,
  "brands",
  "Brands"
);
// Returns: { created: 5, skipped: 0 }
```

### `batchCreatePermissions()`

Create permissions for multiple resources at once.

```typescript
import { batchCreatePermissions } from "../utils/permission-utils";

const resources = [
  { name: "brands", description: "Brands" },
  { name: "categories", description: "Categories" },
];

await batchCreatePermissions(container, resources);
```

### `STANDARD_ACTIONS`

The default 5 actions for all resources.

```typescript
import { STANDARD_ACTIONS } from "../utils/permission-utils";

// [
//   { name: "create", description: "Create new items" },
//   { name: "delete", description: "Delete items" },
//   { name: "list", description: "List all items" },
//   { name: "view", description: "View item details" },
//   { name: "update", description: "Update existing items" },
// ]
```

---

## 📋 Workflow: Adding a New Custom Module

### Step-by-Step Process

1. **Create your custom module**

   ```
   src/modules/brand/
   ├── models/
   │   └── brand.ts
   ├── index.ts
   └── service.ts
   ```

2. **Define your model**

   ```typescript
   const Brand = model.define("brand", { ... });
   ```

3. **Auto-create permissions**

   ```bash
   npx medusa exec ./src/scripts/auto-detect-modules.ts
   ```

4. **Verify permissions**

   ```bash
   npx medusa exec ./src/scripts/verify-permissions.ts
   ```

5. **Check in database**

   ```sql
   SELECT * FROM permission WHERE resource = 'brand';
   ```

6. **Assign to roles** (via admin UI or script)

7. **Use in your routes**
   ```typescript
   // Check permission in route
   if (!hasPermission(user, "brand-view")) {
     throw new Error("Unauthorized");
   }
   ```

---

## 🔍 Auto-Detection Details

### How It Works

1. Scans `src/modules/` directory
2. For each subdirectory, checks `models/*.ts` files
3. Looks for `model.define("module_name", {...})` pattern
4. Extracts the module name
5. Excludes system modules (role-management, permission, etc.)
6. Creates 5 permissions for each discovered module

### Excluded Modules

The following modules are automatically excluded:

- `role-management`
- `permission`
- `role`
- `user_role`
- `role_permission`

To exclude more modules, edit `auto-detect-modules.ts`:

```typescript
const EXCLUDED_MODULES = [
  "role-management",
  "permission",
  "role",
  "user_role",
  "role_permission",
  "your_module_to_exclude", // Add here
];
```

---

## 📊 Expected Results

### For a Single Module (e.g., Brand)

```
✅ Created 5 permission(s) for resource 'brand'
   - brand-create
   - brand-delete
   - brand-list
   - brand-view
   - brand-update
```

### Database Records

```sql
SELECT id, name, resource, action FROM permission WHERE resource = 'brand';
```

| id                | name         | resource | action |
| ----------------- | ------------ | -------- | ------ |
| perm_brand_create | brand-create | brand    | create |
| perm_brand_delete | brand-delete | brand    | delete |
| perm_brand_list   | brand-list   | brand    | list   |
| perm_brand_view   | brand-view   | brand    | view   |
| perm_brand_update | brand-update | brand    | update |

---

## 🎨 Customizing Actions

If you need different actions for a specific module, you can customize:

### Custom Actions for Specific Module

```typescript
import { createPermissionsForResource } from "../utils/permission-utils";

const customActions = [
  { name: "create", description: "Create new items" },
  { name: "approve", description: "Approve items" },
  { name: "publish", description: "Publish items" },
  { name: "archive", description: "Archive items" },
];

await createPermissionsForResource(
  container,
  "blog_posts",
  "Blog Posts",
  customActions
);
```

This creates:

- `blog_posts-create`
- `blog_posts-approve`
- `blog_posts-publish`
- `blog_posts-archive`

---

## 🧪 Testing

### Test Auto-Detection

```bash
# Run auto-detection
npx medusa exec ./src/scripts/auto-detect-modules.ts

# Verify results
npx medusa exec ./src/scripts/verify-permissions.ts
```

### Test Single Module Addition

```bash
# Configure module in add-custom-module-permissions.ts
# Then run
npx medusa exec ./src/scripts/add-custom-module-permissions.ts

# Verify
npx medusa exec ./src/scripts/verify-permissions.ts
```

### Test in Database

```sql
-- Check all custom module permissions
SELECT resource, COUNT(*)
FROM permission
WHERE resource NOT IN ('orders', 'products', 'inventory', 'customers', 'promotions', 'price_lists', 'settings')
GROUP BY resource;
```

---

## 📚 Files Created

| File                                            | Purpose              |
| ----------------------------------------------- | -------------------- |
| `/src/utils/permission-utils.ts`                | Utility functions    |
| `/src/scripts/add-custom-module-permissions.ts` | Manual single module |
| `/src/scripts/auto-detect-modules.ts`           | Auto-detection       |
| `/STEP2_AUTO_PERMISSION_CREATION.md`            | This documentation   |

---

## 🚀 Quick Reference

### Add permissions for all custom modules

```bash
npx medusa exec ./src/scripts/auto-detect-modules.ts
```

### Add permissions for one module

Edit `add-custom-module-permissions.ts`, then:

```bash
npx medusa exec ./src/scripts/add-custom-module-permissions.ts
```

### Verify all permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

---

## ⚠️ Important Notes

1. **Idempotent**: All scripts check for existing permissions first
2. **No Duplicates**: Will skip permissions that already exist
3. **Safe to Re-run**: You can run scripts multiple times safely
4. **Batch Operations**: Permissions are created in batches for performance
5. **Transaction Safety**: Database operations are wrapped in transactions

---

## 🔄 Integration with Existing Workflow

### Complete Permission Management Workflow

```bash
# 1. View current state
npx medusa exec ./src/scripts/verify-permissions.ts

# 2. Create new module (e.g., src/modules/brand/)

# 3. Auto-create permissions
npx medusa exec ./src/scripts/auto-detect-modules.ts

# 4. Verify new permissions
npx medusa exec ./src/scripts/verify-permissions.ts

# 5. Assign to roles (via admin UI)

# 6. Use in your code
```

---

**Created**: October 21, 2025  
**Status**: Ready to use  
**Next**: Step 3 - Permission-based UI restrictions
