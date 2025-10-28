import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * Step: Get pincode-based price for a line item
 */
const getPincodePriceStep = createStep(
  "get-pincode-price-step",
  async (
    {
      productId,
      pincode,
    }: {
      productId: string;
      pincode: string;
    },
    { container }
  ) => {
    const PINCODE_PRICING_MODULE = "pincodePricing";
    const pricingService = container.resolve(PINCODE_PRICING_MODULE);

    try {
      // Get pincode-based price
      const priceInfo = await pricingService.getProductPrice(
        productId,
        pincode
      );

      return new StepResponse({
        price: Number(priceInfo.price),
        dealer: priceInfo.dealer,
        delivery_days: priceInfo.delivery_days,
        is_cod_available: priceInfo.is_cod_available,
      });
    } catch (error) {
      // If pincode price not found, return null to fallback to standard pricing
      console.warn(
        `Pincode price not found for product ${productId} in pincode ${pincode}:`,
        error.message
      );
      return new StepResponse(null);
    }
  }
);

/**
 * Workflow: Calculate cart with pincode-based pricing
 *
 * This workflow overrides standard Medusa pricing with pincode-based pricing
 * for all items in the cart.
 */
export const calculateCartWithPincodePricingWorkflow = createWorkflow(
  "calculate-cart-with-pincode-pricing",
  function (input: { cart_id: string; pincode?: string }) {
    const { cart_id, pincode } = input;

    // Transform: Get cart details
    const cartData = transform(
      { cart_id },
      async ({ cart_id }, { container }) => {
        const remoteQuery = container.resolve("remoteQuery");

        const carts = await remoteQuery({
          entryPoint: "cart",
          fields: [
            "id",
            "metadata",
            "items.*",
            "items.product_id",
            "items.variant_id",
            "items.quantity",
            "items.unit_price",
          ],
          variables: { id: cart_id },
        });

        if (!carts || carts.length === 0) {
          throw new Error(`Cart ${cart_id} not found`);
        }

        const cart = carts[0];

        // Get pincode from metadata if not provided
        const customerPincode = pincode || cart.metadata?.customer_pincode;

        if (!customerPincode) {
          throw new Error("Customer pincode is required for pricing");
        }

        return {
          cart,
          pincode: customerPincode,
          items: cart.items || [],
        };
      }
    );

    // For each line item, get pincode-based price
    const itemsPricing = transform(
      { cartData },
      async ({ cartData }, { container }) => {
        const { items, pincode } = cartData;
        const PINCODE_PRICING_MODULE = "pincodePricing";
        const pricingService = container.resolve(PINCODE_PRICING_MODULE);

        const pricedItems: any[] = [];

        for (const item of items) {
          try {
            const priceInfo = await pricingService.getProductPrice(
              item.product_id,
              pincode
            );

            pricedItems.push({
              item_id: item.id,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              original_unit_price: item.unit_price,
              pincode_unit_price: Number(priceInfo.price),
              total_price: Number(priceInfo.price) * item.quantity,
              dealer: priceInfo.dealer?.name,
              delivery_days: priceInfo.delivery_days,
            });
          } catch (error) {
            console.warn(
              `Failed to get pincode price for product ${item.product_id}:`,
              error.message
            );
            // Fallback to original price
            pricedItems.push({
              item_id: item.id,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              original_unit_price: item.unit_price,
              pincode_unit_price: item.unit_price,
              total_price: item.unit_price * item.quantity,
              error: error.message,
            });
          }
        }

        return pricedItems;
      }
    );

    // Calculate totals
    const totals = transform({ itemsPricing }, ({ itemsPricing }) => {
      const subtotal = itemsPricing.reduce(
        (sum: number, item: any) => sum + item.total_price,
        0
      );

      return {
        subtotal,
        items: itemsPricing,
        currency: "INR",
      };
    });

    return new WorkflowResponse(totals);
  }
);
