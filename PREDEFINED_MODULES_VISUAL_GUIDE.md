# 🎯 Visual Flow: How RBAC Protection Works

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Orders    │  │  Products   │  │  Customers  │             │
│  │    Page     │  │    Page     │  │    Page     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN UI ROUTE OVERRIDES (UI Protection)           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/admin/routes/                                       │   │
│  │    ├── orders/page.tsx    → checks "orders-list"        │   │
│  │    ├── products/page.tsx  → checks "products-list"      │   │
│  │    └── customers/page.tsx → checks "customers-list"     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──► IF NO PERMISSION ─────────► Show RestrictedAccess
         │
         └──► IF HAS PERMISSION ────────► Render Medusa Page
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │    Medusa Default UI Components      │
         │  (Tables, Forms, Buttons, etc.)      │
         └─────────────────────────────────────┘
                       │
                       ▼ (User clicks action)
         ┌─────────────────────────────────────┐
         │     Makes API Call to Backend        │
         └─────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ROUTE MIDDLEWARES (API Protection)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/api/admin/                                          │   │
│  │    ├── orders/route.ts    → requirePermission()         │   │
│  │    ├── products/route.ts  → requirePermission()         │   │
│  │    └── customers/route.ts → requirePermission()         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──► IF NO PERMISSION ─────────► Return 403 Forbidden
         │
         └──► IF HAS PERMISSION ────────► Execute Handler
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │     Medusa Core Services             │
         │  (OrderService, ProductService, etc.)│
         └─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │         Database (PostgreSQL)        │
         │  ┌───────┐ ┌───────┐ ┌───────┐     │
         │  │Orders │ │Product│ │Customer│     │
         │  └───────┘ └───────┘ └───────┘     │
         └─────────────────────────────────────┘
```

## Permission Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER MAKES REQUEST                            │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │  1. Extract User ID from JWT Token   │
         │     (req.auth_context.actor_id)      │
         └─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │  2. Query User's Roles               │
         │     SELECT * FROM user_role          │
         │     WHERE user_id = ?                │
         └─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │  3. Query Role's Permissions         │
         │     SELECT * FROM role_permission    │
         │     WHERE role_id IN (...)           │
         └─────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │  4. Check if Required Permission     │
         │     exists in User's Permissions     │
         └─────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         ▼                             ▼
    ┌──────────┐                ┌──────────┐
    │ ALLOWED  │                │ DENIED   │
    └──────────┘                └──────────┘
         │                             │
         ▼                             ▼
  Execute Handler              Return 403/Show Error
```

## Database Relationship

```
┌─────────────────┐
│      USER       │
│─────────────────│
│ id              │──┐
│ email           │  │
│ password        │  │
└─────────────────┘  │
                     │ 1:N
                     │
                     ▼
          ┌──────────────────┐
          │    USER_ROLE     │
          │──────────────────│
          │ id               │
          │ user_id    (FK)  │
          │ role_id    (FK)  │──┐
          └──────────────────┘  │
                                │
                                │ N:1
                                │
                                ▼
                  ┌─────────────────────┐
                  │       ROLE          │
                  │─────────────────────│
                  │ id                  │──┐
                  │ name                │  │
                  │ slug                │  │
                  │ is_active           │  │
                  └─────────────────────┘  │
                                           │ 1:N
                                           │
                                           ▼
                              ┌──────────────────────┐
                              │  ROLE_PERMISSION     │
                              │──────────────────────│
                              │ id                   │
                              │ role_id        (FK)  │
                              │ permission_id  (FK)  │──┐
                              └──────────────────────┘  │
                                                        │
                                                        │ N:1
                                                        │
                                                        ▼
                                          ┌─────────────────────┐
                                          │    PERMISSION       │
                                          │─────────────────────│
                                          │ id                  │
                                          │ name                │
                                          │ resource            │
                                          │ action              │
                                          │ description         │
                                          └─────────────────────┘
```

## Example: User Accessing Orders Page

### Step-by-Step Flow

```
1. USER CLICKS "ORDERS" IN SIDEBAR
   └─> Browser loads /orders

2. ADMIN ROUTE OVERRIDE LOADS
   File: src/admin/routes/orders/page.tsx

   const { hasPermission, loading } = useUserPermissions();

   └─> Calls useUserPermissions hook

3. HOOK FETCHES USER PERMISSIONS
   API Call: GET /admin/users/{userId}/permissions

   └─> Backend queries database

4. DATABASE QUERIES
   Query 1: Get user's roles
   ┌─────────────────────────────────────────┐
   │ SELECT r.* FROM role r                  │
   │ JOIN user_role ur ON r.id = ur.role_id  │
   │ WHERE ur.user_id = 'usr_123'            │
   └─────────────────────────────────────────┘

   Result: [ { id: 'role_1', slug: 'manager' } ]

   Query 2: Get role's permissions
   ┌─────────────────────────────────────────┐
   │ SELECT p.* FROM permission p            │
   │ JOIN role_permission rp                 │
   │   ON p.id = rp.permission_id            │
   │ WHERE rp.role_id = 'role_1'             │
   └─────────────────────────────────────────┘

   Result: [
     { name: 'orders-list', resource: 'orders', action: 'list' },
     { name: 'orders-view', resource: 'orders', action: 'view' },
     { name: 'orders-create', resource: 'orders', action: 'create' }
   ]

5. PERMISSION CHECK
   hasPermission('orders', 'list')

   ├─> Look for permission where:
   │   - resource = 'orders' (case-insensitive)
   │   - action = 'list' (case-insensitive)
   │
   └─> Found: ✅ TRUE

6. RENDER DECISION
   if (!hasPermission('orders', 'list')) {
     return <RestrictedAccess />  ❌
   }
   return null  ✅ (Let Medusa render default page)

7. MEDUSA DEFAULT PAGE RENDERS
   Shows orders table, filters, actions, etc.

8. USER CLICKS "CREATE ORDER"
   └─> Makes API call: POST /admin/orders

9. API MIDDLEWARE INTERCEPTS
   File: src/api/admin/orders/route.ts

   export const POST = requirePermission('orders-create')(
     async (req, res) => { ... }
   )

10. MIDDLEWARE CHECKS PERMISSION
    - Extract user ID from JWT
    - Query permissions (same as step 4)
    - Check if 'orders-create' exists
    - Found: ✅ Allow
    - Not found: ❌ Return 403

11. IF ALLOWED, EXECUTE HANDLER
    - Create order in database
    - Return success response

12. FRONTEND RECEIVES RESPONSE
    - Show success message
    - Refresh orders list
```

## Permission Naming Convention

```
┌─────────────────────────────────────────────────────┐
│            PERMISSION NAME FORMAT                    │
│                                                      │
│           {resource}-{action}                        │
│                                                      │
│  Examples:                                           │
│    orders-list      → List all orders                │
│    orders-view      → View order details             │
│    orders-create    → Create new order               │
│    orders-update    → Update existing order          │
│    orders-delete    → Delete order                   │
│                                                      │
│    products-list    → List all products              │
│    products-export  → Export products (custom)       │
│                                                      │
│  Database Structure:                                 │
│    name        : "orders-list"                       │
│    resource    : "orders"                            │
│    action      : "list"                              │
│    description : "List all items in Orders"          │
└─────────────────────────────────────────────────────┘
```

## File Structure Overview

```
my-medusa-store/
│
├── src/
│   │
│   ├── admin/                         (Frontend UI)
│   │   ├── components/
│   │   │   └── restricted-access.tsx  ← UI restriction component
│   │   │
│   │   ├── lib/
│   │   │   └── use-permissions.ts     ← Permission hook
│   │   │
│   │   └── routes/                    ← ROUTE OVERRIDES
│   │       ├── orders/
│   │       │   └── page.tsx           ← Protects orders UI
│   │       ├── products/
│   │       │   └── page.tsx           ← Protects products UI
│   │       └── customers/
│   │           └── page.tsx           ← Protects customers UI
│   │
│   ├── api/                           (Backend API)
│   │   └── admin/                     ← API MIDDLEWARES
│   │       ├── orders/
│   │       │   ├── route.ts           ← Protects orders API
│   │       │   ├── [id]/route.ts      ← Protects order detail API
│   │       │   └── EXAMPLES.ts        ← Advanced examples
│   │       ├── products/
│   │       │   ├── route.ts           ← Protects products API
│   │       │   └── [id]/route.ts      ← Protects product detail API
│   │       └── customers/
│   │           ├── route.ts           ← Protects customers API
│   │           └── [id]/route.ts      ← Protects customer detail API
│   │
│   └── modules/
│       └── role-management/           (RBAC Module)
│           ├── middleware.ts          ← Basic middleware functions
│           ├── middleware-advanced.ts ← Advanced middleware
│           └── utils.ts               ← Permission utilities
│
└── Documentation/
    ├── PREDEFINED_MODULES_PROTECTION.md          ← Main guide
    ├── PREDEFINED_MODULES_TEST_GUIDE.md          ← Testing guide
    ├── PREDEFINED_MODULES_IMPLEMENTATION_SUMMARY.md  ← Summary
    └── PREDEFINED_MODULES_VISUAL_GUIDE.md        ← This file
```

## Common Patterns Comparison

### Pattern 1: Page-Level Protection (Recommended)

```
┌──────────────────────────────────┐
│  User accesses /orders           │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│  Check: has permission?          │
│  - YES → Show page               │
│  - NO  → Show "Access Restricted"│
└──────────────────────────────────┘
```

**Pros:** Clear UX, user knows they don't have access  
**Cons:** Permission check on every page load

### Pattern 2: Element-Level Protection

```
┌──────────────────────────────────┐
│  Show page to everyone           │
│                                  │
│  ┌────────┐  ┌────────┐         │
│  │ Button │  │ Button │         │
│  │ (show) │  │ (hide) │         │
│  └────────┘  └────────┘         │
└──────────────────────────────────┘
```

**Pros:** Granular control, better UX for mixed permissions  
**Cons:** Must remember to hide each element

### Pattern 3: Hybrid (Best Practice)

```
┌──────────────────────────────────┐
│  Check basic permission at page  │
│  → Can they access at all?       │
└──────────────────────────────────┘
              │
              ▼ YES
┌──────────────────────────────────┐
│  Show page with conditional UI   │
│  → Hide buttons based on perms   │
└──────────────────────────────────┘
```

**Pros:** Best UX, secure, granular  
**Cons:** More complex implementation

## Security Best Practices

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                              │
│  Layer 1: UI Restriction                                    │
│  ├─ Hide buttons/links                                      │
│  ├─ Show "Access Restricted" messages                       │
│  └─ Improve UX, NOT for security                            │
│                                                              │
│  Layer 2: API Middleware (CRITICAL)                         │
│  ├─ Check permission BEFORE executing logic                 │
│  ├─ Return 403 if unauthorized                              │
│  └─ This is the REAL security layer                         │
│                                                              │
│  Layer 3: Database Constraints                              │
│  ├─ Row-level security (optional)                           │
│  ├─ Foreign key constraints                                 │
│  └─ Additional safety net                                   │
└─────────────────────────────────────────────────────────────┘

❌ WRONG:
   Only protect UI → User can bypass with browser tools

✅ CORRECT:
   Protect UI (UX) + API (Security) + DB (Safety)
```

## Quick Reference: HTTP Status Codes

```
┌──────┬──────────────┬─────────────────────────────────┐
│ Code │ Status       │ When to Use                     │
├──────┼──────────────┼─────────────────────────────────┤
│ 200  │ OK           │ Permission check passed         │
│ 401  │ Unauthorized │ User not logged in (no token)   │
│ 403  │ Forbidden    │ User logged in but no permission│
│ 404  │ Not Found    │ Resource doesn't exist          │
│ 500  │ Server Error │ Permission check failed         │
└──────┴──────────────┴─────────────────────────────────┘
```

## Summary

This visual guide shows:

✅ How UI and API protection work together  
✅ Database relationships for RBAC  
✅ Complete permission check flow  
✅ File structure and organization  
✅ Security layers and best practices

Remember: **Always protect both UI and API!**
