#!/usr/bin/env node

/**
 * Quick Test for Customer RBAC Bug Fixes
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Customer RBAC Bug Fixes...\n");

// Check that route override was deleted
const routeOverridePath = "src/admin/routes/customers/page.tsx";
const fullPath = path.join(process.cwd(), routeOverridePath);

if (fs.existsSync(fullPath)) {
  console.log("❌ ISSUE: Route override still exists!");
  console.log(`   ${routeOverridePath} should be deleted`);
  console.log("   This file causes unnecessary API calls\n");
  process.exit(1);
} else {
  console.log("✅ Route override deleted");
  console.log("   No more unnecessary API calls from route component\n");
}

// Check that interceptor has smart redirect logic
const interceptorPath = "src/admin/lib/api-interceptor.ts";
const interceptorFile = path.join(process.cwd(), interceptorPath);

if (!fs.existsSync(interceptorFile)) {
  console.log("❌ ISSUE: Interceptor file missing!");
  process.exit(1);
}

const interceptorContent = fs.readFileSync(interceptorFile, "utf-8");

const requiredFeatures = [
  { name: "Navigation tracking", code: "lastPath" },
  { name: "Protected routes list", code: "PROTECTED_ROUTES" },
  { name: "Smart redirect logic", code: "isMatchingRoute" },
  { name: "Background call detection", code: "ignoring" },
  { name: "Console logging", code: "console.log" },
];

let allFeaturesPresent = true;

for (const feature of requiredFeatures) {
  if (interceptorContent.includes(feature.code)) {
    console.log(`✅ ${feature.name}`);
  } else {
    console.log(`❌ Missing: ${feature.name}`);
    allFeaturesPresent = false;
  }
}

console.log("\n" + "=".repeat(70));

if (allFeaturesPresent) {
  console.log("✅ All bug fixes are in place!\n");
  console.log("📖 Next Steps:");
  console.log("   1. Restart server: yarn dev");
  console.log(
    "   2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
  );
  console.log("   3. Login as user WITHOUT customers-list permission");
  console.log("   4. Navigate to /app/orders");
  console.log("   5. Open Console → Should see:");
  console.log('      "🔒 403 blocked for customers... - ignoring"');
  console.log("   6. Type /app/customers in URL");
  console.log("   7. Should redirect to /app/access-denied");
  console.log("\n📚 Documentation: CUSTOMER_RBAC_BUG_FIXES.md");
} else {
  console.log("❌ Some fixes are missing. Please check the files.\n");
  process.exit(1);
}
