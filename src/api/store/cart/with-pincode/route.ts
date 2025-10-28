import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PINCODE_PRICING_MODULE = "pincodePricing";

/**
 * POST /store/cart/with-pincode
 * Add item to cart with pincode-based pricing
 *
 * This endpoint:
 * 1. Validates the pincode
 * 2. Gets pincode-based price for the product
 * 3. Creates/updates cart with pincode metadata
 * 4. Adds item with pincode-based unit_price
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any;
  const { cart_id, product_id, variant_id, quantity = 1, pincode } = body;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({
      message: "Please provide a valid 6-digit pincode",
      error: "INVALID_PINCODE",
    });
  }

  if (!product_id) {
    return res.status(400).json({
      message: "product_id is required",
      error: "MISSING_PRODUCT_ID",
    });
  }

  try {
    const pricingService = req.scope.resolve(PINCODE_PRICING_MODULE);
    const remoteQuery = req.scope.resolve("remoteQuery");

    // Check if pincode is serviceable
    const isServiceable = await pricingService.isPincodeServiceable(pincode);
    if (!isServiceable) {
      return res.status(400).json({
        message: `We don't serve pincode ${pincode} yet`,
        error: "PINCODE_NOT_SERVICEABLE",
      });
    }

    // Get pincode-based price
    const priceInfo = await pricingService.getProductPrice(product_id, pincode);
    const unitPrice = Number(priceInfo.price);

    // Create or get cart
    let cartId = cart_id;
    if (!cartId) {
      // Create new cart with pincode metadata
      const cartModule: any = req.scope.resolve("cartService");
      const newCart = await cartModule.create({
        currency_code: "inr",
        region_id: "reg_01K6YE9F1E6AWQXVQ0EWMVBNPE", // Update with your region ID
        metadata: {
          customer_pincode: pincode,
        },
      });
      cartId = newCart.id;
    } else {
      // Update existing cart metadata with pincode
      const cartModule: any = req.scope.resolve("cartService");
      await cartModule.update(cartId, {
        metadata: {
          customer_pincode: pincode,
        },
      });
    }

    // Add item to cart using Medusa's cart module
    const cartModule: any = req.scope.resolve("cartService");

    // Check if item already exists in cart
    const carts = await remoteQuery({
      entryPoint: "cart",
      fields: ["id", "items.*", "items.product_id", "items.quantity"],
      variables: { id: cartId },
    });

    const cart = carts[0];
    const existingItem = cart.items?.find(
      (item: any) => item.product_id === product_id
    );

    if (existingItem) {
      // Update quantity
      await cartModule.updateLineItem(cartId, existingItem.id, {
        quantity: existingItem.quantity + quantity,
      });
    } else {
      // Add new item
      await cartModule.addLineItem(cartId, {
        variant_id: variant_id || product_id, // Use product_id as fallback
        quantity,
        unit_price: unitPrice,
        metadata: {
          pincode_price: unitPrice,
          pincode: pincode,
          dealer: priceInfo.dealer?.name,
        },
      });
    }

    // Get updated cart
    const updatedCarts = await remoteQuery({
      entryPoint: "cart",
      fields: [
        "id",
        "currency_code",
        "metadata",
        "items.*",
        "items.product_id",
        "items.product.*",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.metadata",
      ],
      variables: { id: cartId },
    });

    const updatedCart = updatedCarts[0];

    // Calculate cart totals with pincode pricing
    let subtotal = 0;
    const itemsWithPricing: any[] = [];

    for (const item of updatedCart.items || []) {
      const itemPrice = item.metadata?.pincode_price || item.unit_price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      itemsWithPricing.push({
        ...item,
        unit_price: itemPrice,
        total: itemTotal,
      });
    }

    return res.json({
      cart: {
        id: updatedCart.id,
        currency_code: updatedCart.currency_code,
        metadata: updatedCart.metadata,
        items: itemsWithPricing,
        subtotal,
        total: subtotal, // Add taxes and discounts calculation here
      },
      pincode_info: {
        pincode,
        dealer: priceInfo.dealer?.name,
        delivery_days: priceInfo.delivery_days,
        is_cod_available: priceInfo.is_cod_available,
      },
    });
  } catch (error) {
    console.error("Error adding item to cart with pincode:", error);
    return res.status(500).json({
      message: "Error adding item to cart",
      error: error.message,
    });
  }
}
