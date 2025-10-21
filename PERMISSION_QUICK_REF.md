# 🎯 Permission Management Quick Reference

## Daily Commands

### View Permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

### Add New Permissions

```bash
npx medusa exec ./src/scripts/seed-roles.ts
```

### Delete Test/Unwanted Permissions

```bash
npx medusa exec ./src/scripts/cleanup-permissions.ts
```

---

## Current State (After Step 1 + Cleanup)

✅ **40 Permissions** across **8 Resources**

| Resource    | Count | Actions                            |
| ----------- | ----- | ---------------------------------- |
| orders      | 5     | create, delete, list, view, update |
| products    | 5     | create, delete, list, view, update |
| inventory   | 5     | create, delete, list, view, update |
| customers   | 5     | create, delete, list, view, update |
| promotions  | 5     | create, delete, list, view, update |
| price_lists | 5     | create, delete, list, view, update |
| settings    | 5     | create, delete, list, view, update |
| pages       | 5     | create, delete, list, view, update |

---

## Future Deletion Scenarios

### Scenario 1: Delete Entire Resource

Edit `delete-permissions.ts`:

```typescript
deleteByResource: ["resource_name"];
confirmDelete: true;
```

### Scenario 2: Delete Single Action

Edit `delete-permissions.ts`:

```typescript
deleteByName: ["resource-action"]; // e.g., "orders-delete"
confirmDelete: true;
```

### Scenario 3: Delete Multiple Specific Permissions

Edit `delete-permissions.ts`:

```typescript
deleteByName: ["orders-create", "products-create", "inventory-create"];
confirmDelete: true;
```

Then run:

```bash
npx medusa exec ./src/scripts/delete-permissions.ts
```

---

## SQL Quick Queries

```sql
-- View all permissions
SELECT resource, action, name FROM permission ORDER BY resource, action;

-- Count by resource
SELECT resource, COUNT(*) FROM permission GROUP BY resource;

-- Find specific resource
SELECT * FROM permission WHERE resource = 'orders';

-- Find specific action across all resources
SELECT * FROM permission WHERE action = 'create';
```

---

## Files to Remember

- 📝 `seed-roles.ts` - Create permissions
- 🔍 `verify-permissions.ts` - Check state
- 🧹 `cleanup-permissions.ts` - Quick delete
- 🔧 `delete-permissions.ts` - Custom delete
- 📖 `PERMISSION_DELETION_GUIDE.md` - Full guide

---

## Next: Step 2 & 3

✅ **Step 1**: Permission seeding - DONE  
🔜 **Step 2**: Auto-create permissions for new models  
🔜 **Step 3**: Hide sidebar + restrict UI by permissions
