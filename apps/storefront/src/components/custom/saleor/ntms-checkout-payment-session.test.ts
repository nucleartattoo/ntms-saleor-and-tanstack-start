import { describe, expect, test } from "vitest";
import type { NtmsSaleorCheckout } from "@/lib/saleor/checkout";
import { getNtmsSaleorPaymentSessionKey } from "./ntms-checkout-payment-session";

const baseCheckout = {
  billingAddress: {
    city: "Los Angeles",
    cityArea: "",
    companyName: "",
    countryArea: "CA",
    countryCode: "US",
    countryName: "United States",
    firstName: "Avery",
    lastName: "Artist",
    phone: "+13105550100",
    postalCode: "90012",
    streetAddress1: "100 Main Street",
    streetAddress2: "",
  },
  email: "avery@example.com",
  discountName: "",
  discountPrice: { amount: 0, currency: "USD" },
  id: "checkout-1",
  lines: [
    {
      id: "line-1",
      imageAlt: "Tattoo cartridge",
      imageUrl: "",
      productName: "Tattoo cartridge",
      productSlug: "tattoo-cartridge",
      quantity: 2,
      quantityAvailable: 10,
      sku: "CART-01",
      totalPrice: { amount: 40, currency: "USD" },
      unitPrice: { amount: 20, currency: "USD" },
      variantId: "variant-1",
      variantName: "Standard",
    },
  ],
  paymentGateways: [],
  quantity: 2,
  selectedShippingMethod: {
    description: "Ground delivery",
    id: "shipping-ground",
    maximumDeliveryDays: 5,
    message: "",
    minimumDeliveryDays: 3,
    name: "Ground",
    price: { amount: 8, currency: "USD" },
  },
  shippingAddress: {
    city: "Los Angeles",
    cityArea: "",
    companyName: "",
    countryArea: "CA",
    countryCode: "US",
    countryName: "United States",
    firstName: "Avery",
    lastName: "Artist",
    phone: "+13105550100",
    postalCode: "90012",
    streetAddress1: "100 Main Street",
    streetAddress2: "",
  },
  shippingMethods: [],
  automaticDiscountNames: [],
  automaticDiscountPrice: { amount: 0, currency: "USD" },
  originalSubtotalPrice: { amount: 40, currency: "USD" },
  shippingPrice: { amount: 8, currency: "USD" },
  subtotalPrice: { amount: 40, currency: "USD" },
  token: "checkout-token",
  totalPrice: { amount: 48, currency: "USD" },
  voucherCode: "",
} satisfies NtmsSaleorCheckout;

describe("getNtmsSaleorPaymentSessionKey", () => {
  test("stays stable for an unchanged checkout", () => {
    expect(
      getNtmsSaleorPaymentSessionKey(baseCheckout, "saleor.app.payment.stripe"),
    ).toBe(
      getNtmsSaleorPaymentSessionKey(baseCheckout, "saleor.app.payment.stripe"),
    );
  });

  test("changes when the provider order inputs change", () => {
    const initialKey = getNtmsSaleorPaymentSessionKey(
      baseCheckout,
      "saleor.app.payment.stripe",
    );
    const quantityChanged = {
      ...baseCheckout,
      lines: baseCheckout.lines.map((line) => ({
        ...line,
        quantity: 3,
        totalPrice: { amount: 60, currency: "USD" },
      })),
      quantity: 3,
      subtotalPrice: { amount: 60, currency: "USD" },
      totalPrice: { amount: 68, currency: "USD" },
    };
    const shippingChanged = {
      ...baseCheckout,
      selectedShippingMethod: {
        ...baseCheckout.selectedShippingMethod,
        id: "shipping-expedited",
      },
      shippingPrice: { amount: 20, currency: "USD" },
      totalPrice: { amount: 60, currency: "USD" },
    };
    const addressChanged = {
      ...baseCheckout,
      shippingAddress: {
        ...baseCheckout.shippingAddress,
        streetAddress1: "200 State Street",
      },
    };
    const promoChanged = {
      ...baseCheckout,
      discountName: "Studio promotion",
      discountPrice: { amount: 5, currency: "USD" },
      totalPrice: { amount: 43, currency: "USD" },
      voucherCode: "STUDIO5",
    };

    expect(
      getNtmsSaleorPaymentSessionKey(
        shippingChanged,
        "saleor.app.payment.stripe",
      ),
    ).not.toBe(initialKey);
    expect(
      getNtmsSaleorPaymentSessionKey(
        quantityChanged,
        "saleor.app.payment.stripe",
      ),
    ).not.toBe(initialKey);
    expect(
      getNtmsSaleorPaymentSessionKey(
        addressChanged,
        "saleor.app.payment.stripe",
      ),
    ).not.toBe(initialKey);
    expect(
      getNtmsSaleorPaymentSessionKey(promoChanged, "saleor.app.payment.stripe"),
    ).not.toBe(initialKey);
    expect(
      getNtmsSaleorPaymentSessionKey(baseCheckout, "saleor.app.paypal"),
    ).not.toBe(initialKey);
  });
});
