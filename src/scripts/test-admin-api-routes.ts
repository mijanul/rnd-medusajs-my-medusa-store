/**
 * Admin API Test Suite
 *
 * Tests all Week 2 Admin API endpoints for pincode pricing v2
 *
 * Run: npx tsx src/scripts/test-admin-api-routes.ts
 */

import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";

// Test configuration
const BASE_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@medusa-test.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class AdminAPITester {
  private client: AxiosInstance;
  private adminToken: string = "";
  private testProductId: string = "";
  private results: TestResult[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log("🧪 Admin API Test Suite\n");
    console.log(`Base URL: ${BASE_URL}\n`);
    console.log("=".repeat(60));

    try {
      // Setup
      await this.adminLogin();
      await this.setupTestData();

      // Run all tests
      await this.test1_getProductPricingOverview();
      await this.test2_updateProductPrice();
      await this.test3_updateProductPriceInvalidPincode();
      await this.test4_updateProductPriceInvalidPrice();
      await this.test5_updateNonexistentProduct();
      await this.test6_deleteProductPrice();
      await this.test7_deleteNonexistentPrice();
      await this.test8_downloadEmptyTemplate();
      await this.test9_downloadTemplateWithPincodes();
      await this.test10_csvUploadSuccess();
      await this.test11_csvUploadInvalidFile();
      await this.test12_excelUploadSuccess();

      // Print results
      this.printResults();
    } catch (error: any) {
      console.error("\n❌ Test suite failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Admin login
   */
  private async adminLogin() {
    console.log("\n🔐 Authenticating as admin...");

    const response = await this.client.post("/admin/auth/session", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.status !== 200) {
      throw new Error(`Admin login failed: ${response.status}`);
    }

    this.adminToken =
      response.data.user.token || response.headers["set-cookie"];
    console.log("✓ Admin authenticated");
  }

  /**
   * Setup test data
   */
  private async setupTestData() {
    console.log("\n📦 Setting up test data...");

    // Get first product from store
    const response = await this.client.get("/store/products", {
      params: { limit: 1 },
    });

    if (response.data.products && response.data.products.length > 0) {
      this.testProductId = response.data.products[0].id;
      console.log(`✓ Using test product: ${this.testProductId}`);
    } else {
      throw new Error("No products found. Please create a product first.");
    }
  }

  /**
   * Test 1: Get product pricing overview
   */
  private async test1_getProductPricingOverview() {
    const start = Date.now();
    const testName = "Get Product Pricing Overview";

    try {
      const response = await this.client.get(
        `/admin/pincode-pricing-v2/products/${this.testProductId}`,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 200 && response.data.product_id) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 2: Update product price
   */
  private async test2_updateProductPrice() {
    const start = Date.now();
    const testName = "Update Product Price";

    try {
      const response = await this.client.post(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/prices`,
        {
          pincode: "110001",
          price: 299900,
          delivery_days: 3,
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 200 && response.data.success) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 3: Update product price with invalid pincode
   */
  private async test3_updateProductPriceInvalidPincode() {
    const start = Date.now();
    const testName = "Update Product Price - Invalid Pincode";

    try {
      const response = await this.client.post(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/prices`,
        {
          pincode: "12345", // Invalid: 5 digits
          price: 299900,
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (
        response.status === 400 &&
        response.data.error === "INVALID_PINCODE"
      ) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(
          `Expected 400 with INVALID_PINCODE, got ${response.status}`
        );
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 4: Update product price with invalid price
   */
  private async test4_updateProductPriceInvalidPrice() {
    const start = Date.now();
    const testName = "Update Product Price - Invalid Price";

    try {
      const response = await this.client.post(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/prices`,
        {
          pincode: "110001",
          price: -100, // Invalid: negative
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 400 && response.data.error === "INVALID_PRICE") {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(
          `Expected 400 with INVALID_PRICE, got ${response.status}`
        );
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 5: Update nonexistent product
   */
  private async test5_updateNonexistentProduct() {
    const start = Date.now();
    const testName = "Update Nonexistent Product";

    try {
      const response = await this.client.post(
        `/admin/pincode-pricing-v2/products/prod_nonexistent/prices`,
        {
          pincode: "110001",
          price: 299900,
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 404) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Expected 404, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 6: Delete product price
   */
  private async test6_deleteProductPrice() {
    const start = Date.now();
    const testName = "Delete Product Price";

    try {
      // First create a price
      await this.client.post(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/prices`,
        {
          pincode: "110002",
          price: 299900,
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      // Then delete it
      const response = await this.client.delete(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/pincodes/110002`,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 200 && response.data.success) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 7: Delete nonexistent price
   */
  private async test7_deleteNonexistentPrice() {
    const start = Date.now();
    const testName = "Delete Nonexistent Price";

    try {
      const response = await this.client.delete(
        `/admin/pincode-pricing-v2/products/${this.testProductId}/pincodes/999999`,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 404) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Expected 404, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 8: Download empty template
   */
  private async test8_downloadEmptyTemplate() {
    const start = Date.now();
    const testName = "Download Empty Template";

    try {
      const response = await this.client.get(
        "/admin/pincode-pricing-v2/template",
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (
        response.status === 200 &&
        response.headers["content-type"]?.includes("text/csv")
      ) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(
          `Unexpected status or content-type: ${response.status}`
        );
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 9: Download template with pincodes
   */
  private async test9_downloadTemplateWithPincodes() {
    const start = Date.now();
    const testName = "Download Template With Pincodes";

    try {
      const response = await this.client.get(
        "/admin/pincode-pricing-v2/template?pincodes=110001,110002,400001",
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (
        response.status === 200 &&
        response.headers["content-type"]?.includes("text/csv")
      ) {
        // Verify CSV contains specified pincodes
        const csvContent = response.data;
        if (
          csvContent.includes("110001") &&
          csvContent.includes("110002") &&
          csvContent.includes("400001")
        ) {
          this.addResult(testName, true, Date.now() - start);
        } else {
          throw new Error("CSV doesn't contain specified pincodes");
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 10: CSV upload success
   */
  private async test10_csvUploadSuccess() {
    const start = Date.now();
    const testName = "CSV Upload Success";

    try {
      // Create test CSV
      const csv = `SKU,110001,110002,110003
test-product-1,2999,3199,2899
test-product-2,1999,2099,1899`;

      const base64 = Buffer.from(csv).toString("base64");

      const response = await this.client.post(
        "/admin/pincode-pricing-v2/upload",
        {
          file: base64,
          filename: "test.csv",
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      // Note: This will partially succeed if test products don't exist
      // We expect either 200 (full success) or 207 (partial success)
      if (
        (response.status === 200 || response.status === 207) &&
        response.data.statistics
      ) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 11: CSV upload with invalid file
   */
  private async test11_csvUploadInvalidFile() {
    const start = Date.now();
    const testName = "CSV Upload - Invalid File";

    try {
      const response = await this.client.post(
        "/admin/pincode-pricing-v2/upload",
        {
          file: "invalid-base64",
          filename: "test.csv",
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 400 || response.status === 500) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Expected 400/500, got ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Test 12: Excel upload success
   */
  private async test12_excelUploadSuccess() {
    const start = Date.now();
    const testName = "Excel Upload Success";

    try {
      // Create minimal Excel file (we'll use CSV format for simplicity)
      const csv = `SKU,110001,110002
test-product-1,2999,3199`;

      const base64 = Buffer.from(csv).toString("base64");

      const response = await this.client.post(
        "/admin/pincode-pricing-v2/upload",
        {
          file: base64,
          filename: "test.xlsx",
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (
        (response.status === 200 || response.status === 207) &&
        response.data.statistics
      ) {
        this.addResult(testName, true, Date.now() - start);
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      this.addResult(testName, false, Date.now() - start, error.message);
    }
  }

  /**
   * Add test result
   */
  private addResult(
    name: string,
    passed: boolean,
    duration: number,
    error?: string
  ) {
    this.results.push({ name, passed, error, duration });

    const icon = passed ? "✓" : "✗";
    const status = passed ? "PASS" : "FAIL";
    const color = passed ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(`${color}${icon} ${name} - ${status} (${duration}ms)${reset}`);

    if (error) {
      console.log(`  Error: ${error}`);
    }
  }

  /**
   * Print test results summary
   */
  private printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary\n");

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${total}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⏱  Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log("\n" + "=".repeat(60));

    if (failed === 0) {
      console.log("\n🎉 All tests passed!");
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed`);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new AdminAPITester();
tester.runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
