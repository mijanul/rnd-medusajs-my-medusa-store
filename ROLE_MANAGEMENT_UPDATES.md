# Role Management UI Updates

## Summary of Changes

This document outlines the updates made to the Role Management system based on the requirements:

### 1. ✅ Role List Page - Status Switch Functionality

**File:** `src/admin/routes/rbac-manager/role-management/page.tsx`

**Changes:**

- Fixed the status switch to properly trigger the `handleToggleStatus` function when toggled
- The switch now correctly updates the role's active/inactive status
- Users can click the switch to activate or deactivate roles directly from the list view
- Confirmation dialog is shown before changing status

**Behavior:**

- Active roles show a green "Active" badge
- Inactive roles show a grey "Inactive" badge
- Switch toggles the status with confirmation

---

### 2. ✅ Remove Status Change Option from Edit/Create Pages

**Files:**

- `src/admin/routes/rbac-manager/role-management/[id]/page.tsx` (Edit Page)
- `src/admin/routes/rbac-manager/role-management/create/page.tsx` (Create Page)

**Changes:**

- Removed the role status switch/toggle from both edit and create role pages
- Removed the associated `handleToggleActive` function from the edit page
- Cleaned up unused imports (Switch component)
- Status can now ONLY be changed from the role list page

**Rationale:**

- Centralized status management to the list view
- Prevents accidental status changes while editing role details
- Clearer separation of concerns: edit page for role details, list page for status management

---

### 3. ✅ New Permission List View Structure

**Files:**

- `src/admin/routes/rbac-manager/role-management/[id]/page.tsx` (Edit Page)
- `src/admin/routes/rbac-manager/role-management/create/page.tsx` (Create Page)

**Changes:**

- Completely redesigned the permission table structure
- New table layout with action-based columns:

| Name                                               | List | View | Create | Edit | Delete |
| -------------------------------------------------- | ---- | ---- | ------ | ---- | ------ |
| Resource Name                                      | ☐    | ☐    | ☐      | ☐    | ☐      |
| Description row below with all action descriptions |

**Features:**

- **Header Row:** Contains column headers (Name, List, View, Create, Edit, Delete)
- **Content Row:**
  - First column shows the resource name (e.g., "Products", "Orders")
  - Subsequent columns show checkboxes for each available action
  - Actions not available for a resource show "-"
- **Description Row:** Below each resource, displays all action descriptions separated by "|"

**Example:**

```
Name         | List | View | Create | Edit | Delete
------------ | ---- | ---- | ------ | ---- | ------
Products     | ☑    | ☑    | ☐      | ☑    | ☐
List: View all products | View: See product details | Create: Add new products | Edit: Modify products | Delete: Remove products
```

---

### 4. ⚠️ Partial Selection State (Indeterminate State)

**Note:** The requirement mentions showing a "-" symbol with light color for partial selection. This typically applies to parent checkboxes when some (but not all) child items are selected.

**Current Implementation:**

- Individual permission checkboxes are shown for each action (List, View, Create, Edit, Delete)
- Each checkbox can be checked or unchecked independently
- No parent/master checkbox is currently implemented in the new layout

**Recommendation for Future Enhancement:**
If you want to add a master checkbox per resource with indeterminate state:

1. Add a checkbox in the "Name" column header or at the start of each row
2. When some (not all) actions are selected, show the indeterminate state
3. Implement using CSS for the indeterminate visual state:

```tsx
// Example indeterminate checkbox styling
<div className="relative">
  <Checkbox checked={allSelected} onCheckedChange={() => handleToggleAll()} />
  {isIndeterminate && (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-0.5 w-2.5 rounded-sm bg-ui-fg-muted opacity-60" />
    </div>
  )}
</div>
```

---

## Testing Checklist

- [ ] Navigate to Role Management list page
- [ ] Toggle status switch - verify it changes role status with confirmation
- [ ] Click edit on a role - verify no status switch is present
- [ ] Create a new role - verify no status switch is present
- [ ] View permissions table - verify new layout with action columns
- [ ] Check permissions - verify checkboxes work correctly
- [ ] Save permissions - verify they are saved properly

---

## Files Modified

1. `/src/admin/routes/rbac-manager/role-management/page.tsx`
2. `/src/admin/routes/rbac-manager/role-management/[id]/page.tsx`
3. `/src/admin/routes/rbac-manager/role-management/create/page.tsx`

---

## Additional Notes

### Benefits of New Structure:

1. **Clearer Overview:** Users can see at a glance which actions are available for each resource
2. **Easier Selection:** Column-based checkboxes make it easier to grant similar permissions across resources
3. **Better UX:** Description row keeps context visible without cluttering the main table
4. **Responsive Layout:** Clean table structure that's easier to scan

### Migration Notes:

- No database changes required
- All existing permissions and roles remain intact
- Only the UI presentation has changed
- Backend API calls remain the same
