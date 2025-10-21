# Quick Commands - Permission System Setup

## Step 1: Permission Seeding

### Run Permission Seeding

```bash
npx medusa exec ./src/scripts/seed-roles.ts
```

### Verify Permissions

```bash
npx medusa exec ./src/scripts/verify-permissions.ts
```

### Check Database Directly (PostgreSQL)

```bash
# Connect to your database, then run:
SELECT resource, COUNT(*) as count
FROM permission
GROUP BY resource
ORDER BY resource;
```

## Expected Results

### Total Permissions: 40

- Orders: 5 (create, delete, list, view, update)
- Products: 5 (create, delete, list, view, update)
- Inventory: 5 (create, delete, list, view, update)
- Customers: 5 (create, delete, list, view, update)
- Promotions: 5 (create, delete, list, view, update)
- Price Lists: 5 (create, delete, list, view, update)
- Settings: 5 (create, delete, list, view, update)
- Pages: 5 (create, delete, list, view, update)

## Files Changed

- ✅ `/src/scripts/seed-roles.ts` - Updated seeding logic
- ✅ `/src/scripts/verify-permissions.ts` - New verification script
- ✅ `/STEP1_PERMISSION_SEEDING.md` - Full documentation

## Next Steps After Confirmation

1. Run the seeding command
2. Run the verification command
3. Confirm all 40 permissions are created
4. Report back for Step 2 implementation
