import { ExecArgs } from "@medusajs/framework/types";
import { PINCODE_PRICING_MODULE } from "../modules/pincode-pricing";

/**
 * Seed initial dealers and pincode mappings
 */
export default async function seedPincodePricing({ container }: ExecArgs) {
  const pricingService = container.resolve(PINCODE_PRICING_MODULE);

  console.log("🚀 Seeding dealers...");

  // Define all dealers
  const dealerData = [
    {
      name: "Mumbai Warehouse",
      code: "DEALER_MUMBAI",
      contact_name: "Rajesh Kumar",
      contact_email: "rajesh@mumbaiwarehouse.com",
      contact_phone: "+91-98765-43210",
      address: "Andheri East, Mumbai, Maharashtra",
      is_active: true,
    },
    {
      name: "Delhi Distributor",
      code: "DEALER_DELHI",
      contact_name: "Amit Sharma",
      contact_email: "amit@delhidist.com",
      contact_phone: "+91-98765-43211",
      address: "Connaught Place, New Delhi",
      is_active: true,
    },
    {
      name: "Bangalore Store - Koramangala",
      code: "DEALER_BANGALORE_1",
      contact_name: "Priya Reddy",
      contact_email: "priya@blrstore.com",
      contact_phone: "+91-98765-43212",
      address: "Koramangala, Bangalore, Karnataka",
      is_active: true,
    },
    {
      name: "Bangalore Store - Whitefield",
      code: "DEALER_BANGALORE_2",
      contact_name: "Suresh Kumar",
      contact_email: "suresh@blrwhitefield.com",
      contact_phone: "+91-98765-43214",
      address: "Whitefield, Bangalore, Karnataka",
      is_active: true,
    },
    {
      name: "Bangalore Store - Indiranagar",
      code: "DEALER_BANGALORE_3",
      contact_name: "Lakshmi Rao",
      contact_email: "lakshmi@blrindiranagar.com",
      contact_phone: "+91-98765-43215",
      address: "Indiranagar, Bangalore, Karnataka",
      is_active: true,
    },
    {
      name: "Chennai Supplier",
      code: "DEALER_CHENNAI",
      contact_name: "Kumar Swamy",
      contact_email: "kumar@chennasupp.com",
      contact_phone: "+91-98765-43213",
      address: "T Nagar, Chennai, Tamil Nadu",
      is_active: true,
    },
  ];

  // Get existing dealers
  const existingDealers = await pricingService.listDealers();
  const existingCodes = new Set(existingDealers.map((d: any) => d.code));

  // Create only new dealers
  const newDealers = dealerData.filter((d) => !existingCodes.has(d.code));

  let dealers = [...existingDealers];

  if (newDealers.length > 0) {
    const created = await pricingService.createDealers(newDealers);
    dealers = [...dealers, ...created];
    console.log(`✅ Created ${created.length} new dealers`);
  } else {
    console.log("ℹ️  All dealers already exist");
  }

  console.log(`📊 Total dealers: ${dealers.length}`);

  console.log("🗺️  Seeding pincode-dealer mappings...");

  // Sample pincode mappings with different dealers
  const pincodeMappings = [
    // Mumbai pincodes - Mumbai Warehouse
    {
      pincode: "400001",
      dealer_id: dealers.find((d) => d.code === "DEALER_MUMBAI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "400002",
      dealer_id: dealers.find((d) => d.code === "DEALER_MUMBAI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "400051",
      dealer_id: dealers.find((d) => d.code === "DEALER_MUMBAI")!.id,
      delivery_days: 3,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "400101",
      dealer_id: dealers.find((d) => d.code === "DEALER_MUMBAI")!.id,
      delivery_days: 3,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },

    // Delhi pincodes - Delhi Distributor
    {
      pincode: "110001",
      dealer_id: dealers.find((d) => d.code === "DEALER_DELHI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "110002",
      dealer_id: dealers.find((d) => d.code === "DEALER_DELHI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "110016",
      dealer_id: dealers.find((d) => d.code === "DEALER_DELHI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "110096",
      dealer_id: dealers.find((d) => d.code === "DEALER_DELHI")!.id,
      delivery_days: 3,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },

    // Bangalore pincodes - Multiple dealers in Bangalore
    // Dealer 1 - Koramangala (fastest for central Bangalore)
    {
      pincode: "560001",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_1")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "560002",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_1")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "560100",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_1")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },

    // Dealer 2 - Whitefield (best for eastern Bangalore)
    {
      pincode: "560001",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_2")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 2,
    },
    {
      pincode: "560002",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_2")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: false, // No COD from this dealer
      priority: 2,
    },
    {
      pincode: "560066", // Whitefield area
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_2")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "560100",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_2")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 2,
    },

    // Dealer 3 - Indiranagar (alternative for north Bangalore)
    {
      pincode: "560001",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_3")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 3,
    },
    {
      pincode: "560038", // Indiranagar area
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_3")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "560002",
      dealer_id: dealers.find((d) => d.code === "DEALER_BANGALORE_3")!.id,
      delivery_days: 1,
      is_serviceable: true,
      is_cod_available: true,
      priority: 3,
    },

    // Chennai pincodes - Chennai Supplier
    {
      pincode: "600001",
      dealer_id: dealers.find((d) => d.code === "DEALER_CHENNAI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "600002",
      dealer_id: dealers.find((d) => d.code === "DEALER_CHENNAI")!.id,
      delivery_days: 2,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },
    {
      pincode: "600017",
      dealer_id: dealers.find((d) => d.code === "DEALER_CHENNAI")!.id,
      delivery_days: 3,
      is_serviceable: true,
      is_cod_available: true,
      priority: 1,
    },

    // Example: Multiple dealers for same pincode (Mumbai can also be served by Delhi dealer with longer delivery)
    {
      pincode: "400001",
      dealer_id: dealers.find((d) => d.code === "DEALER_DELHI")!.id,
      delivery_days: 4,
      is_serviceable: true,
      is_cod_available: true,
      priority: 2,
    },
  ];

  await pricingService.createPincodeDealers(pincodeMappings);

  console.log(`✅ Created ${pincodeMappings.length} pincode-dealer mappings`);
  console.log("✨ Pincode pricing module seeded successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Create products WITHOUT prices in admin");
  console.log(
    "2. Download pricing CSV template: GET /admin/pincode-pricing/template"
  );
  console.log("3. Fill in prices for each pincode-dealer combination");
  console.log("4. Upload the CSV: POST /admin/pincode-pricing/upload");
}
