#!/usr/bin/env node

/**
 * Verify Customer RBAC Setup
 *
 * This script checks that all required files exist and are properly configured
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Customer RBAC Setup...\n");

const requiredFiles = [
  {
    path: "src/api/middlewares.ts",
    description: "Backend middleware (API protection)",
    checkFor: ["checkCustomerPermission", "checkCustomerGroupPermission"],
  },
  {
    path: "src/admin/lib/api-interceptor.ts",
    description: "Global API interceptor (403 redirect)",
    checkFor: ["window.fetch", "response.status === 403"],
  },
  {
    path: "src/admin/lib/menu-config.tsx",
    description: "Menu configuration (permission checking)",
    checkFor: ["PROTECTED_MENU_ITEMS", "useUserPermissions"],
  },
  {
    path: "src/admin/widgets/menu-customizer.tsx",
    description: "Menu widget (hide items)",
    checkFor: ["defineWidgetConfig", "MenuCustomizer"],
  },
  {
    path: "src/admin/routes/access-denied/page.tsx",
    description: "Access denied page",
    checkFor: ["Access Denied", "searchParams"],
  },
];

let allGood = true;

for (const file of requiredFiles) {
  const fullPath = path.join(process.cwd(), file.path);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing: ${file.path}`);
    console.log(`   ${file.description}\n`);
    allGood = false;
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const missingParts = [];

  for (const check of file.checkFor) {
    if (!content.includes(check)) {
      missingParts.push(check);
    }
  }

  if (missingParts.length > 0) {
    console.log(`⚠️  Incomplete: ${file.path}`);
    console.log(`   Missing: ${missingParts.join(", ")}\n`);
    allGood = false;
  } else {
    console.log(`✅ ${file.path}`);
    console.log(`   ${file.description}\n`);
  }
}

console.log("=".repeat(70));

if (allGood) {
  console.log("✅ All files present and configured!\n");
  console.log("📖 Next Steps:");
  console.log("   1. Restart your Medusa server: yarn dev");
  console.log(
    "   2. Hard refresh admin UI: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
  );
  console.log("   3. Login as user WITHOUT customers permission");
  console.log("   4. Verify:");
  console.log('      - "Customers" menu item is hidden');
  console.log("      - Direct URL access redirects to access-denied page");
  console.log("\n📚 Documentation: CUSTOMER_RBAC_COMPLETE.md");
} else {
  console.log("❌ Setup incomplete. Please check missing files.\n");
  process.exit(1);
}
