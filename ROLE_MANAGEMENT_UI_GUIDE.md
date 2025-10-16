# Role Management UI Guide

## 1. List Page - Quick Status Toggle

```
┌─────────────────────────────────────────────────────────────────┐
│ Role Management                            [+ Create Role]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Name            Slug             Status              Actions    │
│ ─────────────────────────────────────────────────────────────── │
│ Admin           admin            [●] Active          [✏️] [🗑️]   │
│                                                                  │
│ Content Manager content-manager  [○] Inactive        [✏️] [🗑️]   │
│                                                                  │
│ Viewer          viewer           [●] Active          [✏️] [🗑️]   │
└─────────────────────────────────────────────────────────────────┘

Features:
- Toggle switch for quick status changes
- Click switch → Confirmation dialog appears
- Status badge shows current state (green/gray)
- Edit and delete buttons in actions column
```

## 2. Edit Role Page - Role Details

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Edit Role: Admin                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Role Details                                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Name *                              Role Status                 │
│ [Admin             ]                ┌─────────────────────────┐│
│                                     │ Role Status    [Active] ││
│ Slug *                              │ [●]                     ││
│ [admin             ]                │ This role is active and ││
│                                     │ can be assigned to users││
│ Description                         └─────────────────────────┘│
│ [Full system access]                                            │
│                                                                  │
│                              [Cancel]  [Save Role]              │
└─────────────────────────────────────────────────────────────────┘

Features:
- Enhanced status section with badge
- Toggle with confirmation dialog
- Descriptive text explaining current state
- Changes reflected immediately after confirmation
```

## 3. Permissions Section - Table View with Master Checkbox

```
┌─────────────────────────────────────────────────────────────────┐
│ Permissions                          [Save Permissions]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ [☑] Product                                    4 / 5 selected││
│ ├─────────────────────────────────────────────────────────────┤│
│ │     │ Action        │ Description                          │ │
│ │ ────┼───────────────┼────────────────────────────────────  │ │
│ │ [✓] │ create        │ Create new products                  │ │
│ │ [✓] │ read          │ View product details                 │ │
│ │ [✓] │ update        │ Modify existing products             │ │
│ │ [✓] │ delete        │ Remove products                      │ │
│ │ [ ] │ publish       │ Publish products to store            │ │
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ [◐] Order                                      2 / 3 selected││
│ ├─────────────────────────────────────────────────────────────┤│
│ │     │ Action        │ Description                          │ │
│ │ ────┼───────────────┼────────────────────────────────────  │ │
│ │ [✓] │ read          │ View order information               │ │
│ │ [✓] │ update        │ Update order status                  │ │
│ │ [ ] │ cancel        │ Cancel orders                        │ │
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Legend:
- [☑] = All selected (master checkbox checked)
- [◐] = Some selected (indeterminate state)
- [ ] = None selected (master checkbox unchecked)
- [✓] = Individual permission selected

Features:
- Master checkbox beside resource name
- Indeterminate state shown as small square
- Selection counter (X / Y selected)
- Click anywhere on row to toggle
- Hover effect on rows
- Clean table layout
```

## 4. Create Role Page - With Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Create Role                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Role Details                                                    │
│ ─────────────────────────────────────────────────────────────── │
│ Name *                    [Content Manager          ]           │
│ Slug *                    [content-manager          ]           │
│ Description               [Manages content...       ]           │
│ Active                    [●] Enable immediately                │
│                                                                  │
│ Permissions (Optional)                                          │
│ ─────────────────────────────────────────────────────────────── │
│ Select permissions to grant this role                           │
│                                                                  │
│ [Same table view as edit page]                                 │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ 5 permission(s) selected           [Cancel]  [Create Role]     │
└─────────────────────────────────────────────────────────────────┘

Features:
- Full permission selection during creation
- Optional - can create without permissions
- Permission counter at bottom
- Same master checkbox functionality
- Single-step role creation
```

## 5. Interaction Flows

### Flow 1: Toggling Role Status (Edit Page)

```
1. User clicks status switch
   ↓
2. Confirmation dialog appears:
   "Deactivate the role 'Admin'? Users may lose associated permissions."
   ↓
3a. User clicks OK          3b. User clicks Cancel
    ↓                           ↓
4a. API call made           4b. Switch stays in current position
    ↓
5a. Success: Toast + UI update
    OR
5b. Error: Toast + Revert switch
```

### Flow 2: Toggling Role Status (List Page)

```
1. User clicks switch in table row
   ↓
2. Click event stops propagation (doesn't navigate)
   ↓
3. Confirmation dialog appears
   ↓
4. User confirms
   ↓
5. API call made
   ↓
6. Success: Entire list refreshes
   Toast: "Role activated successfully"
```

### Flow 3: Selecting All Permissions for a Resource

```
1. User clicks master checkbox (unchecked state)
   ↓
2. All permissions in that resource get checked
   ↓
3. Master checkbox shows checked state
   ↓
4. Counter updates: "5 / 5 selected"
   ↓
5. User clicks "Save Permissions"
   ↓
6. All existing permissions cleared
   ↓
7. New permissions assigned
   ↓
8. Toast: "Permissions updated successfully"
```

### Flow 4: Indeterminate State

```
1. Resource has 5 permissions, 3 selected
   ↓
2. Master checkbox shows indeterminate (◐)
   ↓
3. Counter shows "3 / 5 selected"
   ↓
4. User clicks master checkbox
   ↓
5. All 5 permissions get selected
   ↓
6. Master checkbox becomes fully checked (☑)
   ↓
7. User clicks master checkbox again
   ↓
8. All permissions get deselected
   ↓
9. Master checkbox becomes unchecked ( )
```

## 6. Keyboard Shortcuts (Accessibility)

- `Tab` - Navigate between form fields and checkboxes
- `Space` - Toggle checkbox/switch when focused
- `Enter` - Submit form or trigger button
- `Esc` - Cancel dialog or close modal
- Click row - Toggle individual permission

## 7. Color Coding

### Status Badges:

- **Green** (`bg-green-100 text-green-800`) - Active role
- **Gray** (`bg-gray-100 text-gray-800`) - Inactive role

### UI States:

- **Primary Blue** - Action buttons, interactive elements
- **Subtle Gray** - Secondary text, descriptions
- **Red** - Delete actions, destructive operations
- **Border Base** - Dividers and containers

## 8. Responsive Design

### Desktop (lg+):

- Two-column layout for role details
- Full table view for permissions
- All features visible

### Tablet (md):

- Single-column layout for role details
- Full table view maintained
- Slightly condensed spacing

### Mobile (sm):

- Stacked layout
- Table becomes scrollable horizontally
- Touch-optimized checkbox sizes
- Simplified action buttons

## 9. Error States

### API Error:

```
┌─────────────────────────────────────────┐
│ ⚠️ Failed to update role                │
│ The server returned an error. Please   │
│ try again or contact support.          │
│                            [Dismiss]    │
└─────────────────────────────────────────┘
```

### Network Error:

```
┌─────────────────────────────────────────┐
│ ⚠️ Failed to update role                │
│ Please check your internet connection. │
│                            [Retry]      │
└─────────────────────────────────────────┘
```

### Validation Error:

```
Name *
[Admin             ]
└─> Name is required (shown in red below field)
```

## 10. Success States

### Toast Notifications:

- ✅ "Role created successfully"
- ✅ "Role updated successfully"
- ✅ "Permissions updated successfully"
- ✅ "Role activated successfully"
- ✅ "Role deactivated successfully"
- ✅ "Role deleted successfully"

---

## Best Practices Applied

1. **Confirmation Before Destructive Actions**

   - Status changes that affect user access
   - Role deletion
   - Clear, specific messages

2. **Visual Feedback**

   - Immediate UI updates on success
   - Loading states during API calls
   - Toast notifications for all actions

3. **Error Recovery**

   - Revert UI if API fails
   - Show specific error messages
   - Provide retry options

4. **Accessibility**

   - Proper labels for screen readers
   - Keyboard navigation support
   - Color contrast compliance
   - Focus management

5. **User Experience**
   - Minimal clicks to complete tasks
   - Clear indication of current state
   - Helpful descriptions and hints
   - Responsive to all device sizes
