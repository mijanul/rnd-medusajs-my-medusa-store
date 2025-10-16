# Resource Management Quick Reference

## 🎯 Overview

A comprehensive permission management system with standard CRUD actions and custom permissions support.

## 📋 Standard Actions (Auto-provided)

| Action   | Description         | Use Case                        |
| -------- | ------------------- | ------------------------------- |
| `list`   | View list of items  | List all products, orders, etc. |
| `view`   | View item details   | View single product details     |
| `create` | Create new items    | Add new product, order, etc.    |
| `edit`   | Edit existing items | Update product information      |
| `delete` | Delete items        | Remove products, orders, etc.   |

## 🔑 Key Features

### ✅ Validation Rules

- Resource name: alphanumeric, hyphens, underscores only
- Unique resource names across system
- At least one action required
- No duplicate actions per resource
- Auto-generated permission names: `resource:action`

### 🎨 User Experience

- All standard actions enabled by default
- Checkbox interface for easy selection
- Add unlimited custom actions
- Real-time validation feedback
- Smart diff-based updates

### 🛡️ Security & Integrity

- Cascading deletes (auto-removes role assignments)
- Atomic operations (all-or-nothing)
- Input sanitization
- SQL injection prevention
- Audit trail (timestamps)

## 📝 Permission Name Format

```
resource:action

Examples:
- product:list
- product:create
- blog:publish
- order:refund
```

## 🚀 Quick Start

### Create a New Resource

1. Navigate to **RBAC Manager → Resource Management**
2. Click **"Create Resource"**
3. Enter resource name (e.g., "product", "blog")
4. Check/uncheck standard actions
5. Add custom actions if needed
6. Click **"Create Resource"**

### Common Resource Examples

#### E-Commerce Product

```
Resource: product
Actions: ✅ list, ✅ view, ✅ create, ✅ edit, ✅ delete
Custom: import, export
```

#### Blog System

```
Resource: blog
Actions: ✅ list, ✅ view, ✅ create, ✅ edit, ⬜ delete
Custom: publish, unpublish, schedule
```

#### Order Management

```
Resource: order
Actions: ✅ list, ✅ view, ⬜ create, ✅ edit, ⬜ delete
Custom: refund, cancel, ship
```

#### User Management

```
Resource: user
Actions: ✅ list, ✅ view, ✅ create, ✅ edit, ✅ delete
Custom: suspend, activate, reset-password
```

## 🎭 Usage in Code

### Check Permission in Middleware

```typescript
// Check if user has specific permission
if (req.user.hasPermission("product:create")) {
  // Allow access
}

// Check resource-level access
if (req.user.hasPermission("product")) {
  // Allow any product action
}
```

### API Example

```typescript
// Create resource
POST /admin/permission-resource-management
{
  "resource": "blog",
  "actions": [
    { "action": "list", "description": "View blog list" },
    { "action": "create", "description": "Create posts" },
    { "action": "publish", "description": "Publish posts" }
  ]
}

// Update resource (add/remove actions)
PUT /admin/permission-resource-management/blog
{
  "actions": [
    { "action": "list", "description": "View blog list" },
    { "action": "view", "description": "View post details" },
    { "action": "publish", "description": "Publish posts" }
  ]
}
```

## 🔗 Integration Flow

```
1. Create Resource
   ↓
2. Create Permissions (auto)
   ↓
3. Assign to Roles
   ↓
4. Assign Roles to Users
   ↓
5. Check Permissions in Routes
```

## ⚠️ Important Notes

### DO ✅

- Use lowercase resource names
- Use singular form (product, not products)
- Keep action names short and clear
- Provide meaningful descriptions
- Use standard actions when possible
- Add custom actions for specific needs

### DON'T ❌

- Use spaces or special characters in resource names
- Create duplicate actions
- Delete resources with active role assignments (system will cascade delete)
- Hardcode permission checks without resource management
- Skip validation on custom actions

## 🔧 Troubleshooting

### "Resource already exists"

- Check if resource name is already in use
- Try a different, more specific name
- Example: Instead of "item", use "product-item"

### "Duplicate actions not allowed"

- Remove duplicate action names
- Action names are case-insensitive
- "Create" and "create" are considered the same

### "Invalid resource name format"

- Use only letters, numbers, hyphens, and underscores
- Remove spaces and special characters
- Example: "blog post" → "blog-post"

### "At least one action required"

- Enable at least one standard action, OR
- Add at least one custom action

## 📊 Database Schema Reference

```sql
permission {
  id: uuid PRIMARY KEY
  name: varchar UNIQUE  -- Format: "resource:action"
  resource: varchar     -- Resource name
  action: varchar       -- Action name
  description: text
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp
}

role_permission {
  id: uuid PRIMARY KEY
  role_id: uuid FOREIGN KEY
  permission_id: uuid FOREIGN KEY
  created_at: timestamp
}
```

## 🎓 Best Practices

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Granular Permissions**: Separate read and write operations (list + view vs create + edit + delete)
3. **Logical Grouping**: Group related actions under same resource
4. **Clear Naming**: Use intuitive, consistent action names
5. **Documentation**: Add clear descriptions for custom actions
6. **Regular Audits**: Review and clean up unused permissions
7. **Testing**: Test permission checks in all routes
8. **Role Templates**: Create role templates for common use cases

## 📚 Related Documentation

- [Complete System Guide](./RESOURCE_MANAGEMENT_GUIDE.md)
- [RBAC Manager Update](./RBAC_MANAGER_UPDATE.md)
- [Permission System](./PERMISSION_SYSTEM_UPDATE.md)
- [Role Management](./ROLE_MANAGEMENT_GUIDE.md)

## 💡 Tips

- **Start with standards**: Enable all 5 standard actions, then remove what's not needed
- **Custom actions**: Only add custom actions for business-specific operations
- **Naming convention**: Use verb-based names (publish, archive, export, import)
- **Descriptions**: Write clear descriptions for administrators who assign permissions
- **Test first**: Create test resources to experiment before production use

---

**Need Help?** Check the [Full Implementation Guide](./RESOURCE_MANAGEMENT_GUIDE.md) for detailed information.
