/**
 * Debug Script for Menu Hiding Issue
 *
 * This will help you see:
 * 1. What permissions the user has
 * 2. Whether hasCustomersPermission returns true/false
 * 3. Why menu items are being hidden
 */

// Add this to your browser console when logged in:

console.log("=== RBAC Debug Info ===");

// 1. Fetch user info
fetch("/admin/users/me", { credentials: "include" })
  .then((res) => res.json())
  .then((data) => {
    console.log("📋 Current User:", data.user);
    const userId = data.user?.id;

    // 2. Fetch roles and permissions
    return fetch(`/admin/users/${userId}/roles`, { credentials: "include" });
  })
  .then((res) => res.json())
  .then((rolesData) => {
    console.log("👥 User Roles:", rolesData.roles);

    // 3. Extract all permissions
    const permissions = [];
    for (const role of rolesData.roles || []) {
      if (role.name === "super-admin") {
        permissions.push("all-all");
      }
      if (role.permissions) {
        for (const perm of role.permissions) {
          if (perm.name) {
            permissions.push(perm.name);
          }
        }
      }
    }

    console.log("🔑 All Permissions:", permissions);

    // 4. Check customer permissions
    const customerPermissions = [
      "customers-list",
      "customers-view",
      "customers-create",
      "customers-update",
      "customers-delete",
      "customers-all",
    ];

    const hasAny = customerPermissions.some((perm) =>
      permissions.includes(perm)
    );
    const hasSuperAdmin = permissions.includes("all-all");

    console.log("✅ Has Super Admin:", hasSuperAdmin);
    console.log("✅ Has Customer Permission:", hasAny);
    console.log("📊 Should Show Customers Menu:", hasSuperAdmin || hasAny);

    // 5. Find the menu item
    const menuLinks = document.querySelectorAll(
      'nav a[href*="/app/customers"]'
    );
    console.log("🔍 Found Menu Links:", menuLinks.length);
    menuLinks.forEach((link, index) => {
      const href = link.getAttribute("href");
      const menuItem = link.closest("li") || link.parentElement;
      const isHidden = menuItem
        ? window.getComputedStyle(menuItem).display === "none"
        : false;
      console.log(`   Link ${index + 1}: ${href} - Hidden: ${isHidden}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error:", err);
  });
