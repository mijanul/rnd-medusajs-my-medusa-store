# 🏗️ Optimized Pincode Pricing Architecture - Strategic Proposal

## 📋 Current Situation Analysis

### Your Current Approach

- **Separate Table**: `product_pincode_price` (custom table)
- **Direct Link**: `product_id` → `pincode` → `price`
- **Problem**: Not leveraging Medusa's native pricing infrastructure
- **Issue**: Promotions, Price Lists, and other native features require custom integration

### Medusa's Native Pricing System

```
Product → Variant → Price Set → Multiple Prices (by region/currency/rules)
```

Medusa's pricing module supports:

- ✅ **Price Lists**: Override prices for specific scenarios
- ✅ **Promotions**: Discounts and special offers
- ✅ **Rules**: Complex pricing logic
- ✅ **Tax Calculations**: Built-in tax engine
- ✅ **Currency Conversion**: Multi-currency (though you only need INR)

---

## 🎯 Proposed Optimized Architecture

### Strategy: Leverage Medusa's Price Set System with Region-Based Pincode Mapping

Instead of a completely separate table, we'll **extend** Medusa's native pricing:

```
┌─────────────────────────────────────────────────────────────┐
│                     OPTIMIZED ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────┘

Product (No Variants - Single Default Variant per Product)
   │
   ├──> Variant (Auto-created default variant)
   │      │
   │      └──> Price Set (One per product)
   │             │
   │             ├──> Base Price (INR) - For admin UI display
   │             │
   │             └──> Pincode Prices (Multiple price rules)
   │                    │
   │                    ├──> 110001 → ₹2,150
   │                    ├──> 110002 → ₹2,200
   │                    ├──> 400001 → ₹2,300
   │                    └──> ... (one per pincode)
   │
   └──> Pincode Metadata (Lightweight reference table)
          │
          ├──> delivery_days
          ├──> is_cod_available
          └──> is_serviceable
```

---

## 🔧 Implementation Plan

### Phase 1: Database Schema Redesign

#### A. Keep Minimal Custom Tables

**1. `pincode_metadata` (New - Simplified)**

```sql
CREATE TABLE pincode_metadata (
  id TEXT PRIMARY KEY,
  pincode VARCHAR(6) NOT NULL UNIQUE,
  state VARCHAR(100),
  city VARCHAR(100),
  delivery_days INT DEFAULT 3,
  is_cod_available BOOLEAN DEFAULT true,
  is_serviceable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Store pincode-specific delivery information (NOT prices)

**2. Remove Tables**

- ❌ `product_pincode_price` (migrate to Medusa's price table)
- ❌ `dealer` table (not needed if one price per pincode)
- ❌ `pincode_dealer` mapping (simplified to pincode_metadata)

#### B. Leverage Medusa's Native Tables

**1. `price` table** (Medusa native)

- Already has: `price_set_id`, `amount`, `currency_code`
- Add via rules: Pincode as a context/rule
- Store prices here instead of custom table

**2. `price_rule` or use `region` mapping**

- Each pincode can be a "micro-region" or use price rules
- Medusa's pricing module already supports complex rules

---

### Phase 2: Pricing Integration Strategy

#### Option A: Region-Based Approach (Recommended)

**Concept**: Treat each pincode (or pincode group) as a region

```typescript
// Create regions for pincode groups
regions = [
  { name: "Delhi NCR", code: "IN-DEL", pincodes: ["110001", "110002", ...] },
  { name: "Mumbai", code: "IN-MUM", pincodes: ["400001", "400002", ...] },
  ...
]

// Prices stored in standard price table
prices = [
  {
    price_set_id: "pset_xxx",
    amount: 215000, // ₹2,150 in paise
    currency_code: "INR",
    region_id: "reg_delhi_ncr",
    min_quantity: 1,
    max_quantity: null
  }
]
```

**Advantages**:

- ✅ Uses Medusa's native pricing
- ✅ Promotions work automatically
- ✅ Price lists work automatically
- ✅ Tax calculations work automatically
- ✅ Admin UI works out of the box

#### Option B: Price Rules with Pincode Context (Advanced)

```typescript
// Use Medusa's price rules
priceRules = [
  {
    price_set_id: "pset_xxx",
    rule_type: "pincode",
    value: "110001",
    price: 215000,
  },
];
```

**Advantages**:

- ✅ More granular control
- ✅ One price per pincode easily
- ✅ Still uses native system

---

### Phase 3: Modified Module Structure

```
src/modules/pincode-pricing/
├── models/
│   └── pincode-metadata.ts           # Only metadata, not prices
├── services/
│   ├── pincode-metadata-service.ts   # Pincode info (delivery, COD, etc.)
│   └── pincode-pricing-adapter.ts    # Wrapper around Medusa pricing
├── workflows/
│   ├── create-product-with-pincode-prices.ts
│   ├── update-pincode-prices.ts
│   └── calculate-pincode-price.ts    # Integrates with Medusa pricing
└── migrations/
    └── create-pincode-metadata.ts
```

---

### Phase 4: API Design

#### Admin APIs (Modified)

**1. Create/Update Product with Prices**

```typescript
POST /admin/products
{
  "title": "Cotton T-Shirt",
  "handle": "cotton-tshirt",
  // No variants needed - system auto-creates default
  "pincode_prices": [
    { "pincode": "110001", "price": 2150 },
    { "pincode": "110002", "price": 2200 },
    { "pincode": "400001", "price": 2300 }
  ]
}
```

**Behind the scenes**:

1. Create product
2. Auto-create default variant
3. Create price_set
4. Create prices using Medusa's pricing module
5. Link prices to regions/rules based on pincodes

**2. Bulk Upload CSV**

```typescript
POST /admin/pincode-pricing/upload
- Parses CSV
- Creates/updates prices via Medusa's pricing service
- Updates pincode metadata
```

#### Store APIs (Modified)

**1. Get Product Price by Pincode**

```typescript
GET /store/products/:id/price?pincode=110001

Response:
{
  "product_id": "prod_xxx",
  "pincode": "110001",
  "price": 2150,
  "currency": "INR",
  "original_price": 2500,  // If promotion active
  "discount": 350,
  "tax": 387,              // Auto-calculated
  "total": 2537,
  "delivery": {
    "days": 2,
    "cod_available": true
  }
}
```

**Key**: Uses Medusa's `pricingService.calculatePrices()` with pincode context

---

### Phase 5: Promotions & Price Lists Integration

#### How Promotions Will Work

**Example: 10% off for all products**

```typescript
// Create promotion via Medusa admin
promotion = {
  code: "SAVE10",
  type: "percentage",
  value: 10,
  regions: ["IN-DEL", "IN-MUM"], // All pincode regions
};
```

**Customer checkout flow**:

1. Customer enters pincode `110001`
2. System finds base price: ₹2,150
3. Applies promotion: ₹2,150 - 10% = ₹1,935
4. Adds tax (18%): ₹1,935 + ₹348 = ₹2,283
5. Final price: ₹2,283

**No custom code needed** - Medusa handles this!

#### How Price Lists Will Work

**Example: VIP customers get ₹200 off**

```typescript
// Create price list via Medusa admin
priceList = {
  name: "VIP Customers",
  type: "override",
  customer_groups: ["vip"],
  prices: [
    {
      variant_id: "var_xxx",
      amount: 195000, // ₹1,950 (overrides ₹2,150)
      region_id: "reg_delhi_ncr",
    },
  ],
};
```

**Result**: VIP customers in Delhi pincodes see ₹1,950 instead of ₹2,150

---

## 📊 Migration Strategy

### Step 1: Data Migration

```typescript
// Migration script: migrate-to-native-pricing.ts

export default async function migrate({ container }: ExecArgs) {
  // 1. Get all products
  const products = await query.graph({
    entity: "product",
    fields: ["*", "variants.*"],
  });

  // 2. For each product with pincode prices
  for (const product of products) {
    const oldPrices = await getPincodeprices(product.id);

    // 3. Create regions for pincode groups
    const regions = await createRegionsForPincodes(oldPrices);

    // 4. Create prices via Medusa pricing service
    for (const region of regions) {
      await pricingService.create({
        variant_id: product.variants[0].id,
        amount: region.price,
        currency_code: "INR",
        region_id: region.id,
      });
    }
  }

  // 5. Migrate pincode metadata
  await migratePincodeMetadata();

  // 6. Archive old table (don't delete yet)
  await renameTable("product_pincode_price", "product_pincode_price_backup");
}
```

### Step 2: Admin UI Redesign

**Product Detail Page Widget**

```tsx
// New design integrates with Medusa's native price inputs

const ProductPricingWidget = ({ product }) => {
  return (
    <Container>
      <Heading>Pincode-Based Pricing</Heading>

      {/* Use Medusa's native price inputs */}
      <PriceList
        variant={product.variants[0]}
        regions={pincodeRegions}
        onUpdate={handlePriceUpdate} // Uses Medusa's pricing service
      />

      {/* CSV upload still available */}
      <CSVUpload onUpload={handleBulkUpload} />

      {/* Preview with promotions */}
      <PricePreview withPromotions withTax byPincode />
    </Container>
  );
};
```

### Step 3: CSV Format Update

**New CSV Format** (Simpler)

```csv
product_handle,pincode,price
cotton-tshirt,110001,2150
cotton-tshirt,110002,2200
cotton-tshirt,400001,2300
```

**Upload Handler**:

```typescript
async function handleCSVUpload(csv: string) {
  const rows = parseCSV(csv);

  for (const row of rows) {
    const product = await getProductByHandle(row.product_handle);
    const region = await getOrCreateRegionForPincode(row.pincode);

    // Use Medusa's pricing service
    await pricingService.upsert({
      variant_id: product.variants[0].id,
      region_id: region.id,
      amount: row.price * 100, // Convert to paise
      currency_code: "INR",
    });

    // Update metadata separately
    await updatePincodeMetadata(row.pincode, {
      delivery_days: row.delivery_days || 3,
      is_serviceable: true,
    });
  }
}
```

---

## 🎨 Admin UI Mockup

### Product Edit Page - Pricing Section

```
┌─────────────────────────────────────────────────────────┐
│ Product: Cotton T-Shirt                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Details] [Media] [Attributes] [Variants] [PRICING] ←   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📍 Pincode-Based Pricing                                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Base Price (for display)              ₹ [2,500]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Pincode Pricing                      [+ Add Region] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Region: Delhi NCR (110001-110096)                   │ │
│ │ Price: ₹ 2,150     [Edit] [Delete]                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Region: Mumbai (400001-400104)                      │ │
│ │ Price: ₹ 2,300     [Edit] [Delete]                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Region: Bangalore (560001-560100)                   │ │
│ │ Price: ₹ 2,200     [Edit] [Delete]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Or bulk upload:                                          │
│ [Download Template] [Upload CSV]                         │
│                                                          │
│ ✨ Active Promotions:                                   │
│ • SAVE10: -10% off all pincodes                         │
│ • VIP50: -₹50 for VIP customers                         │
│                                                          │
│ 💰 Price Preview (with promotions):                     │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Pincode: [110001] [Check]                         │   │
│ │                                                    │   │
│ │ Base Price:          ₹2,150                       │   │
│ │ Promotion (SAVE10):  -₹215                        │   │
│ │ Subtotal:            ₹1,935                       │   │
│ │ Tax (18%):          +₹348                         │   │
│ │ ────────────────────────────                      │   │
│ │ Final Price:         ₹2,283                       │   │
│ └───────────────────────────────────────────────────┘   │
│                                                          │
│ [Save Changes]                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Key Advantages of This Architecture

### 1. **Native Integration**

- ✅ Promotions work automatically
- ✅ Price lists work automatically
- ✅ Tax calculations built-in
- ✅ No custom discount logic needed

### 2. **Simplified Maintenance**

- ✅ Use Medusa's pricing APIs
- ✅ Less custom code to maintain
- ✅ Future Medusa updates compatible

### 3. **Better Performance**

- ✅ Leverage Medusa's cached pricing calculations
- ✅ Use existing indexes
- ✅ Optimized queries

### 4. **Flexible Pricing**

- ✅ Price by region (group of pincodes)
- ✅ Price by individual pincode
- ✅ Override with price lists
- ✅ Apply promotions on top

### 5. **Admin Experience**

- ✅ Familiar Medusa UI patterns
- ✅ CSV upload still available
- ✅ Real-time promotion preview
- ✅ Bulk operations

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Create `pincode_metadata` table
- [ ] Create region mapping for pincodes
- [ ] Build pricing adapter service
- [ ] Migration script for existing data

### Phase 2: API Layer (Week 2)

- [ ] Update admin APIs to use Medusa pricing
- [ ] Update store APIs with promotion support
- [ ] CSV upload/download with new format
- [ ] Testing with promotions

### Phase 3: Admin UI (Week 3)

- [ ] Redesign product pricing widget
- [ ] Add promotion preview
- [ ] Add price list management
- [ ] Testing and refinements

### Phase 4: Migration (Week 4)

- [ ] Run data migration
- [ ] Test all features
- [ ] Update documentation
- [ ] Deploy to production

---

## 📝 Code Examples

### Creating Product with Pincode Prices

```typescript
// src/workflows/create-product-with-pricing.ts

import { createWorkflow } from "@medusajs/framework/workflows-sdk";

export const createProductWithPincodePricing = createWorkflow(
  "create-product-with-pincode-pricing",
  function (input: CreateProductInput) {
    // Step 1: Create product (Medusa native)
    const product = createProductStep(input);

    // Step 2: Get default variant (auto-created)
    const variant = product.variants[0];

    // Step 3: Create price set
    const priceSet = createPriceSetStep({
      variant_id: variant.id,
    });

    // Step 4: For each pincode, create price
    const prices = transform(input.pincode_prices, (pincodes) => {
      return pincodes.map((pc) => {
        const region = getOrCreateRegionForPincode(pc.pincode);
        return {
          price_set_id: priceSet.id,
          amount: pc.price * 100, // INR to paise
          currency_code: "INR",
          region_id: region.id,
        };
      });
    });

    createPricesStep(prices);

    return product;
  }
);
```

### Getting Price with Promotions

```typescript
// src/api/store/products/[id]/price/route.ts

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const { pincode } = req.query;

  // Get region for pincode
  const region = await getRegionByPincode(pincode);

  // Use Medusa's pricing service (handles promotions, price lists, tax)
  const pricingService = req.scope.resolve("pricingService");

  const calculatedPrice = await pricingService.calculatePrices(
    { id: [id] },
    {
      context: {
        region_id: region.id,
        currency_code: "INR",
        customer_id: req.user?.customer_id,
      },
    }
  );

  // Get pincode metadata
  const metadata = await getPincodeMetadata(pincode);

  return res.json({
    product_id: id,
    pincode,
    calculated_price: calculatedPrice[id], // Includes all discounts
    delivery: metadata,
  });
}
```

---

## 🎯 Success Metrics

After implementation, you'll have:

1. ✅ **Promotions working** without custom code
2. ✅ **Price lists working** for customer segments
3. ✅ **Tax calculation** automatic
4. ✅ **CSV upload** maintained
5. ✅ **Same database** for all pricing (easier reporting)
6. ✅ **Future-proof** architecture

---

## 🤔 Decision Points

### Question 1: Granularity

**Option A**: One price per pincode (17,000+ pincodes in India)
**Option B**: Group pincodes into regions (~100 regions)

**Recommendation**: Start with Option B (regions), allow override for specific pincodes

### Question 2: Variant Strategy

**Current**: You don't use variants
**Proposal**: Auto-create one default variant per product

**Recommendation**: Keep one variant, hide variant UI in admin

### Question 3: Migration Timing

**Option A**: Big bang migration (all at once)
**Option B**: Gradual migration (run both systems)

**Recommendation**: Gradual with feature flag

---

## 📚 Next Steps

1. **Review this proposal** and decide on:

   - Region vs individual pincode pricing
   - Migration strategy
   - Timeline

2. **I can then**:

   - Create detailed migration scripts
   - Build the new admin UI
   - Update all APIs
   - Create comprehensive tests

3. **You'll get**:
   - Full integration with Medusa features
   - Simplified codebase
   - Better performance
   - Future-proof architecture

---

**Ready to proceed?** Let me know your preferences and I'll start implementing!
