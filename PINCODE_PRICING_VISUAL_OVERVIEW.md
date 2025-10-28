# 🎯 Pincode Pricing System - Visual Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ADMIN INTERFACE                            │
│                                                                     │
│  ┌─────────────────────────┐      ┌──────────────────────────┐   │
│  │   Product Detail Page   │      │   CSV Management Page    │   │
│  │                         │      │                          │   │
│  │  Product Info           │      │  ┌────────────────────┐ │   │
│  │  Variants               │      │  │ Download Template  │ │   │
│  │  Standard Pricing       │      │  └────────────────────┘ │   │
│  │                         │      │                          │   │
│  │  ┌───────────────────┐ │      │  ┌────────────────────┐ │   │
│  │  │ PINCODE PRICING   │ │      │  │   Upload CSV       │ │   │
│  │  │ WIDGET ⭐         │ │      │  └────────────────────┘ │   │
│  │  │                   │ │      │                          │   │
│  │  │ • View prices     │ │      │  Bulk Operations:        │   │
│  │  │ • Edit inline     │ │      │  • 100+ products         │   │
│  │  │ • Sync button     │ │      │  • All pincodes          │   │
│  │  │ • Statistics      │ │      │  • One upload            │   │
│  │  └───────────────────┘ │      │                          │   │
│  └─────────────────────────┘      └──────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                │
│                                                                     │
│  Admin APIs                      Store APIs                         │
│  ┌───────────────────┐          ┌────────────────────────┐        │
│  │ GET /prices       │          │ GET /pincode-check     │        │
│  │ PUT /prices/:id   │          │ GET /pincode-price     │        │
│  │ POST /sync        │          │ POST /cart/with-pincode│        │
│  └───────────────────┘          └────────────────────────┘        │
│                                                                     │
│  Middleware: Capture Pincode                                       │
│  Workflow: Calculate Cart with Pincode Pricing                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ product_pincode_price (PRIMARY PRICING) ⭐                   │ │
│  │                                                               │ │
│  │ • product_id  (FK → product.id, CASCADE DELETE)              │ │
│  │ • pincode     (6 digits)                                     │ │
│  │ • dealer_id   (FK → dealer.id)                               │ │
│  │ • price       (decimal)                                      │ │
│  │ • is_active   (boolean)                                      │ │
│  │                                                               │ │
│  │ Example:                                                      │ │
│  │ prod_xxx | 110001 | dealer_1 | 2200.00 | true                │ │
│  │ prod_xxx | 110002 | dealer_1 | 2200.00 | true                │ │
│  │ prod_xxx | 110001 | dealer_2 | 2150.00 | true (WINS!)        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ price (Medusa Standard - Fallback)                           │ │
│  │                                                               │ │
│  │ • price_set_id                                               │ │
│  │ • currency_code  (INR, USD, EUR)                             │ │
│  │ • amount         (integer)                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ dealer                                                        │ │
│  │ code | name              | is_active                          │ │
│  │ DEL1 | Delhi Dealer      | true                               │ │
│  │ DEL2 | Delhi Dealer 2    | true                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ pincode_dealer                                                │ │
│  │ pincode | dealer_id | delivery_days | is_cod | serviceable   │ │
│  │ 110001  | DEL1      | 2             | true    | true          │ │
│  │ 110001  | DEL2      | 3             | true    | true          │ │
│  │ 110002  | DEL1      | 2             | false   | true          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### 1. Admin Creates/Updates Price

```
┌──────────────┐
│ Admin Panel  │
│ Sets INR     │
│ Price: 2200  │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ price table          │
│ amount = 2200        │
│ currency_code = inr  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────┐
│ price-sync.ts (Subscriber)   │
│ Detects price change         │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Get all dealers (2)          │
│ Get all pincodes (150)       │
└──────┬───────────────────────┘
       │
       ↓
┌────────────────────────────────────┐
│ Create product_pincode_price       │
│ 2 dealers × 150 pincodes = 300     │
│ All with price = 2200.00           │
└────────────────────────────────────┘
```

### 2. Customer Adds to Cart

```
┌─────────────────┐
│ Customer enters │
│ Pincode: 110001 │
└────────┬────────┘
         │
         ↓
┌──────────────────────────────┐
│ GET /store/pincode-check     │
│ Is 110001 serviceable?       │
└────────┬─────────────────────┘
         │
         ↓ Yes, 2 dealers serve this
         │
┌──────────────────────────────────────────┐
│ GET /store/products/prod_xxx/pincode-    │
│ price?pincode=110001                     │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ Query: product_pincode_price             │
│ WHERE product_id = 'prod_xxx'            │
│ AND pincode = '110001'                   │
│                                          │
│ Results:                                 │
│ • Dealer 1: ₹2,200                       │
│ • Dealer 2: ₹2,150 ← BEST PRICE!         │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ Return to customer:                      │
│ • Price: ₹2,150                          │
│ • Dealer: Dealer 2                       │
│ • Delivery: 3 days                       │
│ • COD: Available                         │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ Customer clicks "Add to Cart"            │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ POST /store/cart/with-pincode            │
│ Body: { product_id, pincode, quantity }  │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ Create cart:                             │
│ • cart.metadata.customer_pincode = 110001│
│ • item.unit_price = 2150.00              │
│ • item.metadata.pincode_price = 2150.00  │
│ • item.metadata.dealer = "Dealer 2"      │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│ Customer proceeds to checkout            │
│ Price locked: ₹2,150                     │
│ + Taxes calculated on 2150               │
│ + Shipping from Dealer 2                 │
└──────────────────────────────────────────┘
```

---

## 🎨 Widget UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Pincode-Based Pricing                                           │
│ Manage prices for different pincodes and dealers                │
│                                                                  │
│ [Sync from Currency Price]  [Manage via CSV]                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Total Pincodes: 150 | Total Prices: 300 | Avg: ₹2,200.00   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Pincode | Dealer        | Price (₹)  | Status  | Actions   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 110001  │ Delhi D. 1    │ 2200.00 ✏️ │ ● Active│ [Deact.]  │ │
│ │         │ Delhi D. 2    │ 2150.00 ✏️ │ ● Active│ [Deact.]  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 110002  │ Delhi D. 1    │ 2200.00 ✏️ │ ● Active│ [Deact.]  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 400001  │ Mumbai D.     │ 2300.00 ✏️ │ ● Active│ [Deact.]  │ │
│ │ ...                                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ 💡 Tip: Pincode pricing takes precedence over currency pricing. │
│    Use CSV upload for bulk price management.                    │
└─────────────────────────────────────────────────────────────────┘

Click on any price to edit inline:
2200.00 → [2500.00] [✓] [✕]
```

---

## 🗺️ Customer Journey Map

```
START: Customer visits your site
         │
         ↓
┌────────────────────────┐
│ Browse Products        │
│ • See product images   │
│ • Read descriptions    │
└────────┬───────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Pincode Modal Appears          │
│                                │
│ "Enter your pincode to         │
│  check availability & price"   │
│                                │
│  [______] Enter 6-digit code   │
│                                │
│           [Check]              │
└────────┬───────────────────────┘
         │
         ↓
Customer enters: 110001
         │
         ↓
┌────────────────────────────────┐
│ System Checks                  │
│ • Is pincode serviceable?      │
│ • Which dealers available?     │
│ • What's the best price?       │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Price Display                  │
│                                │
│ ✅ Available in your area!     │
│                                │
│ 💰 Price: ₹2,150               │
│ 🚚 Delivery: 3 days            │
│ 💵 Cash on Delivery: Available │
│ 🏢 Fulfilled by: Delhi Dealer 2│
│                                │
│     [Add to Cart] ←            │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Cart Page                      │
│                                │
│ Items:                         │
│ • Product X     ₹2,150 × 1     │
│ • Product Y     ₹1,500 × 2     │
│                                │
│ Subtotal:       ₹5,150         │
│ Tax (18%):      ₹927           │
│ Shipping:       Free           │
│ ─────────────────────          │
│ Total:          ₹6,077         │
│                                │
│ Pincode: 110001 [Change]       │
│                                │
│     [Proceed to Checkout] →    │
└────────┬───────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│ Checkout & Payment             │
│ • Shipping to: 110001          │
│ • Expected delivery: 3 days    │
│ • Payment method: COD/Card     │
└────────┬───────────────────────┘
         │
         ↓
    ORDER PLACED! 🎉
```

---

## 🔄 Price Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    3 Ways to Update Prices                      │
└─────────────────────────────────────────────────────────────────┘

1. Via Admin Panel (Standard Pricing)
   ┌──────────────────────┐
   │ Change INR Price     │
   │ ₹2,200 → ₹2,500     │
   └──────┬───────────────┘
          │
          ↓ (Auto-sync via subscriber)
   ┌──────────────────────────────────┐
   │ All pincode prices update        │
   │ 300 entries × ₹2,500             │
   └──────────────────────────────────┘

2. Via Widget (Individual Pincode)
   ┌──────────────────────┐
   │ Click price in widget│
   │ Change 2200 → 2500   │
   │ Press Enter          │
   └──────┬───────────────┘
          │
          ↓ (Instant update)
   ┌──────────────────────────────────┐
   │ Only that pincode-dealer updates │
   │ 110001 × Dealer 1 = ₹2,500       │
   └──────────────────────────────────┘

3. Via CSV (Bulk Update)
   ┌──────────────────────┐
   │ Download template    │
   │ Edit in Excel        │
   │ Upload CSV           │
   └──────┬───────────────┘
          │
          ↓ (Batch processing)
   ┌──────────────────────────────────┐
   │ All prices in CSV updated        │
   │ • 100+ products                  │
   │ • All pincodes                   │
   │ • In seconds                     │
   └──────────────────────────────────┘
```

---

## 🗑️ Product Deletion Flow

```
┌──────────────────────┐
│ Admin deletes product│
│ prod_xxx             │
└──────┬───────────────┘
       │
       ↓
┌───────────────────────────────┐
│ Database CASCADE DELETE       │
│ Triggered automatically       │
└──────┬────────────────────────┘
       │
       ↓
┌───────────────────────────────────────┐
│ product_pincode_price                 │
│ DELETE WHERE product_id = 'prod_xxx'  │
│                                       │
│ Before: 300 entries                   │
│ After:  0 entries                     │
│                                       │
│ ✅ Cleaned up automatically!          │
└───────────────────────────────────────┘

NO manual cleanup needed! 🎉
```

---

## 📊 Pricing Priority Logic

```
When customer requests price for pincode 110001:

Step 1: Query
┌──────────────────────────────────────┐
│ SELECT * FROM product_pincode_price  │
│ WHERE product_id = 'prod_xxx'        │
│   AND pincode = '110001'             │
│   AND is_active = true               │
└──────┬───────────────────────────────┘
       │
       ↓
Step 2: Results
┌──────────────────────────────────────┐
│ Dealer 1: ₹2,200                     │
│ Dealer 2: ₹2,150                     │
│ Dealer 3: ₹2,200                     │
└──────┬───────────────────────────────┘
       │
       ↓
Step 3: Sort
┌──────────────────────────────────────┐
│ Sort by:                             │
│ 1. Price (ascending)                 │
│ 2. Dealer priority (if price equal)  │
└──────┬───────────────────────────────┘
       │
       ↓
Step 4: Winner!
┌──────────────────────────────────────┐
│ 🏆 Dealer 2: ₹2,150                  │
│                                      │
│ Customer sees:                       │
│ • Price: ₹2,150                      │
│ • From: Dealer 2                     │
│ • Delivery: 3 days                   │
│ • COD: Yes                           │
└──────────────────────────────────────┘
```

---

## 🎯 System Benefits

```
┌─────────────────────────────────────────────────────────────┐
│                    FOR ADMIN                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Visual widget on product page                           │
│ ✅ Edit prices without SQL                                 │
│ ✅ Bulk operations via CSV                                 │
│ ✅ Auto-sync from standard pricing                         │
│ ✅ No manual cleanup needed                                │
│ ✅ Statistics and insights                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FOR CUSTOMERS                             │
├─────────────────────────────────────────────────────────────┤
│ ✅ Location-specific pricing                               │
│ ✅ See delivery time before purchase                       │
│ ✅ Know COD availability upfront                           │
│ ✅ Transparent dealer information                          │
│ ✅ Best price automatically selected                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FOR BUSINESS                              │
├─────────────────────────────────────────────────────────────┤
│ ✅ Expand to new areas easily                              │
│ ✅ Multiple dealer support                                 │
│ ✅ Dynamic pricing by location                             │
│ ✅ Optimize delivery costs                                 │
│ ✅ Scale to thousands of pincodes                          │
│ ✅ Data-driven pricing decisions                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎊 You Now Have

```
✨ Complete pincode-based pricing system
✨ Admin widget for easy management
✨ Customer APIs for frontend integration
✨ Cart and checkout with pincode support
✨ CSV bulk operations
✨ Automatic sync and cleanup
✨ Production-ready documentation
✨ Testing guide for QA

🚀 READY TO LAUNCH! 🚀
```

---

**For detailed implementation, see:**

- `PINCODE_PRICING_COMPLETE_SYSTEM.md`
- `PINCODE_PRICING_IMPLEMENTATION_SUMMARY.md`
- `PINCODE_PRICING_TESTING_GUIDE.md`
- `PINCODE_PRICING_QUICK_REFERENCE.md`
