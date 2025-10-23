# 🐛 Menu Hiding Debug Guide

## Understanding the Code

### The Complete Flow

```
1. MenuCustomizer Widget Loads
        ↓
2. useUserPermissions() Hook Runs
        ↓
3. Fetches: GET /admin/users/me → Gets user ID
        ↓
4. Fetches: GET /admin/users/{id}/roles → Gets roles & permissions
        ↓
5. Collects all permission names into array
        ↓
6. Passes permissions array to checkAndHideMenuItems()
        ↓
7. For each menu link, checks:
   - Does href include "/app/customers"?
   - Does user have ANY customer permission?
   - If NO → Hide menu item (display: none)
   - If YES → Show menu item
```

---

## How to Debug Your Issue

### Step 1: Check Browser Console

1. **Restart your Medusa server**: `yarn dev`
2. **Open admin in browser**: `http://localhost:9000/app`
3. **Open Browser DevTools**: Press F12 or Cmd+Option+I (Mac)
4. **Go to Console tab**

You should now see these debug messages:

```
🔑 Menu Customizer - User Permissions: ["customers-list", "orders-view", ...]
🔍 hasCustomersPermission called with: ["customers-list", "orders-view", ...]
🔍 Checking customer permissions: true
   Looking for any of: ["customers-list", "customers-view", ...]
   Found in user permissions: ["customers-list"]
🔍 Customers Menu: hasPermission=true, href=/app/customers
✅ Showing Customers menu item
```

---

### Step 2: Identify the Problem

Look at the console output and answer:

#### Q1: What permissions does your user have?

```
🔑 Menu Customizer - User Permissions: [???]
```

**Expected**: Should include "customers-list" or "customers-view" or similar

**If you see**: `[]` (empty array)

- **Problem**: User has no permissions assigned
- **Solution**: Assign a role with customer permissions

**If you see**: `["orders-list", "products-view"]` (no customer permissions)

- **Problem**: User doesn't have customer permissions
- **Solution**: Add customer permissions to user's role

**If you see**: `["customer-list"]` (missing 's')

- **Problem**: Permission names don't match
- **Solution**: Update the customerPermissions array in code

---

#### Q2: Does hasCustomersPermission return true or false?

```
🔍 Checking customer permissions: false  ← THIS IS THE KEY!
```

**If FALSE when you have permissions**:

- Check what it's looking for vs what you have
- Permission names must match EXACTLY

---

#### Q3: What's the final decision?

```
🔍 Customers Menu: hasPermission=true, href=/app/customers
✅ Showing Customers menu item  ← Should say this!
```

OR

```
🔍 Customers Menu: hasPermission=false, href=/app/customers
🚫 Hiding Customers menu item  ← Problem: hiding when shouldn't!
```

---

### Step 3: Common Issues & Solutions

#### Issue A: Empty Permissions Array

**Console shows**: `🔑 Menu Customizer - User Permissions: []`

**Cause**: User has no role assigned OR role has no permissions

**How to fix**:

1. Check database:

   ```sql
   SELECT * FROM user_role WHERE user_id = 'YOUR_USER_ID';
   SELECT * FROM role WHERE id = 'ROLE_ID_FROM_ABOVE';
   SELECT * FROM role_permission WHERE role_id = 'ROLE_ID';
   ```

2. Assign role via API:
   ```bash
   POST /admin/users/{user_id}/roles
   {
     "role_ids": ["role_admin"]
   }
   ```

---

#### Issue B: Permission Names Don't Match

**Console shows**:

```
Looking for any of: ["customers-list", ...]
Found in user permissions: []  ← Nothing found!
```

But you KNOW user has customer permissions in database.

**Cause**: Permission names in database are different from code

**How to fix**:

1. Check actual permission names in database:

   ```sql
   SELECT name FROM permission WHERE name LIKE '%customer%';
   ```

2. Update the code to match your actual permission names:
   ```tsx
   const customerPermissions = [
     "customer-list", // ← Note: no 's'
     "customer-view",
     // ... etc
   ];
   ```

---

#### Issue C: API Returns Wrong Data

**Console shows**: Error or undefined

**Cause**: API endpoint not returning correct structure

**How to fix**:

1. Test API directly:

   ```bash
   curl http://localhost:9000/admin/users/me \
     -H "Cookie: connect.sid=YOUR_SESSION"

   curl http://localhost:9000/admin/users/{id}/roles \
     -H "Cookie: connect.sid=YOUR_SESSION"
   ```

2. Check response structure matches code expectations

---

### Step 4: Fix It Yourself

Based on what you find in the console, here's what to change:

#### If permission names don't match:

**Location**: `src/admin/widgets/menu-customizer.tsx`

**Change this**:

```tsx
const customerPermissions = [
  "customers-list", // ← Your actual names
  "customers-view",
  "customers-create",
  "customers-update",
  "customers-delete",
  "customers-all",
];
```

**To match your database**:

```tsx
const customerPermissions = [
  "customer-list", // ← No 's' if that's what's in DB
  "customer-view",
  // ... etc
];
```

---

#### If you want to require ALL permissions instead of ANY:

**Change this**:

```tsx
return customerPermissions.some((perm) => permissions.includes(perm));
```

**To this**:

```tsx
return customerPermissions.every((perm) => permissions.includes(perm));
```

---

#### If you want to check specific permissions only:

**Change this**:

```tsx
const customerPermissions = [
  "customers-list",
  "customers-view",
  "customers-create",
  "customers-update",
  "customers-delete",
  "customers-all",
];
```

**To this** (only list permission required):

```tsx
const customerPermissions = [
  "customers-list", // ← Only need list permission
];
```

---

## Quick Test

After making changes:

1. **Save file**
2. **Restart server**: `yarn dev`
3. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. **Check console** for debug messages
5. **Check if menu item appears**

---

## Remove Debug Logs Later

Once you've fixed it, you can remove the console.log statements to clean up the console.

---

## Summary

The menu hiding works by:

1. Fetching user's permissions from API
2. Checking if user has ANY customer-related permission
3. Hiding menu item with `display: none` if no permission

The most common issue is **permission names don't match** between:

- What's in your database
- What the code is looking for

Use the debug logs to identify the mismatch and update the code accordingly! 🎯
