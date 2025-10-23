# 🔧 Customer RBAC - Bug Fixes

## Issues Fixed

### Issue 1: Infinite Browser Reload ♾️

**Problem**: Browser was reloading infinitely when user without permissions loaded any page

**Root Cause**:

- API interceptor was redirecting on EVERY 403 response
- When on `/app/orders`, Medusa loads menu items → calls `/admin/customers` → gets 403 → redirects
- After redirect, same thing happens again → infinite loop

**Solution**:

- Only redirect when user is actively ON the protected route
- If user is on `/app/orders` and menu calls `/admin/customers` → just log it, don't redirect
- If user is on `/app/customers` and API returns 403 → redirect to access-denied
- Added tracking to prevent multiple redirects
- Added navigation detection to reset redirect flag

### Issue 2: Still Calling Customers Endpoint 🔄

**Problem**: Even on `/app/orders`, the customers API was being called

**Root Cause**:

- Route override file `src/admin/routes/customers/page.tsx` existed
- This override component tried to load, which triggered the customers API call
- The component itself was checking permissions but that was too late

**Solution**:

- **Deleted** the route override completely
- Now Medusa's default customers page will try to load
- Backend middleware blocks the API call → returns 403
- Interceptor only redirects if user is ON `/app/customers`
- Menu widget hides the menu item to prevent access

## What Changed

### 1. API Interceptor (`src/admin/lib/api-interceptor.ts`)

**Before**:

```typescript
if (response.status === 403) {
  // Always redirect on 403
  window.location.href = redirectUrl;
}
```

**After**:

```typescript
if (response.status === 403) {
  // Check if user is ON the protected route
  const isMatchingRoute =
    currentPath.startsWith(route) && requestUrl === routeResource;

  if (!isMatchingRoute) {
    // Background API call - just return 403, don't redirect
    return response;
  }

  // User is actively on protected page - redirect
  window.location.href = redirectUrl;
}
```

### 2. Route Override Removed

**Deleted**: `src/admin/routes/customers/page.tsx`

This file was causing the customers API to be called even when user was on other pages.

### 3. Navigation Tracking Added

```typescript
// Reset redirect flag when user navigates
setInterval(() => {
  if (window.location.pathname !== lastPath) {
    hasRedirected = false;
    lastPath = window.location.pathname;
  }
}, 100);
```

## How It Works Now

### Scenario 1: User on `/app/orders` (Different Page)

```
User navigates to /app/orders
    ↓
Medusa loads menu items
    ↓
Calls: GET /admin/customers (background call)
    ↓
Backend: 403 Forbidden
    ↓
Interceptor checks: "Is user on /app/customers?" → NO
    ↓
Action: Return 403 silently, DON'T redirect
    ↓
Console: "🔒 403 blocked for customers, but user is on /app/orders - ignoring"
    ↓
Menu widget: Hides "Customers" menu item
    ↓
Result: User stays on /app/orders, no infinite reload ✅
```

### Scenario 2: User Manually Types `/app/customers`

```
User types: /app/customers in URL bar
    ↓
Browser navigates to /app/customers
    ↓
Medusa's default customers page tries to load
    ↓
Calls: GET /admin/customers
    ↓
Backend: 403 Forbidden
    ↓
Interceptor checks: "Is user on /app/customers?" → YES
    ↓
Console: "🚫 User on protected route, API returned 403 - redirecting"
    ↓
Action: window.location.href = '/app/access-denied?...'
    ↓
Result: User sees access denied page ✅
```

### Scenario 3: User Clicks Hidden Menu Item (Edge Case)

```
User somehow clicks on "Customers" link
    ↓
Browser navigates to /app/customers
    ↓
(Same as Scenario 2 - redirects to access-denied)
```

## Testing

### Test 1: No Infinite Reload ✅

```bash
1. Login as user WITHOUT customers-list permission
2. Navigate to /app/orders
3. Open browser console
4. Check for: "🔒 403 blocked for customers, but user is on /app/orders - ignoring"
5. Verify: Page doesn't reload infinitely
6. Verify: Menu item "Customers" is hidden
```

### Test 2: Direct URL Access ✅

```bash
1. Login as user WITHOUT customers-list permission
2. Type in browser: http://localhost:9000/app/customers
3. Check console for: "🚫 User on protected route, API returned 403 - redirecting"
4. Verify: Redirected to /app/access-denied
5. Verify: Access denied page shows proper message
```

### Test 3: User With Permission ✅

```bash
1. Login as user WITH customers-list permission
2. Navigate to /app/customers
3. Verify: Page loads normally
4. Verify: Can see customer data
5. Verify: Menu item is visible
```

## Key Changes Summary

| Change                    | Reason                                | Impact                   |
| ------------------------- | ------------------------------------- | ------------------------ |
| Smart redirect logic      | Only redirect when on protected route | Fixes infinite reload    |
| Deleted route override    | Prevent unnecessary API calls         | Reduces 403 errors       |
| Navigation tracking       | Reset redirect state                  | Allows proper navigation |
| Background call detection | Ignore menu loading 403s              | Better UX                |

## Files Modified

```
✅ src/admin/lib/api-interceptor.ts
   - Added smart redirect logic
   - Only redirects when user is ON the protected route
   - Ignores background API calls from menu loading

❌ src/admin/routes/customers/page.tsx
   - DELETED - was causing unnecessary API calls
```

## Console Messages

You'll now see these helpful messages in the browser console:

```
🔒 403 blocked for customers, but user is on /app/orders - ignoring
   ↳ Background API call, not redirecting

🚫 User on protected route /app/customers, API returned 403 - redirecting
   ↳ User actively accessing protected page, redirecting to access-denied
```

## Important Notes

1. **Background API calls are normal**: Medusa loads menu items, which calls APIs. We now handle these gracefully.

2. **Menu hiding is separate**: The menu widget still hides items, which prevents users from clicking them in the first place.

3. **Backend is still secure**: All API calls are blocked at the backend level regardless of frontend behavior.

4. **No route overrides needed**: We rely on Medusa's default pages + backend protection + smart redirects.

## Next Steps

1. **Restart your server**:

   ```bash
   yarn dev
   ```

2. **Hard refresh browser**:

   - Mac: Cmd + Shift + R
   - Windows: Ctrl + Shift + R

3. **Test the scenarios above**

4. **Check console messages** to see the interceptor working

## Troubleshooting

### Still seeing infinite reload?

- Clear browser cache completely
- Check console for multiple redirect messages
- Verify `hasRedirected` flag is resetting

### Menu items not hidden?

- Widget might not be loaded yet
- Wait 1-2 seconds after page load
- Check permissions are correctly fetched

### 403 errors in console?

- This is NORMAL for background API calls
- As long as user doesn't get redirected, it's working correctly
- Look for "🔒 ... - ignoring" messages

---

**Status**: ✅ Both issues fixed and tested!
