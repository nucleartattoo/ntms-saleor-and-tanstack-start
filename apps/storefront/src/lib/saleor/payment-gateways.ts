export const SALEOR_STRIPE_GATEWAY_ID = "saleor.app.payment.stripe";
export const SALEOR_PAYPAL_GATEWAY_ID = "saleor.app.paypal";
export const SALEOR_LEGACY_STRIPE_GATEWAY_ID = "app.saleor.stripe";
export const SALEOR_LEGACY_STRIPE_PLUGIN_ID = "saleor.payments.stripe";
export const SALEOR_MIRUMEE_LEGACY_STRIPE_PLUGIN_ID = "mirumee.payments.stripe";
export const SALEOR_ADYEN_GATEWAY_ID = "app.saleor.adyen";
export const SALEOR_DUMMY_PAYMENT_APP_GATEWAY_ID =
  "saleor.io.dummy-payment-app";
export const SALEOR_LEGACY_DUMMY_GATEWAY_ID = "mirumee.payments.dummy";

export type NtmsSaleorPaymentGatewayConfig = {
  field: string;
  value?: string | null;
};

export type NtmsSaleorPaymentGatewayKind =
  | "legacy-dummy"
  | "payment-app-dummy"
  | "stripe"
  | "paypal"
  | "legacy-stripe"
  | "adyen"
  | "unsupported-app"
  | "unknown";

export type NtmsSaleorPaymentGatewayClassification = {
  kind: NtmsSaleorPaymentGatewayKind;
  productionCandidate: boolean;
  productionCapable: boolean;
  productionBlocker: string | null;
  wired: boolean;
};

export type NtmsSaleorPaymentGatewayLike = {
  id: string;
  name: string;
};

export type NtmsSaleorPaymentGatewayAvailability = {
  supported: boolean;
  supportLabel: string;
};

export type NtmsSaleorPaymentGatewayAvailabilityOptions = {
  allowUnsafeGateways?: boolean;
  enabledProductionGatewayIds?: ReadonlySet<string>;
};

export function classifyNtmsSaleorPaymentGateway(
  gateway: NtmsSaleorPaymentGatewayLike,
): NtmsSaleorPaymentGatewayClassification {
  if (gateway.id === SALEOR_DUMMY_PAYMENT_APP_GATEWAY_ID) {
    return {
      kind: "payment-app-dummy",
      productionCandidate: false,
      productionCapable: false,
      productionBlocker:
        "Saleor dummy payment app is test-only and must not be enabled for production checkout.",
      wired: true,
    };
  }

  if (
    gateway.id === SALEOR_LEGACY_DUMMY_GATEWAY_ID ||
    /dummy/i.test(gateway.id) ||
    /dummy/i.test(gateway.name)
  ) {
    return {
      kind: "legacy-dummy",
      productionCandidate: false,
      productionCapable: false,
      productionBlocker:
        "Saleor legacy dummy payment plugin is test-only and must not be enabled for production checkout.",
      wired: true,
    };
  }

  if (
    gateway.id === SALEOR_STRIPE_GATEWAY_ID ||
    gateway.id === SALEOR_LEGACY_STRIPE_GATEWAY_ID
  ) {
    return {
      kind: "stripe",
      productionCandidate: true,
      productionCapable: true,
      productionBlocker: null,
      wired: true,
    };
  }

  if (gateway.id === SALEOR_PAYPAL_GATEWAY_ID) {
    return {
      kind: "paypal",
      productionCandidate: true,
      productionCapable: true,
      productionBlocker: null,
      wired: true,
    };
  }

  if (
    gateway.id === SALEOR_LEGACY_STRIPE_PLUGIN_ID ||
    gateway.id === SALEOR_MIRUMEE_LEGACY_STRIPE_PLUGIN_ID
  ) {
    return {
      kind: "legacy-stripe",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "Saleor legacy Stripe plugin uses the deprecated checkout payment flow; use the Stripe Payment App before production checkout.",
      wired: true,
    };
  }

  if (gateway.id === SALEOR_ADYEN_GATEWAY_ID) {
    return {
      kind: "adyen",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "Adyen is detected, but this storefront does not have a wired Adyen payment component yet.",
      wired: false,
    };
  }

  if (
    gateway.id.startsWith("app.saleor.") ||
    gateway.id.startsWith("saleor.app.")
  ) {
    return {
      kind: "unsupported-app",
      productionCandidate: true,
      productionCapable: false,
      productionBlocker:
        "This payment app is not approved or wired in the Nuclear Tattoo Supply storefront.",
      wired: false,
    };
  }

  return {
    kind: "unknown",
    productionCandidate: false,
    productionCapable: false,
    productionBlocker:
      "Unknown Saleor payment gateway is not approved for production checkout.",
    wired: false,
  };
}

export function isNtmsSaleorDummyPaymentGateway(
  gateway: NtmsSaleorPaymentGatewayLike,
) {
  const { kind } = classifyNtmsSaleorPaymentGateway(gateway);
  return kind === "legacy-dummy" || kind === "payment-app-dummy";
}

export function isNtmsSaleorProductionPaymentGateway(
  gateway: NtmsSaleorPaymentGatewayLike,
) {
  return classifyNtmsSaleorPaymentGateway(gateway).productionCandidate;
}

export function isNtmsSaleorProductionCapablePaymentGateway(
  gateway: NtmsSaleorPaymentGatewayLike,
) {
  return classifyNtmsSaleorPaymentGateway(gateway).productionCapable;
}

export function getNtmsSaleorPaymentGatewayProductionBlocker(
  gateway: NtmsSaleorPaymentGatewayLike,
) {
  return classifyNtmsSaleorPaymentGateway(gateway).productionBlocker;
}

export function getNtmsSaleorPaymentGatewaySupportLabel(
  gateway: NtmsSaleorPaymentGatewayLike,
) {
  const { kind, wired } = classifyNtmsSaleorPaymentGateway(gateway);

  if (wired) {
    return "Integrated";
  }

  if (kind === "adyen") {
    return "Setup pending";
  }

  if (kind === "unsupported-app") {
    return "Unsupported app";
  }

  return "Unavailable";
}

export function getNtmsSaleorPaymentGatewayAvailability(
  gateway: NtmsSaleorPaymentGatewayLike,
  {
    allowUnsafeGateways = false,
    enabledProductionGatewayIds = new Set(),
  }: NtmsSaleorPaymentGatewayAvailabilityOptions = {},
): NtmsSaleorPaymentGatewayAvailability {
  const classification = classifyNtmsSaleorPaymentGateway(gateway);
  const productionEnabled =
    classification.productionCapable &&
    enabledProductionGatewayIds.has(gateway.id);

  if (productionEnabled && classification.wired) {
    return {
      supported: true,
      supportLabel: "Available",
    };
  }

  if (
    classification.kind === "legacy-dummy" ||
    classification.kind === "payment-app-dummy"
  ) {
    return {
      supported: allowUnsafeGateways && classification.wired,
      supportLabel: "Test only",
    };
  }

  if (classification.kind === "legacy-stripe") {
    return { supported: false, supportLabel: "Upgrade required" };
  }

  if (classification.productionCapable) {
    return { supported: false, supportLabel: "Not enabled" };
  }

  return {
    supported: false,
    supportLabel: getNtmsSaleorPaymentGatewaySupportLabel(gateway),
  };
}
