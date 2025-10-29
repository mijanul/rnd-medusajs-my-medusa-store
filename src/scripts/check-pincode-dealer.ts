export default async function checkPincodeDealer({ container }: any) {
  const query = container.resolve("query");

  console.log("\n🔍 CHECKING PINCODE_DEALER TABLE");
  console.log("==================================");

  try {
    const pincodesDealers = await query.graph({
      entity: "pincode_dealer",
      fields: [
        "id",
        "pincode",
        "delivery_days",
        "is_cod_available",
        "is_serviceable",
        "priority",
        "deleted_at",
      ],
    });

    console.log(`\n📦 Total records: ${pincodesDealers.length}`);

    if (pincodesDealers.length > 0) {
      console.log("\n📋 Sample records:");
      console.table(pincodesDealers.slice(0, 10));

      const uniquePincodes = [
        ...new Set(pincodesDealers.map((pd) => pd.pincode)),
      ];
      console.log(`\n✓ Unique pincodes: ${uniquePincodes.length}`);
      console.log(
        `✓ Active records (deleted_at IS NULL): ${
          pincodesDealers.filter((pd) => !pd.deleted_at).length
        }`
      );
    } else {
      console.log("\n⚠️  No records found in pincode_dealer table.");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  }
}
