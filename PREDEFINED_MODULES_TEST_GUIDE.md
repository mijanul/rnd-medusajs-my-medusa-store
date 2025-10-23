# Quick Test Guide - Predefined Modules Protection

## Test Checklist

### ✅ Prerequisites

1. Run permission seeding:

   ```bash
   npx medusa exec ./src/scripts/seed-roles.ts
   ```

2. Verify permissions exist:
   ```bash
   npx medusa exec ./src/scripts/verify-permissions.ts
   ```

Expected output:

```
✓ orders: 5 permissions (create, delete, list, view, update)
✓ products: 5 permissions (create, delete, list, view, update)
✓ customers: 5 permissions (create, delete, list, view, update)
```

### 🧪 Test Scenarios

#### Scenario 1: User with NO permissions

1. Create a test role with no permissions:

   ```sql
   INSERT INTO role (id, name, slug, is_active, created_at, updated_at)
   VALUES ('role_no_access', 'No Access', 'no-access', true, NOW(), NOW());
   ```

2. Assign to a user:

   ```sql
   INSERT INTO user_role (id, user_id, role_id, created_at, updated_at)
   VALUES (
     'ur_test_1',
     'usr_YOUR_USER_ID',
     'role_no_access',
     NOW(),
     NOW()
   );
   ```

3. Login and try to access:

   - `/orders` → Should show "Access Restricted"
   - `/products` → Should show "Access Restricted"
   - `/customers` → Should show "Access Restricted"

4. Try API calls:
   ```bash
   curl -X GET http://localhost:9000/admin/orders \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: `403 Forbidden`

#### Scenario 2: User with VIEW-ONLY permissions

1. Create a viewer role:

   ```sql
   INSERT INTO role (id, name, slug, is_active, created_at, updated_at)
   VALUES ('role_viewer', 'Viewer', 'viewer', true, NOW(), NOW());

   -- Assign view permissions
   INSERT INTO role_permission (id, role_id, permission_id, created_at, updated_at)
   SELECT
     'rp_' || gen_random_uuid()::text,
     'role_viewer',
     id,
     NOW(),
     NOW()
   FROM permission
   WHERE action IN ('list', 'view')
   AND resource IN ('orders', 'products', 'customers');
   ```

2. Test UI:

   - Can access `/orders` ✅
   - Can access `/products` ✅
   - Can access `/customers` ✅
   - Edit/Delete buttons should be hidden (if implemented)

3. Test API:

   ```bash
   # Should work
   curl -X GET http://localhost:9000/admin/orders -H "Authorization: Bearer YOUR_TOKEN"

   # Should fail with 403
   curl -X POST http://localhost:9000/admin/orders \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

#### Scenario 3: User with FULL permissions

1. Create a manager role:

   ```sql
   INSERT INTO role (id, name, slug, is_active, created_at, updated_at)
   VALUES ('role_manager', 'Manager', 'manager', true, NOW(), NOW());

   -- Assign all permissions
   INSERT INTO role_permission (id, role_id, permission_id, created_at, updated_at)
   SELECT
     'rp_' || gen_random_uuid()::text,
     'role_manager',
     id,
     NOW(),
     NOW()
   FROM permission
   WHERE resource IN ('orders', 'products', 'customers');
   ```

2. Test UI:

   - Can access all pages ✅
   - Can see all action buttons ✅

3. Test API:
   ```bash
   # All operations should work
   curl -X GET http://localhost:9000/admin/orders -H "Authorization: Bearer YOUR_TOKEN"
   curl -X POST http://localhost:9000/admin/orders -H "Authorization: Bearer YOUR_TOKEN" -d '{...}'
   curl -X GET http://localhost:9000/admin/orders/order_123 -H "Authorization: Bearer YOUR_TOKEN"
   curl -X POST http://localhost:9000/admin/orders/order_123 -H "Authorization: Bearer YOUR_TOKEN" -d '{...}'
   curl -X DELETE http://localhost:9000/admin/orders/order_123 -H "Authorization: Bearer YOUR_TOKEN"
   ```

### 🔍 Debugging Tips

#### Check User's Permissions

```sql
-- Get all permissions for a user
SELECT
  u.email,
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM "user" u
JOIN user_role ur ON u.id = ur.user_id
JOIN role r ON ur.role_id = r.id
JOIN role_permission rp ON r.id = rp.role_id
JOIN permission p ON rp.permission_id = p.id
WHERE u.id = 'usr_YOUR_USER_ID'
ORDER BY p.resource, p.action;
```

#### Check if Permission Exists

```sql
SELECT * FROM permission
WHERE resource = 'orders'
AND action = 'list';
```

#### Check Role-Permission Mapping

```sql
SELECT
  r.name as role_name,
  p.name as permission_name
FROM role r
JOIN role_permission rp ON r.id = rp.role_id
JOIN permission p ON rp.permission_id = p.id
WHERE r.slug = 'viewer';
```

### 🎯 Quick Commands

```bash
# 1. Start Medusa
npm run dev

# 2. In another terminal, seed permissions
npx medusa exec ./src/scripts/seed-roles.ts

# 3. Verify setup
npx medusa exec ./src/scripts/verify-permissions.ts

# 4. Check your user's permissions
npx medusa exec ./src/scripts/check-role-permissions.ts

# 5. Open admin panel
open http://localhost:9000/app
```

### 📊 Expected Behavior Matrix

| Permission | List UI | View UI | Create UI | Update UI | Delete UI | List API | View API | Create API | Update API | Delete API |
| ---------- | ------- | ------- | --------- | --------- | --------- | -------- | -------- | ---------- | ---------- | ---------- |
| None       | ❌      | ❌      | ❌        | ❌        | ❌        | ❌       | ❌       | ❌         | ❌         | ❌         |
| list       | ✅      | ❌      | ❌        | ❌        | ❌        | ✅       | ❌       | ❌         | ❌         | ❌         |
| view       | ✅      | ✅      | ❌        | ❌        | ❌        | ✅       | ✅       | ❌         | ❌         | ❌         |
| create     | ✅      | ✅      | ✅        | ❌        | ❌        | ✅       | ✅       | ✅         | ❌         | ❌         |
| update     | ✅      | ✅      | ✅        | ✅        | ❌        | ✅       | ✅       | ✅         | ✅         | ❌         |
| delete     | ✅      | ✅      | ✅        | ✅        | ✅        | ✅       | ✅       | ✅         | ✅         | ✅         |

Note: Having a "higher" permission (like delete) typically implies having "lower" permissions (like view), but this depends on your role setup.

### 🐛 Common Issues

#### Issue: "Permission check always fails"

**Solution:**

1. Check if permissions exist: `npx medusa exec ./src/scripts/verify-permissions.ts`
2. Check if user has role: Query `user_role` table
3. Check if role has permissions: Query `role_permission` table
4. Check browser console for errors
5. Check Medusa logs

#### Issue: "UI shows access denied but API works"

**Solution:**

1. Clear browser cache
2. Check `useUserPermissions` hook
3. Verify permission names match
4. Check for typos in resource/action names

#### Issue: "Cannot read property 'actor_id'"

**Solution:**

1. Ensure route is authenticated
2. Check auth middleware is applied
3. Verify JWT token is valid

### ✨ Success Criteria

When everything is working correctly:

1. ✅ Users without permissions see "Access Restricted" message
2. ✅ Users with view permission can see data but not modify
3. ✅ Users with edit permission can modify data
4. ✅ API returns 403 for unauthorized operations
5. ✅ UI hides buttons for actions user cannot perform
6. ✅ No console errors
7. ✅ Smooth user experience with loading states

## Next Steps

After testing, consider:

1. **Add more granular permissions** (e.g., `orders-export`, `orders-refund`)
2. **Implement field-level permissions** (e.g., can view but not edit price)
3. **Add audit logging** for permission checks
4. **Create permission templates** for common roles
5. **Build permission management UI** for admins
