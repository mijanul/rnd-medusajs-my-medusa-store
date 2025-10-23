# Customer RBAC - Complete Solution ✅

## 🎯 Overview

This document describes the **complete three-layer protection** for Customers and Customer Groups pages with role-based access control (RBAC).

## 🛡️ Three Layers of Protection

### Layer 1: Backend API Protection (PRIMARY)

**File**: `src/api/middlewares.ts`

- ✅ Protects ALL `/admin/customers*` endpoints
- ✅ Protects ALL `/admin/customer-groups*` endpoints
- ✅ Returns 403 (Forbidden) when user lacks permissions
- ✅ Prevents any data leakage at the API level

**Required Permissions**:

- `customers-list` - List/view customers
- `customers-create` - Create customers
- `customers-update` - Update customers
- `customers-delete` - Delete customers

### Layer 2: Global API Interceptor (FRONTEND REDIRECT)

**File**: `src/admin/lib/api-interceptor.ts`

- ✅ Intercepts ALL fetch/API calls globally
- ✅ Catches 403 responses from ANY endpoint
- ✅ Automatically redirects to `/app/access-denied` page
- ✅ Includes resource, action, and permission context

**How it works**:

```typescript
// Overrides window.fetch globally
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  if (response.status === 403) {
    // Extract context from response
    const { resource, action, required_permission } = await response.json();

    // Immediate redirect
    window.location.href = `/app/access-denied?resource=${resource}&action=${action}`;
  }

  return response;
};
```

### Layer 3: Menu Hiding (USER EXPERIENCE)

**File**: `src/admin/widgets/menu-customizer.tsx`

- ✅ Hides "Customers" menu item if no permission
- ✅ Hides "Customer Groups" menu item if no permission
- ✅ Runs on every page load
- ✅ Observes DOM for dynamic menu changes

**How it works**:

1. Fetches user's permissions on load
2. Finds menu links with `/app/customers` or `/app/customer-groups`
3. Hides parent menu items if user lacks permissions
4. Uses MutationObserver to handle async menu rendering

## 🔄 Complete Request Flow

### Scenario 1: User WITHOUT Permission Tries to Access Customers

```
1. User logs in → Redirected to /app/orders
2. Medusa loads all menu items → Fires API calls
3. GET /admin/customers called
4. Backend middleware checks permission → DENIED
5. Returns 403 with error message
6. API Interceptor catches 403 → Redirects immediately
7. User lands on /app/access-denied page
8. Menu widget hides "Customers" menu item
```

### Scenario 2: User Manually Types URL

```
1. User types: /app/customers
2. Frontend tries to load page → Calls GET /admin/customers
3. Backend middleware checks permission → DENIED
4. Returns 403
5. API Interceptor catches 403 → Redirects
6. User sees access denied page
```

### Scenario 3: User WITH Permission Accesses Customers

```
1. User logs in
2. GET /admin/customers called
3. Backend checks permission → ALLOWED
4. Returns 200 with customer data
5. Page loads normally
6. Menu item remains visible
```

## 📁 Files Created/Modified

### New Files

```
src/admin/lib/api-interceptor.ts
src/admin/lib/menu-config.tsx
src/admin/widgets/menu-customizer.tsx
src/admin/routes/access-denied/page.tsx
```

### Modified Files

```
src/api/middlewares.ts (already existed, updated for customers)
```

## 🧪 Testing

### Test 1: Backend Protection

```bash
# As user without permission:
curl -X GET http://localhost:9000/admin/customers \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# Expected: 403 Forbidden
```

### Test 2: Menu Hiding

```bash
1. Login as user WITHOUT customers permission
2. Check sidebar menu
3. Verify "Customers" and "Customer Groups" are hidden
```

### Test 3: URL Access

```bash
1. Login as user WITHOUT customers permission
2. Manually type: http://localhost:9000/app/customers
3. Verify immediate redirect to /app/access-denied
```

### Test 4: API Interceptor

```bash
1. Login as user WITHOUT customers permission
2. Open browser DevTools → Network tab
3. Navigate to /app/orders (or any page)
4. Look for GET /admin/customers call
5. See 403 response
6. Verify redirect to /app/access-denied
```

## 🔑 Key Features

✅ **Secure by Default**: Backend protection prevents all data access
✅ **Graceful UX**: No error messages, clean redirects
✅ **Menu Cleanup**: Users only see what they can access
✅ **Context-Aware**: Access denied page shows what permission is needed
✅ **Global Coverage**: Intercepts ALL API calls, not just specific routes
✅ **No Route Overrides**: Works with Medusa's default pages

## 🎨 User Experience

### Before (Without Permissions)

- ❌ Saw error: "An unexpected error occurred"
- ❌ Menu items visible but broken
- ❌ Confusing experience

### After (With This Solution)

- ✅ Menu items hidden from sidebar
- ✅ Direct URL access → Clean access denied page
- ✅ Clear message: "You need X permission"
- ✅ Buttons to go back or home

## 🔧 Configuration

### Add/Remove Protected Resources

Edit `src/admin/lib/menu-config.tsx`:

```typescript
export const PROTECTED_MENU_ITEMS = {
  customers: {
    path: "/app/customers",
    requiredPermissions: ["customers-list", "customers-view"],
  },
  "customer-groups": {
    path: "/app/customer-groups",
    requiredPermissions: ["customers-list", "customers-view"],
  },
  // Add more items here
  orders: {
    path: "/app/orders",
    requiredPermissions: ["orders-list", "orders-view"],
  },
} as const;
```

### Customize Access Denied Page

Edit `src/admin/routes/access-denied/page.tsx` to change styling, messaging, or behavior.

## 📊 Permission Matrix

| User Role   | customers-list           | Can See Menu | Can Access Page    |
| ----------- | ------------------------ | ------------ | ------------------ |
| Super Admin | ✅ (has all-all)         | ✅           | ✅                 |
| Admin       | ✅ (explicitly assigned) | ✅           | ✅                 |
| Editor      | ❌                       | ❌           | ❌ → Access Denied |
| Viewer      | ❌                       | ❌           | ❌ → Access Denied |

## 🚀 How to Extend

### Protect Another Page (e.g., Products)

1. **Update backend middleware** (`src/api/middlewares.ts`):

```typescript
{
  method: ["GET", "POST", "PUT", "DELETE"],
  matcher: "/admin/products*",
  middlewares: [checkProductPermission],
}
```

2. **Update menu config** (`src/admin/lib/menu-config.tsx`):

```typescript
products: {
  path: "/app/products",
  requiredPermissions: ["products-list", "products-view"],
}
```

3. **Update menu widget** (`src/admin/widgets/menu-customizer.tsx`):

```typescript
if (href?.includes("/app/products")) {
  if (!hasProductsPermission(permissions)) {
    menuItem.style.display = "none";
  }
}
```

## 🐛 Troubleshooting

### Menu items still visible

- Check browser cache (hard refresh: Cmd+Shift+R)
- Verify permissions are correctly assigned
- Check console for errors

### Access denied page not showing

- Check that API interceptor is loaded (see console log)
- Verify backend is returning 403 (not 401)
- Check Network tab for API responses

### Redirect loop

- Ensure access-denied page itself is not protected
- Check that `/app/access-denied` route exists
- Verify no middleware blocks the access-denied page

## 📝 Summary

This solution provides **complete, secure, and user-friendly** RBAC protection for Customers and Customer Groups pages:

- **Backend**: API-level security (primary defense)
- **Frontend**: Automatic redirects on 403 errors
- **UX**: Hidden menu items for unauthorized users

No custom page overrides, no error messages, just clean access control! 🎉
