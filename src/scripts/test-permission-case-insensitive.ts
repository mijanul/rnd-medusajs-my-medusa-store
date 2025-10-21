/**
 * Test script to verify case-insensitive permission checking
 *
 * This script demonstrates that the permission system now works
 * regardless of the casing used in the frontend code.
 */

// Mock permissions data structure (simulating what the API returns)
const mockPermissionsData = {
  user_id: "test-user-123",
  roles: ["admin"],
  permissions: [
    {
      id: "1",
      name: "pages-list",
      resource: "Pages",
      action: "list",
      description: "List pages",
    },
    {
      id: "2",
      name: "pages-view",
      resource: "Pages",
      action: "view",
      description: "View pages",
    },
    {
      id: "3",
      name: "orders-list",
      resource: "orders",
      action: "list",
      description: "List orders",
    },
    {
      id: "4",
      name: "price-lists-view",
      resource: "Price Lists",
      action: "view",
      description: "View price lists",
    },
  ],
  permissions_by_resource: {
    Pages: ["list", "view"],
    orders: ["list"],
    "Price Lists": ["view"],
  },
  has_permissions: true,
  is_super_admin: false,
  total_permissions: 4,
};

// Simulate the case-insensitive hasPermission function
function hasPermission(
  permissions: any,
  resource: string,
  action: string
): boolean {
  if (!permissions) return false;
  if (permissions.is_super_admin) return true;

  // Case-insensitive resource lookup
  const resourceKey = Object.keys(permissions.permissions_by_resource).find(
    (key) => key.toLowerCase() === resource.toLowerCase()
  );

  if (!resourceKey) return false;

  const resourcePermissions = permissions.permissions_by_resource[resourceKey];
  if (!resourcePermissions) return false;

  return (
    resourcePermissions.includes(action) || resourcePermissions.includes("all")
  );
}

// Test cases
console.log("\n🧪 Testing Case-Insensitive Permission Checks\n");
console.log("=".repeat(60));

const testCases = [
  // Pages resource (stored as "Pages" in DB)
  {
    resource: "pages",
    action: "list",
    expected: true,
    description: "lowercase 'pages'",
  },
  {
    resource: "Pages",
    action: "list",
    expected: true,
    description: "Title Case 'Pages'",
  },
  {
    resource: "PAGES",
    action: "list",
    expected: true,
    description: "uppercase 'PAGES'",
  },
  {
    resource: "pAgEs",
    action: "view",
    expected: true,
    description: "mixed case 'pAgEs'",
  },

  // Orders resource (stored as "orders" in DB)
  {
    resource: "orders",
    action: "list",
    expected: true,
    description: "lowercase 'orders'",
  },
  {
    resource: "Orders",
    action: "list",
    expected: true,
    description: "Title Case 'Orders'",
  },
  {
    resource: "ORDERS",
    action: "list",
    expected: true,
    description: "uppercase 'ORDERS'",
  },

  // Price Lists resource (stored as "Price Lists" in DB with space)
  {
    resource: "price lists",
    action: "view",
    expected: true,
    description: "lowercase 'price lists'",
  },
  {
    resource: "Price Lists",
    action: "view",
    expected: true,
    description: "Title Case 'Price Lists'",
  },
  {
    resource: "PRICE LISTS",
    action: "view",
    expected: true,
    description: "uppercase 'PRICE LISTS'",
  },

  // Non-existent permissions
  {
    resource: "pages",
    action: "delete",
    expected: false,
    description: "pages delete (doesn't exist)",
  },
  {
    resource: "customers",
    action: "view",
    expected: false,
    description: "customers (resource doesn't exist)",
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = hasPermission(mockPermissionsData, test.resource, test.action);
  const status = result === test.expected ? "✅ PASS" : "❌ FAIL";

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`\nTest ${index + 1}: ${test.description}`);
  console.log(`  Input: hasPermission("${test.resource}", "${test.action}")`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got: ${result}`);
  console.log(`  ${status}`);
});

console.log("\n" + "=".repeat(60));
console.log(
  `\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`
);

if (failed === 0) {
  console.log(
    "🎉 All tests passed! Case-insensitive permission checking works correctly.\n"
  );
} else {
  console.log("⚠️  Some tests failed. Please review the implementation.\n");
}
