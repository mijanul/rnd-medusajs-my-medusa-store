# Quick Start Guide - New Features

## 🎯 What's New

### 1. Improved Resource Management Create Page

**Before**: Checkbox-based with 5 fixed standard actions
**Now**: Dynamic add/remove permissions interface (same as edit page)

**How to Use**:

1. Go to: `http://localhost:9000/app/rbac-manager/resource-management`
2. Click "Create New Resource"
3. Enter a resource name (e.g., "invoice")
4. Click "Add Permission" to add permissions dynamically
5. For each permission:
   - Enter action name (e.g., "list", "view", "create")
   - Name auto-generates as "resource-action"
   - Add optional description
   - Click trash icon to remove if needed
6. Click "Create Resource" when done

### 2. New User Management Page

**Location**: `http://localhost:9000/app/rbac-manager/user-management`

**Features**:

- View all users in a table
- See assigned roles for each user
- Assign multiple roles to any user
- Manage roles through a modal dialog

**How to Assign Roles**:

1. Go to RBAC Manager → User Management
2. Find the user in the table
3. Click the "..." menu → "Manage Roles"
4. Check/uncheck roles in the modal
5. Click "Save Changes"
6. Roles appear as badges in the user table

### 3. Multiple Roles Per User

**Now Supported**:

- ✅ Users can have multiple roles simultaneously
- ✅ API properly handles adding/removing roles
- ✅ UI shows all roles as colored badges
- ✅ No more 500 errors when assigning roles

## 🚀 Quick Access

### Navigation:

```
Admin Panel → RBAC Manager
├── Role Management       (manage roles and permissions)
├── Resource Management   (manage permission resources)
└── User Management       (NEW - assign roles to users)
```

### URLs:

- RBAC Manager: `http://localhost:9000/app/rbac-manager`
- User Management: `http://localhost:9000/app/rbac-manager/user-management`
- Resource Management: `http://localhost:9000/app/rbac-manager/resource-management`
- Role Management: `http://localhost:9000/app/rbac-manager/role-management`

## 📝 Common Tasks

### Assign Multiple Roles to a User

1. RBAC Manager → User Management
2. Click menu (•••) next to user
3. Click "Manage Roles"
4. Select multiple roles with checkboxes
5. Save Changes

### Create a Custom Resource

1. RBAC Manager → Resource Management
2. Create New Resource
3. Enter resource name (e.g., "report")
4. Click "Add Permission" for each action
5. Enter actions: "list", "view", "export", "download"
6. Add descriptions (optional)
7. Create Resource

### Remove a Role from a User

1. RBAC Manager → User Management
2. Click menu → "Manage Roles"
3. Uncheck the role you want to remove
4. Save Changes

## 🔍 Testing Tips

### Test Multiple Role Assignment:

1. Go to User Management
2. Pick a test user
3. Assign 3-4 different roles
4. Refresh the page
5. Verify all roles show as badges
6. Edit roles again - checkboxes should show current selection

### Test Resource Creation:

1. Create a resource with 5 permissions
2. Try to add duplicate action → should show error
3. Remove a permission → should disappear
4. Change resource name → permission names should update
5. Create successfully

### Test API Directly:

```bash
# Get user's current roles
curl -X GET http://localhost:9000/admin/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Assign multiple roles
curl -X POST http://localhost:9000/admin/users/USER_ID/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "role_ids": [
      "role_id_1",
      "role_id_2",
      "role_id_3"
    ]
  }'
```

## ⚠️ Important Notes

1. **Settings Users Page**:

   - The default Medusa users page at `/app/settings/users` still exists
   - Use the new `/app/rbac-manager/user-management` for role management
   - The new page has better features for RBAC

2. **Multiple Roles**:

   - Users can now have unlimited roles
   - Each role's permissions combine (additive)
   - If two roles have conflicting permissions, most permissive wins

3. **Resource Management**:
   - Create and Edit pages now have identical UI
   - No limit on number of permissions per resource
   - Permission names auto-generate in format: `resource-action`

## 🐛 Troubleshooting

### "500 Error when assigning roles"

- ✅ **FIXED** - The API now properly handles multiple roles

### "Can't see users in User Management"

- Ensure you have users created in your Medusa store
- Check API endpoint: `GET /admin/users`
- Click "Refresh" button in User Management

### "Roles not updating"

- Click "Refresh" after making changes
- Check browser console for errors
- Verify role IDs are correct

### "Permission names not auto-generating"

- Ensure resource name is filled in first
- Type an action name - name updates automatically
- Format will be: `{resource}-{action}`

## 📚 Documentation

For more details, see:

- `RBAC_USER_MANAGEMENT_UPDATE.md` - Technical implementation details
- `ADMIN_UI_GUIDE.md` - General admin UI documentation
- `ROLE_MANAGEMENT_GUIDE.md` - Complete RBAC system guide

## ✅ Summary

All requested features are now implemented and working:

1. ✅ Resource create page matches edit page UI
2. ✅ User Management page under RBAC Manager
3. ✅ Multiple roles per user fully supported
4. ✅ No more 500 errors on role assignment

Start testing by visiting:
**http://localhost:9000/app/rbac-manager/user-management**
