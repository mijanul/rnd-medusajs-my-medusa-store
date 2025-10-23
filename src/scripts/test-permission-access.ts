#!/usr/bin/env node

/**
 * Test script to verify permission-based access control
 *
 * Run this script to test:
 * 1. /admin/users/me/permissions endpoint
 * 2. Protected routes (orders, products, etc.)
 * 3. Access denied redirects
 *
 * Usage:
 *   node src/scripts/test-permission-access.ts
 */

import fetch from "node-fetch";

const BASE_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(
  endpoint: string,
  expectedStatus: number,
  description: string,
  cookie?: string
) {
  log(`\n▶ Testing: ${description}`, "cyan");
  log(`  Endpoint: ${endpoint}`, "blue");

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (cookie) {
      headers["Cookie"] = cookie;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
    const status = response.status;
    const data = await response.json();

    if (status === expectedStatus) {
      log(`  ✓ PASS - Status: ${status}`, "green");
    } else {
      log(`  ✗ FAIL - Expected: ${expectedStatus}, Got: ${status}`, "red");
    }

    log(
      `  Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`,
      "yellow"
    );

    return { success: status === expectedStatus, data };
  } catch (error: any) {
    log(`  ✗ ERROR - ${error.message}`, "red");
    return { success: false, error };
  }
}

async function runTests() {
  log("═══════════════════════════════════════════════════", "cyan");
  log("  Permission Access Control Test Suite", "cyan");
  log("═══════════════════════════════════════════════════", "cyan");

  log("\nℹ️  Note: These tests require an authenticated session", "yellow");
  log(
    "   Please run from browser console or provide session cookie\n",
    "yellow"
  );

  // Test 1: Check if me/permissions endpoint exists
  await testEndpoint(
    "/admin/users/me/permissions",
    200,
    "User Permissions Endpoint (requires auth)"
  );

  // Test 2: Check if orders endpoint is protected
  await testEndpoint(
    "/admin/orders",
    401,
    "Orders Endpoint Protection (without auth - expect 401)"
  );

  // Test 3: Check if access denied page is accessible
  await testEndpoint(
    "/app/access-denied?resource=orders&action=view",
    200,
    "Access Denied Page"
  );

  log("\n═══════════════════════════════════════════════════", "cyan");
  log("  Test Suite Complete", "cyan");
  log("═══════════════════════════════════════════════════", "cyan");

  log("\n📝 Manual Testing Instructions:", "blue");
  log("  1. Log in to admin panel", "reset");
  log("  2. Open browser DevTools > Console", "reset");
  log(
    "  3. Run: fetch('/admin/users/me/permissions').then(r => r.json()).then(console.log)",
    "reset"
  );
  log("  4. Create a role without orders permission", "reset");
  log("  5. Assign role to user and try accessing /app/orders", "reset");
  log("  6. Verify redirect to /app/access-denied", "reset");
}

// Browser-compatible version
if (typeof window !== "undefined") {
  log("Running in browser context...", "blue");

  // Export test functions for browser use
  (window as any).testPermissionAccess = async () => {
    log("Testing permission access...", "cyan");

    try {
      // Test me/permissions endpoint
      const response = await fetch("/admin/users/me/permissions", {
        credentials: "include",
      });
      const data = await response.json();

      log(
        `Status: ${response.status}`,
        response.status === 200 ? "green" : "red"
      );
      console.log("Permissions data:", data);

      if (data.permissions_by_resource) {
        log("\nYour permissions by resource:", "cyan");
        Object.entries(data.permissions_by_resource).forEach(
          ([resource, actions]) => {
            log(`  ${resource}: ${(actions as string[]).join(", ")}`, "blue");
          }
        );
      }

      return data;
    } catch (error: any) {
      log(`Error: ${error.message}`, "red");
      return null;
    }
  };

  log("\n✓ Browser test function loaded!", "green");
  log("Run: testPermissionAccess()", "cyan");
}

// Node.js execution
if (require.main === module) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
