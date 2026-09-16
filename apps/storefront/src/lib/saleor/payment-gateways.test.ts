import { describe, expect, test } from "vitest";
import {
  classifyNtmsSaleorPaymentGateway,
  getNtmsSaleorPaymentGatewayAvailability,
  getNtmsSaleorPaymentGatewayProductionBlocker,
  getNtmsSaleorPaymentGatewaySupportLabel,
  isNtmsSaleorProductionCapablePaymentGateway,
  SALEOR_ADYEN_GATEWAY_ID,
  SALEOR_DUMMY_PAYMENT_APP_GATEWAY_ID,
  SALEOR_LEGACY_DUMMY_GATEWAY_ID,
  SALEOR_LEGACY_STRIPE_GATEWAY_ID,
  SALEOR_LEGACY_STRIPE_PLUGIN_ID,
  SALEOR_MIRUMEE_LEGACY_STRIPE_PLUGIN_ID,
  SALEOR_PAYPAL_GATEWAY_ID,
  SALEOR_STRIPE_GATEWAY_ID,
} from "@/lib/saleor/payment-gateways";

describe("Saleor payment gateway classification", () => {
  test("supports the legacy dummy plugin for test checkout completion", () => {
    const gateway = {
      id: SALEOR_LEGACY_DUMMY_GATEWAY_ID,
      name: "Dummy",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "legacy-dummy",
      productionCandidate: false,
      productionCapable: false,
      productionBlocker:
        "Saleor legacy dummy payment plugin is test-only and must not be enabled for production checkout.",
      wired: true,
    });
    expect(getNtmsSaleorPaymentGatewaySupportLabel(gateway)).toBe("Integrated");
    expect(getNtmsSaleorPaymentGatewayProductionBlocker(gateway)).toMatch(
      /test-only/,
    );
    expect(getNtmsSaleorPaymentGatewayAvailability(gateway)).toEqual({
      supported: false,
      supportLabel: "Test only",
    });
    expect(
      getNtmsSaleorPaymentGatewayAvailability(gateway, {
        allowUnsafeGateways: true,
      }),
    ).toEqual({
      supported: true,
      supportLabel: "Test only",
    });
  });

  test("supports the Saleor dummy payment app test flow", () => {
    const gateway = {
      id: SALEOR_DUMMY_PAYMENT_APP_GATEWAY_ID,
      name: "Dummy Payment App",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "payment-app-dummy",
      productionCandidate: false,
      productionCapable: false,
      productionBlocker:
        "Saleor dummy payment app is test-only and must not be enabled for production checkout.",
      wired: true,
    });
  });

  test("detects current Stripe app IDs as production-capable integrations", () => {
    const stripeGateway = {
      id: SALEOR_STRIPE_GATEWAY_ID,
      name: "Stripe",
    };
    const legacyStripeGateway = {
      id: SALEOR_LEGACY_STRIPE_GATEWAY_ID,
      name: "Stripe",
    };

    expect(classifyNtmsSaleorPaymentGateway(stripeGateway)).toEqual({
      kind: "stripe",
      productionCandidate: true,
      productionCapable: true,
      productionBlocker: null,
      wired: true,
    });
    expect(getNtmsSaleorPaymentGatewaySupportLabel(stripeGateway)).toBe(
      "Integrated",
    );
    expect(classifyNtmsSaleorPaymentGateway(legacyStripeGateway)).toEqual({
      kind: "stripe",
      productionCandidate: true,
      productionCapable: true,
      productionBlocker: null,
      wired: true,
    });
    expect(isNtmsSaleorProductionCapablePaymentGateway(stripeGateway)).toBe(
      true,
    );
  });

  test("detects the NTMS PayPal app as a production-capable integration", () => {
    const gateway = {
      id: SALEOR_PAYPAL_GATEWAY_ID,
      name: "PayPal",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "paypal",
      productionCandidate: true,
      productionCapable: true,
      productionBlocker: null,
      wired: true,
    });
    expect(getNtmsSaleorPaymentGatewaySupportLabel(gateway)).toBe("Integrated");
    expect(isNtmsSaleorProductionCapablePaymentGateway(gateway)).toBe(true);
  });

  test("detects Adyen as a production gateway pending client UI", () => {
    const adyenGateway = {
      id: SALEOR_ADYEN_GATEWAY_ID,
      name: "Adyen",
    };

    expect(classifyNtmsSaleorPaymentGateway(adyenGateway)).toEqual({
      kind: "adyen",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "Adyen is detected, but this storefront does not have a wired Adyen payment component yet.",
      wired: false,
    });
  });

  test("supports the deprecated Saleor Stripe plugin while the payment app is pending", () => {
    const gateway = {
      id: SALEOR_LEGACY_STRIPE_PLUGIN_ID,
      name: "Stripe (deprecated)",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "legacy-stripe",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "Saleor legacy Stripe plugin uses the deprecated checkout payment flow; use the Stripe Payment App before production checkout.",
      wired: true,
    });
    expect(getNtmsSaleorPaymentGatewaySupportLabel(gateway)).toBe("Integrated");
    expect(isNtmsSaleorProductionCapablePaymentGateway(gateway)).toBe(false);
    expect(getNtmsSaleorPaymentGatewayAvailability(gateway)).toEqual({
      supported: false,
      supportLabel: "Upgrade required",
    });
  });

  test("requires an explicit allowlist before enabling production-capable apps", () => {
    const gateway = {
      id: SALEOR_STRIPE_GATEWAY_ID,
      name: "Stripe",
    };
    expect(getNtmsSaleorPaymentGatewayAvailability(gateway)).toEqual({
      supported: false,
      supportLabel: "Not enabled",
    });
    expect(
      getNtmsSaleorPaymentGatewayAvailability(gateway, {
        enabledProductionGatewayIds: new Set([SALEOR_STRIPE_GATEWAY_ID]),
      }),
    ).toEqual({ supported: true, supportLabel: "Available" });
  });

  test("detects the historical Mirumee Stripe plugin as legacy Stripe", () => {
    const gateway = {
      id: SALEOR_MIRUMEE_LEGACY_STRIPE_PLUGIN_ID,
      name: "Stripe",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "legacy-stripe",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "Saleor legacy Stripe plugin uses the deprecated checkout payment flow; use the Stripe Payment App before production checkout.",
      wired: true,
    });
    expect(isNtmsSaleorProductionCapablePaymentGateway(gateway)).toBe(false);
  });

  test("marks unknown Saleor payment apps as production candidates without enabling them", () => {
    const gateway = {
      id: "saleor.app.other-payment",
      name: "Other Payment",
    };

    expect(classifyNtmsSaleorPaymentGateway(gateway)).toEqual({
      kind: "unsupported-app",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "This payment app is not approved or wired in the Nuclear Tattoo Supply storefront.",
      wired: false,
    });
    expect(getNtmsSaleorPaymentGatewaySupportLabel(gateway)).toBe(
      "Unsupported app",
    );
  });
});
