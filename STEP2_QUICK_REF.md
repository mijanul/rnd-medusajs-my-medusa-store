# 🎯 Step 2 Quick Reference - Auto-Permission Creation

## One Command Setup ⚡

### Auto-create permissions for all custom modules

```bash
npx medusa exec ./src/scripts/auto-detect-modules.ts
```

---

## Three Methods

### 1. Auto-Detection (Recommended) ⭐

```bash
npx medusa exec ./src/scripts/auto-detect-modules.ts
```

- Scans all custom modules
- Creates 5 permissions per module
- No configuration needed

### 2. Manual Addition

Edit `/src/scripts/add-custom-module-permissions.ts`:

```typescript
const CUSTOM_MODULE = {
  resourceName: "brands",
  resourceDescription: "Brands",
};
```

Then run:

```bash
npx medusa exec ./src/scripts/add-custom-module-permissions.ts
```

### 3. Programmatic

```typescript
import { createPermissionsForResource } from "../modules/role-management/permission-utils";

await createPermissionsForResource(container, "brands", "Brands");
```

---

## What Gets Created

For each module, 5 permissions:

- ✅ `{resource}-create`
- ✅ `{resource}-delete`
- ✅ `{resource}-list`
- ✅ `{resource}-view`
- ✅ `{resource}-update`

Example for "brand":

- `brand-create`, `brand-delete`, `brand-list`, `brand-view`, `brand-update`

---

## Workflow

```bash
# 1. Create your custom module
mkdir -p src/modules/brand/models

# 2. Define model
# model.define("brand", { ... })

# 3. Auto-create permissions
npx medusa exec ./src/scripts/auto-detect-modules.ts

# 4. Verify
npx medusa exec ./src/scripts/verify-permissions.ts
```

---

## Utility Functions

```typescript
// In src/utils/permission-utils.ts

// Generate permission objects
generatePermissionsForResource("brands", "Brands");

// Create in database
await createPermissionsForResource(container, "brands", "Brands");

// Batch create
await batchCreatePermissions(container, [
  { name: "brands", description: "Brands" },
  { name: "categories", description: "Categories" },
]);
```

---

## Files

- ✅ `permission-utils.ts` - Utility functions
- ✅ `auto-detect-modules.ts` - Auto-detection
- ✅ `add-custom-module-permissions.ts` - Manual addition
- ✅ `STEP2_AUTO_PERMISSION_CREATION.md` - Full docs

---

## Status

✅ Step 1: Core module permissions - DONE  
✅ Step 2: Auto-creation for custom modules - DONE  
🔜 Step 3: UI restrictions & sidebar hiding
