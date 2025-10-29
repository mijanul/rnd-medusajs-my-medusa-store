/**
 * Fix Region Issue for Storefront
 *
 * This script checks if a default region exists and creates one if needed.
 * The storefront requires at least one region to function properly.
 */

const { MedusaApp, Modules } = require("@medusajs/framework/utils");
const { medusaIntegrationTestRunner } = require("@medusajs/test-utils");

async function fixRegionIssue() {
  const app = await MedusaApp({
    workerMode: "shared",
  });

  try {
    const regionModule = app.modules[Modules.REGION];

    // Check if any regions exist
    const regions = await regionModule.listRegions({});

    console.log(`\n📊 Found ${regions.length} regions in database`);

    if (regions.length === 0) {
      console.log("\n⚠️  No regions found. Creating default region...");

      // Create a default India region
      const defaultRegion = await regionModule.createRegions({
        name: "India",
        currency_code: "INR",
        countries: ["IN"],
        metadata: {
          is_default: true,
        },
      });

      console.log("✅ Default region created:", defaultRegion.id);
      console.log("   Name:", defaultRegion.name);
      console.log("   Currency:", defaultRegion.currency_code);
    } else {
      console.log("\n✅ Regions found:");
      regions.slice(0, 5).forEach((region, idx) => {
        console.log(
          `   ${idx + 1}. ${region.name} (${region.id}) - ${
            region.currency_code
          }`
        );
      });

      if (regions.length > 5) {
        console.log(`   ... and ${regions.length - 5} more`);
      }

      // Check if there's a default region
      const defaultRegion = regions.find(
        (r) =>
          r.metadata?.is_default === true ||
          r.name === "India" ||
          !r.name.includes("-IN") // Not a pincode region
      );

      if (defaultRegion) {
        console.log(
          `\n✅ Default region: ${defaultRegion.name} (${defaultRegion.id})`
        );
      } else {
        console.log("\n⚠️  No default region found.");
        console.log(
          "   First region will be used as default:",
          regions[0].name
        );
      }
    }

    console.log("\n✨ Region check complete!");
    console.log("\n💡 If storefront still has issues:");
    console.log(
      "   1. Make sure you have a default region (not a pincode region)"
    );
    console.log(
      "   2. Pincode regions should have format: 'PINCODE-IN' (e.g., '110001-IN')"
    );
    console.log("   3. Default region should not have '-IN' suffix");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
fixRegionIssue()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
