# Testing Customer RBAC Middleware

## 🔧 Changes Made

### 1. Removed Duplicate Authentication

**Problem:** The `authenticate()` middleware was being applied twice - once by Medusa automatically for all `/admin/*` routes, and once by our middleware, causing 401 errors.

**Solution:** Removed the extra `authenticate()` call from our middleware since `/admin/*` routes are already authenticated by Medusa.

### 2. Proper 403 Response

Now when a user **IS authenticated** but **doesn't have permission**, they get:

- ✅ **403 Forbidden** (not 401 Unauthorized)
- ✅ **Redirect URL** in the response for frontend to use

## 📝 Updated Response Format

### When User Lacks Permission (403):

```json
{
  "message": "Forbidden: You don't have permission to list customers",
  "required_permission": "customers-list",
  "redirect": "/app/access-denied?resource=customers&action=list"
}
```

### When User Not Authenticated (401):

```json
{
  "message": "Unauthorized"
}
```

## 🚀 How to Test

### Step 1: Restart Server

```bash
# Stop server (Ctrl+C)
npx medusa develop
```

### Step 2: Test Without Customer Permissions

1. **Login** as a user who DOES NOT have customer permissions
2. **Try to access** `/app/customers` in the browser

**Expected:**

- ✅ See "Access Restricted" message
- ✅ Redirect to `/app/access-denied` page
- ✅ No redirect to login page

3. **Try API directly** (from browser console or curl):

```javascript
// In browser console:
fetch('/admin/customers', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Expected response:
{
  message: "Forbidden: You don't have permission to list customers",
  required_permission: "customers-list",
  redirect: "/app/access-denied?resource=customers&action=list"
}
```

### Step 3: Test With Customer Permissions

1. **Assign customer permissions** to user's role:

   - Go to: http://localhost:9000/app/rbac-manager/role-management
   - Edit user's role
   - Check: customers-list, customers-view
   - Save

2. **Refresh and try again**
3. Should now see customers page normally!

## 🔍 Understanding Status Codes

| Code    | Meaning      | When It Happens              | What User Sees     |
| ------- | ------------ | ---------------------------- | ------------------ |
| **200** | Success      | User has permission          | Normal page/data   |
| **401** | Unauthorized | Not logged in                | Redirect to login  |
| **403** | Forbidden    | Logged in, but no permission | Access denied page |
| **500** | Server Error | System error                 | Error message      |

## 💡 Frontend Behavior

The frontend pages (`src/admin/routes/customers/page.tsx`) already handle this:

1. **Check permissions** using `useUserPermissions()` hook
2. **If no permission:**
   - Show `<RestrictedAccess>` component
   - Auto-redirect to `/app/access-denied` after 2 seconds
3. **If has permission:**
   - Return `null` to let Medusa's default route load

## ✅ What's Fixed

- ✅ Removed duplicate authentication middleware
- ✅ Proper 403 (Forbidden) instead of 401 (Unauthorized)
- ✅ Added redirect URL in API response
- ✅ User stays logged in, just can't access customers
- ✅ Clear error messages

## 🐛 If Still Getting 401

If you're still getting 401 errors:

1. **Check if you're logged in:**

   - Open browser dev tools
   - Check Application > Cookies
   - Should have a session cookie

2. **Clear cache and restart:**

   ```bash
   # Clear browser cache
   # Then restart server
   npx medusa develop
   ```

3. **Check console logs:**
   - Look for authentication errors
   - Check if `auth_context.actor_id` is present

## 🎯 Next Steps

1. ✅ Restart server
2. ✅ Test with user without permissions (should get 403)
3. ✅ Assign permissions to role
4. ✅ Test again (should work)

The 403 error will now properly redirect to the access denied page instead of login! 🎉
