import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";
import * as fs from "fs";
import * as path from "path";

/**
 * Backup Current Database State
 *
 * Creates a backup of current pincode pricing data before migration.
 * This allows us to rollback if needed.
 */
export default async function backupDatabase({ container }: ExecArgs) {
  console.log("💾 BACKING UP DATABASE");
  console.log("=".repeat(60));

  const backupDir = path.join(process.cwd(), "backups");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `pricing-backup-${timestamp}.json`);

  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`✅ Created backups directory: ${backupDir}`);
    }

    const pricingService = container.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = container.resolve("remoteQuery");

    console.log("\n📦 Fetching data...");

    // 1. Backup products
    const products = await remoteQuery({
      entryPoint: "product",
      fields: ["id", "title", "handle", "created_at"],
    });
    console.log(`   Products: ${products.length}`);

    // 2. Backup dealers
    const dealers = await pricingService.listDealers({});
    console.log(`   Dealers: ${dealers.length}`);

    // 3. Backup pincode-dealer mappings
    const pincodeDealers = await pricingService.listPincodeDealers({});
    console.log(`   Pincode Mappings: ${pincodeDealers.length}`);

    // 4. Backup pincode prices
    const pincodePrices = await pricingService.listProductPincodePrices({});
    console.log(`   Pincode Prices: ${pincodePrices.length}`);

    // 5. Backup standard Medusa prices (for comparison)
    const variants = await remoteQuery({
      entryPoint: "product_variant",
      fields: ["id", "sku", "product_id", "price_set.*", "price_set.prices.*"],
    });
    console.log(`   Variants with Prices: ${variants.length}`);

    // Create backup object
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        description: "Pre-migration backup of pincode pricing system",
      },
      data: {
        products,
        dealers,
        pincodeDealers,
        pincodePrices,
        variants,
      },
      counts: {
        products: products.length,
        dealers: dealers.length,
        pincodeDealers: pincodeDealers.length,
        pincodePrices: pincodePrices.length,
        variants: variants.length,
      },
    };

    // Write to file
    console.log(`\n💾 Writing backup to: ${backupFile}`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const fileSize = fs.statSync(backupFile).size;
    console.log(`✅ Backup complete! Size: ${(fileSize / 1024).toFixed(2)} KB`);

    console.log("\n📊 BACKUP SUMMARY:");
    console.log("=".repeat(60));
    console.log(`File: ${backupFile}`);
    console.log(`Products: ${backup.counts.products}`);
    console.log(`Dealers: ${backup.counts.dealers}`);
    console.log(`Pincode Mappings: ${backup.counts.pincodeDealers}`);
    console.log(`Pincode Prices: ${backup.counts.pincodePrices}`);
    console.log(`Variants: ${backup.counts.variants}`);

    console.log("\n✅ Backup successful!");
    console.log("\n📝 To restore from this backup:");
    console.log(
      `   npx medusa exec ./src/scripts/restore-database.ts ${path.basename(
        backupFile
      )}`
    );
  } catch (error) {
    console.error("\n❌ Error creating backup:", error);
    throw error;
  }
}
