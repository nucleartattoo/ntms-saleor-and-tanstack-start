import type { NtmsSaleorCheckout } from "@/lib/saleor/checkout";

/**
 * A payment session must be replaced when the checkout data that can affect a
 * provider order changes. This keeps stale provider sessions out of the UI.
 */
export function getNtmsSaleorPaymentSessionKey(
  checkout: NtmsSaleorCheckout,
  gatewayId: string,
) {
  return JSON.stringify({
    billingAddress: checkout.billingAddress,
    checkoutId: checkout.id,
    discountPrice: checkout.discountPrice,
    automaticDiscountPrice: checkout.automaticDiscountPrice,
    email: checkout.email,
    gatewayId,
    lines: checkout.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      totalPrice: line.totalPrice,
      variantId: line.variantId,
    })),
    selectedShippingMethodId: checkout.selectedShippingMethod?.id ?? null,
    shippingAddress: checkout.shippingAddress,
    totalPrice: checkout.totalPrice,
    voucherCode: checkout.voucherCode,
  });
}
