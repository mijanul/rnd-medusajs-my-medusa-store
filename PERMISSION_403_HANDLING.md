# Permission 403 Error Handling - Implementation Guide

## Problem

When users try to access protected resources (like `/app/customers`, `/app/orders`) without proper permissions, the API returns a 403 error, but users were not being redirected to an access-denied page.

## Solution

Implemented a global fetch interceptor that catches all 403 Forbidden responses and automatically redirects users to a user-friendly access-denied page.

---

## How It Works

### 1. **Permission Guard Widget** (Global Interceptor)

**File:** `/src/admin/widgets/permission-guard.tsx`

This invisible widget:

- Loads once when the admin panel starts
- Overrides the global `fetch()` function
- Intercepts all HTTP responses
- Checks for 403 status codes
- Extracts resource and action information from the error response
- Redirects to `/app/access-denied` with context

**Key Features:**

- ✅ **Runs once globally** - Uses `__permissionGuardInitialized` flag
- ✅ **Prevents redirect loops** - Checks if already on access-denied page
- ✅ **Extracts context** - Parses error message to get resource/action
- ✅ **Non-intrusive** - Returns `null` (no visible UI)

### 2. **Access Denied Page**

**File:** `/src/admin/routes/access-denied/page.tsx`

A user-friendly page that displays when users lack permissions:

- Shows lock icon and clear message
- Displays the resource and action that was denied
- Provides "Go Back" and "Go to Dashboard" buttons
- Includes instructions to contact administrator

### 3. **API Middleware Protection**

**File:** `/src/api/middlewares.ts`

Backend middleware that:

- Checks user permissions before allowing API access
- Returns 403 with structured error message:
  ```json
  {
    "message": "Forbidden: You don't have permission to list customers",
    "required_permission": "customers-list",
    "redirect": "/app/access-denied?resource=customers&action=list"
  }
  ```

---

## Flow Diagram

```
User clicks "Customers" in menu
           ↓
Browser requests: GET /admin/customers
           ↓
Backend Middleware checks permissions
           ↓
No "customers-list" permission found
           ↓
Returns: 403 Forbidden + error details
           ↓
Permission Guard Widget intercepts response
           ↓
Extracts: resource="customers", action="list"
           ↓
Checks: Not already on /access-denied page
           ↓
Redirects: window.location.href = "/app/access-denied?resource=customers&action=list"
           ↓
Access Denied page displays user-friendly message
```

---

## Installation Steps

### Step 1: Ensure Widget is Loaded

The widget is automatically loaded by Medusa. Verify it exists:

```bash
ls src/admin/widgets/permission-guard.tsx
```

### Step 2: Restart Medusa

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 3: Test the Implementation

1. Log in to admin panel
2. Open browser console (F12)
3. Look for: `[Permission Guard] ✓ Global 403 interceptor active`
4. Try to access a protected resource without permission
5. Should redirect to `/app/access-denied`

---

## Testing

### Test Case 1: Access Without Permission

1. **Setup:**

   - Create a role without "customers" permissions
   - Assign it to a test user
   - Log in as that user

2. **Test:**

   - Try to access `/app/customers`
   - Or click "Customers" in the menu

3. **Expected Result:**
   - Should redirect to `/app/access-denied?resource=customers&action=list`
   - Page shows: "You don't have permission to list customers"

### Test Case 2: Check Console Logs

Open browser console and look for:

```
[Permission Guard] Initializing global 403 interceptor...
[Permission Guard] ✓ Global 403 interceptor active
```

When accessing protected resource:

```
[Permission Denied] Redirecting to access-denied page - Resource: customers, Action: list
```

### Test Case 3: Verify No Redirect Loop

1. Navigate to `/app/access-denied` directly
2. Console should show: `[Permission Guard] Already on access-denied page, not redirecting`
3. Page should load normally without refresh loop

---

## Protected Resources

The following resources are automatically protected:

| Resource    | Endpoint              | Permission Required    |
| ----------- | --------------------- | ---------------------- |
| Customers   | `/admin/customers*`   | `customers-{action}`   |
| Orders      | `/admin/orders*`      | `orders-{action}`      |
| Products    | `/admin/products*`    | `products-{action}`    |
| Inventory   | `/admin/inventory*`   | `inventory-{action}`   |
| Promotions  | `/admin/promotions*`  | `promotions-{action}`  |
| Price Lists | `/admin/price-lists*` | `price_lists-{action}` |

**Actions:** `list`, `view`, `create`, `update`, `delete`

---

## Troubleshooting

### Issue: Page keeps refreshing

**Cause:** Redirect loop - the interceptor is redirecting even on the access-denied page

**Solution:**

- The widget now checks `window.location.pathname.includes("/access-denied")`
- If already on access-denied page, it skips the redirect

### Issue: Console shows "Already on access-denied page" repeatedly

**Cause:** Some component is making API calls that return 403 on the access-denied page

**Solution:** This is normal and harmless. The interceptor correctly prevents the redirect loop.

### Issue: Widget not loading / Interceptor not active

**Solution:**

1. Check console for initialization message
2. Restart Medusa dev server
3. Clear browser cache
4. Verify widget file exists and has no syntax errors

### Issue: 403 error but no redirect

**Cause:** The 403 response doesn't include "permission" in the message

**Solution:**

- Check middleware returns proper error format
- Verify the error message includes the word "permission"

---

## Widget Zones

The Permission Guard Widget is configured to load in the `order.list.before` zone, which ensures it loads early. You can change this if needed:

```tsx
export const config = defineWidgetConfig({
  zone: "order.list.before", // Change to any zone
});
```

**Available zones:**

- `order.list.before`
- `order.list.after`
- `product.list.before`
- `product.list.after`
- `customer.list.before`
- `customer.list.after`

---

## File Structure

```
src/
├── admin/
│   ├── widgets/
│   │   └── permission-guard.tsx          # 🔑 Global interceptor widget
│   ├── routes/
│   │   └── access-denied/
│   │       └── page.tsx                  # User-friendly error page
│   ├── lib/
│   │   └── use-permissions.ts            # Permission check utilities
│   └── components/
│       └── restricted-access.tsx         # UI components
└── api/
    └── middlewares.ts                     # Backend permission checks
```

---

## Customization

### Change Access Denied Message

Edit `/src/admin/routes/access-denied/page.tsx`:

```tsx
<Text className="text-ui-fg-subtle text-lg">
  You don't have permission to {action} {resource}
  {/* Add your custom message here */}
</Text>
```

### Add More Protected Routes

Edit `/src/api/middlewares.ts`:

```typescript
{
  matcher: "/admin/your-resource*",
  middlewares: [createPermissionChecker("Your Resource", "your_resource")],
}
```

### Disable Interceptor Temporarily

In browser console:

```javascript
window.__permissionGuardInitialized = false;
```

---

## Summary

✅ **Global 403 interceptor** via widget  
✅ **Prevents redirect loops** by checking current path  
✅ **User-friendly error page** with context  
✅ **Automatic resource/action extraction**  
✅ **Works with all protected endpoints**  
✅ **No code changes needed in individual pages**

The solution is clean, maintainable, and works globally across the entire admin panel!
