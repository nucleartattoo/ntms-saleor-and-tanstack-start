import { createServerFn } from "@tanstack/react-start";
import {
  addNtmsSaleorCheckoutLine,
  addNtmsSaleorCheckoutPromoCode,
  completeNtmsSaleorCheckout,
  createNtmsSaleorStripePaymentIntent,
  getNtmsSaleorCheckout,
  getNtmsSaleorOrder,
  initializeNtmsSaleorLegacyStripePayment,
  initializeNtmsSaleorPayPalPayment,
  initializeNtmsSaleorStripePayment,
  type NtmsSaleorAddressInput,
  type NtmsSaleorCheckout,
  type NtmsSaleorLegacyStripePayment,
  type NtmsSaleorOrder,
  type NtmsSaleorPayPalPayment,
  type NtmsSaleorStripePaymentConfig,
  type NtmsSaleorStripePaymentIntent,
  processNtmsSaleorPayPalPayment,
  processNtmsSaleorStripePayment,
  removeNtmsSaleorCheckoutLine,
  removeNtmsSaleorCheckoutPromoCode,
  updateNtmsSaleorCheckoutContactAndAddress,
  updateNtmsSaleorCheckoutDeliveryMethod,
  updateNtmsSaleorCheckoutLine,
} from "@/lib/saleor/checkout";

type SaleorCartActionResult =
  | {
      success: true;
      checkout: NtmsSaleorCheckout | null;
    }
  | {
      success: false;
      error: string;
    };

type SaleorOrderActionResult =
  | {
      success: true;
      order: NtmsSaleorOrder;
    }
  | {
      success: false;
      error: string;
    };

type SaleorStripePaymentActionResult =
  | {
      success: true;
      payment: NtmsSaleorStripePaymentConfig;
    }
  | {
      success: false;
      error: string;
    };

type SaleorStripePaymentIntentActionResult =
  | {
      success: true;
      payment: NtmsSaleorStripePaymentIntent;
    }
  | {
      success: false;
      error: string;
    };

type SaleorLegacyStripePaymentActionResult =
  | {
      success: true;
      payment: NtmsSaleorLegacyStripePayment;
    }
  | {
      success: false;
      error: string;
    };

type SaleorPayPalPaymentActionResult =
  | {
      success: true;
      payment: NtmsSaleorPayPalPayment;
    }
  | {
      success: false;
      error: string;
    };

type SaleorStripeProcessActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

type SaleorPayPalProcessActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export const getSaleorCart = createServerFn({ method: "POST" })
  .validator((data: { checkoutId?: string | null }) => data)
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId) {
      return { success: true, checkout: null };
    }

    try {
      return {
        success: true,
        checkout: await getNtmsSaleorCheckout(data.checkoutId),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to load cart"),
      };
    }
  });

export const addSaleorCartLine = createServerFn({ method: "POST" })
  .validator(
    (data: {
      checkoutId?: string | null;
      quantity?: number;
      variantId?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.variantId) {
      return { success: false, error: "Missing variant ID" };
    }

    try {
      return {
        success: true,
        checkout: await addNtmsSaleorCheckoutLine({
          checkoutId: data.checkoutId,
          quantity: data.quantity ?? 1,
          variantId: data.variantId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to add item"),
      };
    }
  });

export const updateSaleorCartLine = createServerFn({ method: "POST" })
  .validator(
    (data: {
      checkoutId?: string | null;
      lineId?: string;
      quantity?: number;
    }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.lineId || data.quantity === undefined) {
      return { success: false, error: "Missing cart line" };
    }

    try {
      return {
        success: true,
        checkout: await updateNtmsSaleorCheckoutLine({
          checkoutId: data.checkoutId,
          lineId: data.lineId,
          quantity: data.quantity,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to update item"),
      };
    }
  });

export const removeSaleorCartLine = createServerFn({ method: "POST" })
  .validator((data: { checkoutId?: string | null; lineId?: string }) => data)
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.lineId) {
      return { success: false, error: "Missing cart line" };
    }

    try {
      return {
        success: true,
        checkout: await removeNtmsSaleorCheckoutLine({
          checkoutId: data.checkoutId,
          lineId: data.lineId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to remove item"),
      };
    }
  });

export const addSaleorCheckoutPromoCode = createServerFn({ method: "POST" })
  .validator(
    (data: { checkoutId?: string | null; promoCode?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.promoCode?.trim()) {
      return { success: false, error: "Enter a promo code" };
    }

    try {
      return {
        success: true,
        checkout: await addNtmsSaleorCheckoutPromoCode({
          checkoutId: data.checkoutId,
          promoCode: data.promoCode,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to apply promo code"),
      };
    }
  });

export const removeSaleorCheckoutPromoCode = createServerFn({ method: "POST" })
  .validator(
    (data: { checkoutId?: string | null; promoCode?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.promoCode?.trim()) {
      return { success: false, error: "Checkout does not have a promo code" };
    }

    try {
      return {
        success: true,
        checkout: await removeNtmsSaleorCheckoutPromoCode({
          checkoutId: data.checkoutId,
          promoCode: data.promoCode,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to remove promo code",
        ),
      };
    }
  });

export const saveSaleorCheckoutAddress = createServerFn({ method: "POST" })
  .validator(
    (data: {
      address?: NtmsSaleorAddressInput;
      checkoutId?: string | null;
      email?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.email || !data.address) {
      return { success: false, error: "Missing checkout address" };
    }

    try {
      return {
        success: true,
        checkout: await updateNtmsSaleorCheckoutContactAndAddress({
          address: data.address,
          checkoutId: data.checkoutId,
          email: data.email,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to save address"),
      };
    }
  });

export const setSaleorCheckoutDeliveryMethod = createServerFn({
  method: "POST",
})
  .validator(
    (data: { checkoutId?: string | null; deliveryMethodId?: string }) => data,
  )
  .handler(async ({ data }): Promise<SaleorCartActionResult> => {
    if (!data.checkoutId || !data.deliveryMethodId) {
      return { success: false, error: "Missing delivery method" };
    }

    try {
      return {
        success: true,
        checkout: await updateNtmsSaleorCheckoutDeliveryMethod({
          checkoutId: data.checkoutId,
          deliveryMethodId: data.deliveryMethodId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to set delivery method",
        ),
      };
    }
  });

export const completeSaleorCheckout = createServerFn({ method: "POST" })
  .validator(
    (data: { checkoutId?: string | null; gatewayId?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorOrderActionResult> => {
    if (!data.checkoutId) {
      return { success: false, error: "Missing checkout" };
    }

    try {
      return {
        success: true,
        order: await completeNtmsSaleorCheckout({
          checkoutId: data.checkoutId,
          gatewayId: data.gatewayId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to place order"),
      };
    }
  });

export const initializeSaleorStripePayment = createServerFn({ method: "POST" })
  .validator(
    (data: { checkoutId?: string | null; gatewayId?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorStripePaymentActionResult> => {
    if (!data.checkoutId || !data.gatewayId) {
      return { success: false, error: "Missing Stripe checkout" };
    }

    try {
      return {
        success: true,
        payment: await initializeNtmsSaleorStripePayment({
          checkoutId: data.checkoutId,
          gatewayId: data.gatewayId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to initialize Stripe",
        ),
      };
    }
  });

export const createSaleorStripePaymentIntent = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      checkoutId?: string | null;
      gatewayId?: string | null;
      paymentMethodId?: string | null;
    }) => data,
  )
  .handler(async ({ data }): Promise<SaleorStripePaymentIntentActionResult> => {
    if (!data.checkoutId || !data.gatewayId || !data.paymentMethodId) {
      return { success: false, error: "Missing Stripe payment method" };
    }

    try {
      return {
        success: true,
        payment: await createNtmsSaleorStripePaymentIntent({
          checkoutId: data.checkoutId,
          gatewayId: data.gatewayId,
          paymentMethodId: data.paymentMethodId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to create Stripe payment",
        ),
      };
    }
  });

export const processSaleorStripePayment = createServerFn({ method: "POST" })
  .validator((data: { transactionId?: string | null }) => data)
  .handler(async ({ data }): Promise<SaleorStripeProcessActionResult> => {
    if (!data.transactionId) {
      return { success: false, error: "Missing Stripe transaction" };
    }

    try {
      await processNtmsSaleorStripePayment({
        transactionId: data.transactionId,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to process Stripe payment",
        ),
      };
    }
  });

export const initializeSaleorPayPalPayment = createServerFn({ method: "POST" })
  .validator(
    (data: { checkoutId?: string | null; gatewayId?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorPayPalPaymentActionResult> => {
    if (!data.checkoutId || !data.gatewayId) {
      return { success: false, error: "Missing PayPal checkout" };
    }

    try {
      return {
        success: true,
        payment: await initializeNtmsSaleorPayPalPayment({
          checkoutId: data.checkoutId,
          gatewayId: data.gatewayId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to initialize PayPal",
        ),
      };
    }
  });

export const processSaleorPayPalPayment = createServerFn({ method: "POST" })
  .validator((data: { transactionId?: string | null }) => data)
  .handler(async ({ data }): Promise<SaleorPayPalProcessActionResult> => {
    if (!data.transactionId) {
      return { success: false, error: "Missing PayPal transaction" };
    }

    try {
      await processNtmsSaleorPayPalPayment({
        transactionId: data.transactionId,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to process PayPal payment",
        ),
      };
    }
  });

export const initializeSaleorLegacyStripePayment = createServerFn({
  method: "POST",
})
  .validator(
    (data: { checkoutId?: string | null; gatewayId?: string | null }) => data,
  )
  .handler(async ({ data }): Promise<SaleorLegacyStripePaymentActionResult> => {
    if (!data.checkoutId || !data.gatewayId) {
      return { success: false, error: "Missing Stripe checkout" };
    }

    try {
      return {
        success: true,
        payment: await initializeNtmsSaleorLegacyStripePayment({
          checkoutId: data.checkoutId,
          gatewayId: data.gatewayId,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(
          error,
          "Unable to initialize Stripe",
        ),
      };
    }
  });

export const getSaleorOrder = createServerFn({ method: "POST" })
  .validator((data: { orderId?: string | null }) => data)
  .handler(async ({ data }): Promise<SaleorOrderActionResult> => {
    if (!data.orderId) {
      return { success: false, error: "Missing order" };
    }

    try {
      const order = await getNtmsSaleorOrder(data.orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      return { success: true, order };
    } catch (error) {
      return {
        success: false,
        error: formatSaleorCartActionError(error, "Unable to load order"),
      };
    }
  });

function formatSaleorCartActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
