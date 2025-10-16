# Role Management Admin UI - Documentation

## Overview

Complete admin panel UI for managing roles, permissions, and user role assignments in your Medusa store.

## Pages Created

### 1. Roles List Page (`/roles`)

**Location**: `src/admin/routes/roles/page.tsx`

Features:

- View all roles in a table format
- See role status (Active/Inactive)
- Quick actions: Edit, Delete
- Create new role button
- Empty state with call-to-action

### 2. Role Detail/Edit Page (`/roles/:id`)

**Location**: `src/admin/routes/roles/[id]/page.tsx`

Features:

- Edit role details (name, slug, description, status)
- Assign/remove permissions with checkboxes
- Permissions grouped by resource
- Real-time permission selection
- Save role and permissions separately

### 3. Create Role Page (`/roles/create`)

**Location**: `src/admin/routes/roles/create/page.tsx`

Features:

- Create new roles
- Auto-generate slug from name
- Set initial status (active/inactive)
- Quick tips and next steps
- Form validation

### 4. Permissions List Page (`/permissions`)

**Location**: `src/admin/routes/permissions/page.tsx`

Features:

- View all permissions grouped by resource
- Filter permissions by name, resource, or action
- Quick create form at the top
- Permissions organized in collapsible groups
- Resource-based grouping with counts

### 5. User Roles Widget

**Location**: `src/admin/widgets/user-roles-widget.tsx`

Features:

- Shows on user detail page
- View assigned roles as badges
- Edit mode with checkboxes
- Assign/remove roles from users
- Real-time updates

### 6. Role Management Dashboard Widget

**Location**: `src/admin/widgets/role-management-dashboard.tsx`

Features:

- Shows role statistics
- Quick navigation to roles and permissions
- Active role count
- Total permission count
- Links to team management

## Navigation Structure

```
Admin Panel
├── Roles (/roles)
│   ├── List all roles
│   ├── Create new role (/roles/create)
│   └── Edit role (/roles/:id)
├── Permissions (/permissions)
│   └── List all permissions with quick create
└── Users (existing)
    └── User Detail
        └── Roles Widget (shows assigned roles)
```

## How to Use

### Managing Roles

#### Create a New Role

1. Navigate to **Roles** in the admin panel
2. Click **"Create Role"** button
3. Fill in:
   - **Name**: Display name (e.g., "Content Manager")
   - **Slug**: URL-friendly ID (auto-generated from name)
   - **Description**: Optional description
   - **Active**: Toggle to enable/disable
4. Click **"Create Role"**
5. After creation, assign permissions on the role detail page

#### Edit a Role

1. Go to **Roles**
2. Click on a role or click the edit icon
3. Update role details
4. Click **"Save Role"**

#### Assign Permissions to Role

1. Open the role detail page
2. Scroll to **Permissions** section
3. Check/uncheck permissions by resource
4. Click **"Save Permissions"**

#### Delete a Role

1. Go to **Roles**
2. Click the trash icon next to the role
3. Confirm deletion

### Managing Permissions

#### View All Permissions

1. Navigate to **Permissions**
2. View permissions grouped by resource
3. Use search to filter permissions

#### Create a Permission

1. Go to **Permissions**
2. Click **"Create Permission"**
3. Fill in the inline form:
   - **Resource**: Entity type (e.g., "product", "order")
   - **Action**: Operation (e.g., "view", "edit", "delete")
   - **Description**: Optional description
4. Click **"Create"**

The permission name will be automatically generated as `{resource}-{action}`.

### Managing User Roles

#### Assign Roles to a User

1. Go to **Settings → Team** (or Users)
2. Click on a user
3. Scroll to the **Roles** widget
4. Click **"Edit Roles"**
5. Check the roles to assign
6. Click **"Save"**

#### Remove Roles from a User

1. Follow steps 1-4 above
2. Uncheck the roles to remove
3. Click **"Save"**

## UI Components Used

All pages use Medusa UI components:

- `Container` - Page containers
- `Heading` - Page titles
- `Button` - Actions and navigation
- `Input` - Text inputs
- `Textarea` - Multi-line text
- `Label` - Form labels
- `Switch` - Toggle controls
- `Checkbox` - Multiple selections
- `Table` - Data tables
- `Badge` - Status indicators
- `toast` - Notifications

## Screenshots Guide

### Roles List Page

- Table showing all roles
- Active/Inactive badges
- Edit and Delete actions
- Create role button in header

### Role Detail Page

**Top Section**: Role details form

- Name, slug, description fields
- Active/Inactive switch
- Save and Cancel buttons

**Bottom Section**: Permissions

- Grouped by resource (all, page, product, order, user, role)
- Checkboxes for each permission
- Action buttons (view, add, edit, delete, all)
- Save Permissions button

### Create Role Page

**Left Column**:

- Name input
- Slug input (auto-generated)
- Description textarea

**Right Column**:

- Active toggle
- Quick tips box
- Next steps info

### Permissions Page

**Header**:

- Create permission inline form
- Resource, Action, Description inputs

**Body**:

- Filter input
- Permissions grouped by resource
- Tables with name, action, description

### User Detail - Roles Widget

**View Mode**:

- Role badges
- Edit button

**Edit Mode**:

- Checkboxes for each role
- Role name and description
- Save and Cancel buttons

## Default Data

After running migrations, you'll have:

- **4 Roles**: super-admin, admin, editor, viewer
- **24 Permissions**: Covering all, page, product, order, user, role resource-management
- **14 Role-Permission mappings**: Pre-configured for each role

## API Endpoints Used

All pages interact with these endpoints:

```
GET    /admin/roles                    - Roles list page
POST   /admin/roles                    - Create role page
GET    /admin/roles/:id                - Role detail page
PUT    /admin/roles/:id                - Role detail page
DELETE /admin/roles/:id                - Roles list page

GET    /admin/permissions              - Permissions page
POST   /admin/permissions              - Permissions page

POST   /admin/roles/:id/permissions    - Role detail page
DELETE /admin/roles/:id/permissions    - Role detail page

GET    /admin/users/:id/roles          - User roles widget
POST   /admin/users/:id/roles          - User roles widget
DELETE /admin/users/:id/roles          - User roles widget
```

## Styling

All pages follow Medusa UI design system:

- Consistent spacing and typography
- Responsive grid layouts
- Hover states and transitions
- Loading states
- Error handling with toasts
- Empty states with call-to-action

## Features Implemented

✅ Full CRUD for roles
✅ Permission assignment UI
✅ User role assignment widget
✅ Dashboard statistics widget
✅ Responsive design
✅ Loading states
✅ Error handling
✅ Toast notifications
✅ Form validation
✅ Empty states
✅ Search/filter functionality
✅ Grouped permission display
✅ Auto-slug generation
✅ Confirmation dialogs

## Customization

### Adding New Permission Resource Management

1. Create permissions via the Permissions page
2. They will automatically appear in the role detail page grouped by resource

### Changing Widget Placement

Edit the `zone` property in widget configs:

- User roles widget: `user.details.after`
- Dashboard widget: `order.list.after` (can be changed)

### Styling Modifications

All components use Medusa UI classes. Modify className props to customize styling.

## Best Practices

1. **Always assign at least one role to users** - Use the user roles widget
2. **Use descriptive role names** - Make it clear what the role does
3. **Group related permissions** - Assign permissions that make sense together
4. **Test permission changes** - Verify access after modifying roles
5. **Keep roles active** - Only deactivate roles that are no longer needed

## Troubleshooting

### Roles not showing

- Check if the API endpoint `/admin/roles` returns data
- Verify migrations were run successfully
- Check browser console for errors

### Can't assign permissions

- Ensure the role exists
- Check if permissions are loaded
- Verify API endpoint `/admin/roles/:id/permissions` is accessible

### User roles widget not appearing

- Check if the widget zone is correct
- Verify user ID is being passed
- Check admin panel configuration

## Next Steps

1. ✅ Create admin UI pages (DONE)
2. Implement permission checks in routes
3. Add middleware to protect sensitive endpoints
4. Create role templates
5. Add audit logging
6. Build analytics dashboard

## File Structure

```
src/admin/
├── routes/
│   ├── roles/
│   │   ├── page.tsx                    # List roles
│   │   ├── create/
│   │   │   └── page.tsx                # Create role
│   │   └── [id]/
│   │       └── page.tsx                # Edit role + assign permissions
│   └── permissions/
│       └── page.tsx                    # List & create permissions
└── widgets/
    ├── user-roles-widget.tsx           # Assign roles to users
    └── role-management-dashboard.tsx   # Dashboard stats
```

---

**Status**: ✅ All admin UI pages complete and ready to use!

Access the role management UI at:

- http://localhost:9000/app/roles
- http://localhost:9000/app/permissions
