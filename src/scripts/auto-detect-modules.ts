import { ExecArgs } from "@medusajs/framework/types";
import { batchCreatePermissions } from "../utils/permission-utils";
import * as fs from "fs";
import * as path from "path";

/**
 * Auto-Detect and Create Permissions for Custom Modules
 *
 * This script automatically:
 * 1. Scans src/modules for custom modules
 * 2. Detects module names from model definitions
 * 3. Creates permissions for all custom modules
 *
 * Run with: npx medusa exec ./src/scripts/auto-detect-modules.ts
 */

// Modules to exclude from auto-detection (system modules and already seeded modules)
const EXCLUDED_MODULES = [
  "role-management",
  "permission",
  "role",
  "user_role",
  "role_permission",
  "page", // Using "pages" (plural) instead
];

/**
 * Extract module name from model.define() in a file
 */
function extractModuleName(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Match: model.define("module_name", {
    const match = content.match(/model\.define\s*\(\s*["']([^"']+)["']/);

    if (match && match[1]) {
      const moduleName = match[1];
      // Exclude system modules
      if (!EXCLUDED_MODULES.includes(moduleName)) {
        return moduleName;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Scan a directory for model files
 */
function scanModuleDirectory(modulePath: string): string[] {
  const moduleNames: string[] = [];

  try {
    const modelsPath = path.join(modulePath, "models");

    if (!fs.existsSync(modelsPath)) {
      return moduleNames;
    }

    const files = fs.readdirSync(modelsPath);

    for (const file of files) {
      if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
        const filePath = path.join(modelsPath, file);
        const moduleName = extractModuleName(filePath);

        if (moduleName) {
          moduleNames.push(moduleName);
        }
      }
    }
  } catch (error) {
    // Ignore errors for individual modules
  }

  return moduleNames;
}

/**
 * Discover all custom modules
 */
function discoverCustomModules(basePath: string): string[] {
  const customModules: string[] = [];

  try {
    const modulesPath = path.join(basePath, "src", "modules");

    if (!fs.existsSync(modulesPath)) {
      return customModules;
    }

    const modules = fs.readdirSync(modulesPath);

    for (const module of modules) {
      if (EXCLUDED_MODULES.includes(module)) {
        continue;
      }

      const modulePath = path.join(modulesPath, module);
      const stat = fs.statSync(modulePath);

      if (stat.isDirectory()) {
        const moduleNames = scanModuleDirectory(modulePath);
        customModules.push(...moduleNames);
      }
    }
  } catch (error) {
    console.error("Error discovering modules:", error);
  }

  return Array.from(new Set(customModules)); // Remove duplicates
}

export default async function autoDetectModules({ container }: ExecArgs) {
  const logger = container.resolve("logger");

  logger.info("=".repeat(70));
  logger.info("AUTO-DETECT CUSTOM MODULES");
  logger.info("=".repeat(70));

  try {
    // Get the project root (assuming script is in src/scripts)
    const projectRoot = path.resolve(__dirname, "../..");

    logger.info(
      `\n🔍 Scanning for custom modules in: ${projectRoot}/src/modules`
    );

    // Discover custom modules
    const customModules = discoverCustomModules(projectRoot);

    if (customModules.length === 0) {
      logger.info("\n✅ No custom modules found to process.");
      logger.info("\nTo add permissions for a custom module:");
      logger.info("1. Create your module in src/modules/<module-name>");
      logger.info(
        "2. Define your model with model.define('module_name', {...})"
      );
      logger.info("3. Run this script again");
      return;
    }

    logger.info(`\n📦 Found ${customModules.length} custom module(s):`);
    customModules.forEach((module) => {
      logger.info(`   - ${module}`);
    });

    // Prepare resources for batch creation
    const resources = customModules.map((moduleName) => ({
      name: moduleName,
      description:
        moduleName.charAt(0).toUpperCase() +
        moduleName.slice(1).replace(/_/g, " "),
    }));

    logger.info("\n🚀 Creating permissions for custom modules...\n");

    // Batch create permissions
    await batchCreatePermissions(container, resources);

    logger.info("\n" + "=".repeat(70));
    logger.info("NEXT STEPS");
    logger.info("=".repeat(70));
    logger.info("1. Verify permissions:");
    logger.info("   npx medusa exec ./src/scripts/verify-permissions.ts");
    logger.info("\n2. Assign permissions to roles in the admin UI");
    logger.info("\n3. Use permissions in your routes/middleware");
    logger.info("=".repeat(70));
  } catch (error) {
    logger.error("❌ Error auto-detecting modules:", error);
    throw error;
  }
}
