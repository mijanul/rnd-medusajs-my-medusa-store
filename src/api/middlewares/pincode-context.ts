import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";

/**
 * Pincode Context Middleware
 *
 * Captures customer's pincode from:
 * 1. Request headers (X-Customer-Pincode)
 * 2. Query parameters (?pincode=110001)
 * 3. Cart metadata (cart.metadata.customer_pincode)
 *
 * Attaches pincode to request context for downstream use in pricing
 */
export async function pincodeContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Priority 1: Header
    let pincode = req.headers["x-customer-pincode"] as string;

    // Priority 2: Query parameter
    if (!pincode && req.query.pincode) {
      pincode = req.query.pincode as string;
    }

    // Priority 3: Cart metadata (if cart_id is present)
    if (!pincode && req.query.cart_id) {
      try {
        const remoteQuery = req.scope.resolve("remoteQuery");
        const carts = await remoteQuery({
          entryPoint: "cart",
          fields: ["id", "metadata"],
          variables: { id: req.query.cart_id },
        });

        if (carts && carts.length > 0) {
          const cart = carts[0];
          pincode = cart.metadata?.customer_pincode as string;
        }
      } catch (error) {
        // Cart not found or error fetching, continue without pincode
        console.warn("Error fetching cart for pincode:", error);
      }
    }

    // Validate pincode format (6 digits)
    if (pincode && !/^\d{6}$/.test(pincode)) {
      console.warn(`Invalid pincode format: ${pincode}`);
      pincode = "";
    }

    // Attach pincode to request context
    (req as any).customerPincode = pincode;

    next();
  } catch (error) {
    console.error("Error in pincode middleware:", error);
    // Don't block the request, just continue without pincode
    next();
  }
}

export const config = {
  routes: [
    {
      matcher: "/store/*",
      middlewares: [pincodeContext],
    },
  ],
};
