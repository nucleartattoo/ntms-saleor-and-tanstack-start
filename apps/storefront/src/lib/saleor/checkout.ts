import { serverEnv } from "@/env/server";
import {
  getSaleorAllowUnsafePaymentGateways,
  getSaleorChannel,
  getSaleorEnabledPaymentGatewayIds,
  saleorFetch,
} from "@/lib/saleor";
import {
  classifyNtmsSaleorPaymentGateway,
  getNtmsSaleorPaymentGatewayAvailability,
  isNtmsSaleorDummyPaymentGateway,
  type NtmsSaleorPaymentGatewayConfig,
  type NtmsSaleorPaymentGatewayKind,
} from "@/lib/saleor/payment-gateways";

type SaleorMoney = {
  amount: number;
  currency: string;
};

type SaleorTaxedMoney = {
  gross: SaleorMoney;
};

type SaleorCheckoutError = {
  field?: string | null;
  message?: string | null;
  code: string;
};

type SaleorAddressNode = {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  streetAddress1?: string | null;
  streetAddress2?: string | null;
  city?: string | null;
  cityArea?: string | null;
  postalCode?: string | null;
  country?: {
    code: string;
    country: string;
  } | null;
  countryArea?: string | null;
  phone?: string | null;
};

type SaleorAddressInput = {
  firstName: string;
  lastName: string;
  companyName?: string;
  streetAddress1: string;
  streetAddress2?: string;
  city: string;
  postalCode: string;
  country: string;
  countryArea?: string;
  phone?: string;
};

type SaleorShippingMethodNode = {
  id: string;
  name: string;
  description?: string | null;
  minimumDeliveryDays?: number | null;
  maximumDeliveryDays?: number | null;
  message?: string | null;
  price: SaleorMoney;
};

type SaleorPaymentGatewayNode = {
  id: string;
  name: string;
  currencies: string[];
  config: NtmsSaleorPaymentGatewayConfig[];
};

type SaleorPaymentNode = {
  id: string;
  gateway: string;
  token: string;
  chargeStatus: string;
  total?: SaleorMoney | null;
  capturedAmount?: SaleorMoney | null;
};

type SaleorCheckoutNode = {
  id: string;
  token: string;
  email?: string | null;
  quantity: number;
  shippingAddress?: SaleorAddressNode | null;
  billingAddress?: SaleorAddressNode | null;
  subtotalPrice: SaleorTaxedMoney;
  totalPrice: SaleorTaxedMoney;
  shippingPrice: SaleorTaxedMoney;
  discount?: SaleorMoney | null;
  discountName?: string | null;
  voucherCode?: string | null;
  delivery?: {
    id: string;
    shippingMethod?: SaleorShippingMethodNode | null;
  } | null;
  shippingMethods: SaleorShippingMethodNode[];
  availablePaymentGateways: SaleorPaymentGatewayNode[];
  lines: {
    id: string;
    quantity: number;
    unitPrice: SaleorTaxedMoney;
    totalPrice: SaleorTaxedMoney;
    variant: {
      id: string;
      name: string;
      sku?: string | null;
      quantityAvailable?: number | null;
      product: {
        id: string;
        name: string;
        slug: string;
        thumbnail?: {
          url: string;
          alt?: string | null;
        } | null;
      };
    };
  }[];
};

type SaleorOrderLineNode = {
  id: string;
  productName: string;
  variantName: string;
  productSku?: string | null;
  quantity: number;
  totalPrice: SaleorTaxedMoney;
  thumbnail?: {
    url: string;
    alt?: string | null;
  } | null;
};

type SaleorOrderNode = {
  id: string;
  number: string;
  created: string;
  status: string;
  statusDisplay: string;
  isPaid: boolean;
  paymentStatusDisplay: string;
  userEmail?: string | null;
  shippingMethodName?: string | null;
  subtotal: SaleorTaxedMoney;
  shippingPrice: SaleorTaxedMoney;
  total: SaleorTaxedMoney;
  lines: SaleorOrderLineNode[];
};

type SaleorCheckoutPayload = {
  checkout?: SaleorCheckoutNode | null;
  errors: SaleorCheckoutError[];
};

type SaleorPaymentPayload = SaleorCheckoutPayload & {
  payment?: SaleorPaymentNode | null;
};

type SaleorCheckoutCompletePayload = {
  order?: SaleorOrderNode | null;
  confirmationNeeded: boolean;
  confirmationData?: string | null;
  errors: SaleorCheckoutError[];
};

type SaleorPaymentGatewayInitializeConfig = {
  id: string;
  data?: unknown | null;
  errors?: SaleorCheckoutError[] | null;
};

type SaleorPaymentGatewayInitializePayload = {
  gatewayConfigs?: SaleorPaymentGatewayInitializeConfig[] | null;
  errors: SaleorCheckoutError[];
};

type SaleorTransactionInitializePayload = {
  transaction?: {
    id: string;
    actions?: string[] | null;
  } | null;
  transactionEvent?: {
    message?: string | null;
    type?: string | null;
  } | null;
  data?: unknown | null;
  errors: SaleorCheckoutError[];
};

type SaleorPaymentGatewayToInitialize = {
  id: string;
  data?: unknown;
};

type SaleorCheckoutQueryResponse = {
  checkout?: SaleorCheckoutNode | null;
};

type SaleorOrderQueryResponse = {
  order?: SaleorOrderNode | null;
};

type SaleorCheckoutCreateResponse = {
  checkoutCreate: SaleorCheckoutPayload;
};

type SaleorCheckoutLinesAddResponse = {
  checkoutLinesAdd: SaleorCheckoutPayload;
};

type SaleorCheckoutLinesUpdateResponse = {
  checkoutLinesUpdate: SaleorCheckoutPayload;
};

type SaleorCheckoutLinesDeleteResponse = {
  checkoutLinesDelete: SaleorCheckoutPayload;
};

type SaleorCheckoutEmailUpdateResponse = {
  checkoutEmailUpdate: SaleorCheckoutPayload;
};

type SaleorCheckoutShippingAddressUpdateResponse = {
  checkoutShippingAddressUpdate: SaleorCheckoutPayload;
};

type SaleorCheckoutBillingAddressUpdateResponse = {
  checkoutBillingAddressUpdate: SaleorCheckoutPayload;
};

type SaleorCheckoutDeliveryMethodUpdateResponse = {
  checkoutDeliveryMethodUpdate: SaleorCheckoutPayload;
};

type SaleorCheckoutAddPromoCodeResponse = {
  checkoutAddPromoCode: SaleorCheckoutPayload;
};

type SaleorCheckoutRemovePromoCodeResponse = {
  checkoutRemovePromoCode: SaleorCheckoutPayload;
};

type SaleorCheckoutPaymentCreateResponse = {
  checkoutPaymentCreate: SaleorPaymentPayload;
};

type SaleorCheckoutCompleteResponse = {
  checkoutComplete: SaleorCheckoutCompletePayload;
};

type SaleorPaymentGatewayInitializeResponse = {
  paymentGatewayInitialize?: SaleorPaymentGatewayInitializePayload | null;
};

type SaleorTransactionInitializeResponse = {
  transactionInitialize?: SaleorTransactionInitializePayload | null;
};

type SaleorTransactionProcessResponse = {
  transactionProcess?: SaleorTransactionInitializePayload | null;
};

export type NtmsSaleorAddressInput = SaleorAddressInput;

export type NtmsSaleorAddress = {
  firstName: string;
  lastName: string;
  companyName: string;
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  cityArea: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  countryArea: string;
  phone: string;
};

export type NtmsSaleorShippingMethod = {
  id: string;
  name: string;
  description: string;
  price: SaleorMoney;
  minimumDeliveryDays: number | null;
  maximumDeliveryDays: number | null;
  message: string;
};

export type NtmsSaleorPaymentGateway = {
  id: string;
  name: string;
  currencies: string[];
  config: NtmsSaleorPaymentGatewayConfig[];
  kind: NtmsSaleorPaymentGatewayKind;
  productionCandidate: boolean;
  productionCapable: boolean;
  productionBlocker: string | null;
  supported: boolean;
  supportLabel: string;
};

export type NtmsSaleorStripePaymentConfig = {
  amount: number;
  currency: string;
  publishableKey: string;
};

export type NtmsSaleorStripePaymentIntent = {
  clientSecret: string;
  transactionId: string;
};

export type NtmsSaleorPayPalPayment = {
  amount: number;
  clientId: string;
  currency: string;
  environment: string;
  orderId: string;
  transactionId: string;
};

export type NtmsSaleorLegacyStripePayment = {
  clientSecret: string;
  paymentIntentId: string;
};

export type NtmsSaleorCartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantName: string;
  sku: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  imageAlt: string;
  unitPrice: SaleorMoney;
  totalPrice: SaleorMoney;
  quantityAvailable: number | null;
};

export type NtmsSaleorCheckout = {
  id: string;
  token: string;
  email: string;
  quantity: number;
  shippingAddress: NtmsSaleorAddress | null;
  billingAddress: NtmsSaleorAddress | null;
  subtotalPrice: SaleorMoney;
  totalPrice: SaleorMoney;
  shippingPrice: SaleorMoney;
  discountPrice: SaleorMoney;
  discountName: string;
  automaticDiscountPrice: SaleorMoney;
  automaticDiscountNames: string[];
  originalSubtotalPrice: SaleorMoney;
  voucherCode: string;
  selectedShippingMethod: NtmsSaleorShippingMethod | null;
  shippingMethods: NtmsSaleorShippingMethod[];
  paymentGateways: NtmsSaleorPaymentGateway[];
  lines: NtmsSaleorCartLine[];
};

type NtmsPricingCalculation = {
  originalSubtotal: number;
  pricedSubtotal: number;
  discountTotal: number;
  appliedRules: { name: string; sourceRuleId: number }[];
  lines: { id: string; total: number; unitPrice: number }[];
};

type NtmsPricingResponse = {
  ok: boolean;
  changed: boolean;
  currency: string;
  calculation: NtmsPricingCalculation;
  checkout?: {
    subtotalPrice?: SaleorTaxedMoney | null;
    totalPrice?: SaleorTaxedMoney | null;
    lines?: {
      id: string;
      unitPrice?: SaleorTaxedMoney | null;
      totalPrice?: SaleorTaxedMoney | null;
    }[];
  } | null;
};

export type NtmsSaleorOrderLine = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  totalPrice: SaleorMoney;
  imageUrl: string;
  imageAlt: string;
};

export type NtmsSaleorOrder = {
  id: string;
  number: string;
  created: string;
  status: string;
  statusDisplay: string;
  isPaid: boolean;
  paymentStatusDisplay: string;
  userEmail: string;
  shippingMethodName: string;
  subtotalPrice: SaleorMoney;
  shippingPrice: SaleorMoney;
  totalPrice: SaleorMoney;
  lines: NtmsSaleorOrderLine[];
};

const checkoutFields = `
  id
  token
  email
  quantity
  shippingAddress {
    firstName
    lastName
    companyName
    streetAddress1
    streetAddress2
    city
    cityArea
    postalCode
    country { code country }
    countryArea
    phone
  }
  billingAddress {
    firstName
    lastName
    companyName
    streetAddress1
    streetAddress2
    city
    cityArea
    postalCode
    country { code country }
    countryArea
    phone
  }
  subtotalPrice { gross { amount currency } }
  totalPrice { gross { amount currency } }
  shippingPrice { gross { amount currency } }
  discount { amount currency }
  discountName
  voucherCode
  delivery {
    id
    shippingMethod {
      id
      name
      description
      price { amount currency }
      minimumDeliveryDays
      maximumDeliveryDays
      message
    }
  }
  shippingMethods {
    id
    name
    description
    price { amount currency }
    minimumDeliveryDays
    maximumDeliveryDays
    message
  }
  availablePaymentGateways {
    id
    name
    currencies
    config { field value }
  }
  lines {
    id
    quantity
    unitPrice { gross { amount currency } }
    totalPrice { gross { amount currency } }
    variant {
      id
      name
      sku
      quantityAvailable
      product { id name slug thumbnail(size: 256) { url alt } media { url alt } }
    }
  }
`;

const orderFields = `
  id
  number
  created
  status
  statusDisplay
  isPaid
  paymentStatusDisplay
  userEmail
  shippingMethodName
  subtotal { gross { amount currency } }
  shippingPrice { gross { amount currency } }
  total { gross { amount currency } }
  lines {
    id
    productName
    variantName
    productSku
    quantity
    totalPrice { gross { amount currency } }
    thumbnail(size: 256) { url alt }
  }
`;

const checkoutQuery = `
  query NtmsSaleorCheckout($id: ID!) {
    checkout(id: $id) {
      ${checkoutFields}
    }
  }
`;

const orderQuery = `
  query NtmsSaleorOrder($id: ID!) {
    order(id: $id) {
      ${orderFields}
    }
  }
`;

const checkoutCreateMutation = `
  mutation NtmsSaleorCheckoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutLinesAddMutation = `
  mutation NtmsSaleorCheckoutLinesAdd($id: ID!, $lines: [CheckoutLineInput!]!) {
    checkoutLinesAdd(id: $id, lines: $lines) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutLinesUpdateMutation = `
  mutation NtmsSaleorCheckoutLinesUpdate($id: ID!, $lines: [CheckoutLineUpdateInput!]!) {
    checkoutLinesUpdate(id: $id, lines: $lines) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutLinesDeleteMutation = `
  mutation NtmsSaleorCheckoutLinesDelete($id: ID!, $linesIds: [ID!]!) {
    checkoutLinesDelete(id: $id, linesIds: $linesIds) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutEmailUpdateMutation = `
  mutation NtmsSaleorCheckoutEmailUpdate($id: ID!, $email: String!) {
    checkoutEmailUpdate(id: $id, email: $email) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutShippingAddressUpdateMutation = `
  mutation NtmsSaleorCheckoutShippingAddressUpdate($id: ID!, $shippingAddress: AddressInput!) {
    checkoutShippingAddressUpdate(id: $id, shippingAddress: $shippingAddress) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutBillingAddressUpdateMutation = `
  mutation NtmsSaleorCheckoutBillingAddressUpdate($id: ID!, $billingAddress: AddressInput!) {
    checkoutBillingAddressUpdate(id: $id, billingAddress: $billingAddress) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutDeliveryMethodUpdateMutation = `
  mutation NtmsSaleorCheckoutDeliveryMethodUpdate($id: ID!, $deliveryMethodId: ID!) {
    checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutAddPromoCodeMutation = `
  mutation NtmsSaleorCheckoutAddPromoCode($id: ID!, $promoCode: String!) {
    checkoutAddPromoCode(id: $id, promoCode: $promoCode) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutRemovePromoCodeMutation = `
  mutation NtmsSaleorCheckoutRemovePromoCode($id: ID!, $promoCode: String!) {
    checkoutRemovePromoCode(id: $id, promoCode: $promoCode) {
      checkout {
        ${checkoutFields}
      }
      errors { field message code }
    }
  }
`;

const checkoutPaymentCreateMutation = `
  mutation NtmsSaleorCheckoutPaymentCreate($id: ID!, $input: PaymentInput!) {
    checkoutPaymentCreate(id: $id, input: $input) {
      checkout {
        ${checkoutFields}
      }
      payment {
        id
        gateway
        token
        chargeStatus
        total { amount currency }
        capturedAmount { amount currency }
      }
      errors { field message code }
    }
  }
`;

const checkoutCompleteMutation = `
  mutation NtmsSaleorCheckoutComplete($id: ID!) {
    checkoutComplete(id: $id) {
      order {
        ${orderFields}
      }
      confirmationNeeded
      confirmationData
      errors { field message code }
    }
  }
`;

const paymentGatewayInitializeMutation = `
  mutation NtmsSaleorPaymentGatewayInitialize($checkoutId: ID!, $paymentGateways: [PaymentGatewayToInitialize!], $amount: PositiveDecimal) {
    paymentGatewayInitialize(id: $checkoutId, paymentGateways: $paymentGateways, amount: $amount) {
      gatewayConfigs {
        id
        data
        errors { field message code }
      }
      errors { field message code }
    }
  }
`;

const transactionInitializeMutation = `
  mutation NtmsSaleorTransactionInitialize($checkoutId: ID!, $paymentGateway: PaymentGatewayToInitialize!, $amount: PositiveDecimal) {
    transactionInitialize(id: $checkoutId, paymentGateway: $paymentGateway, amount: $amount) {
      transaction {
        id
        actions
      }
      transactionEvent {
        message
        type
      }
      data
      errors { field message code }
    }
  }
`;

const transactionProcessMutation = `
  mutation NtmsSaleorTransactionProcess($transactionId: ID!) {
    transactionProcess(id: $transactionId) {
      transaction {
        id
        actions
      }
      transactionEvent {
        message
        type
      }
      data
      errors { field message code }
    }
  }
`;

export async function getNtmsSaleorCheckout(
  checkoutId: string,
): Promise<NtmsSaleorCheckout | null> {
  const checkout = await loadNtmsSaleorCheckout(checkoutId);
  if (!checkout) return null;
  const pricing = await repriceNtmsSaleorCheckout(checkoutId);
  return pricing ? applyNtmsAutomaticPricing(checkout, pricing) : checkout;
}

async function loadNtmsSaleorCheckout(
  checkoutId: string,
): Promise<NtmsSaleorCheckout | null> {
  const data = await saleorFetch<SaleorCheckoutQueryResponse, { id: string }>({
    query: checkoutQuery,
    variables: { id: checkoutId },
  });

  return data.checkout ? mapCheckout(data.checkout) : null;
}

export async function getNtmsSaleorOrder(
  orderId: string,
): Promise<NtmsSaleorOrder | null> {
  const data = await saleorFetch<SaleorOrderQueryResponse, { id: string }>({
    query: orderQuery,
    variables: { id: orderId },
  });

  return data.order ? mapOrder(data.order) : null;
}

export async function addNtmsSaleorCheckoutLine({
  checkoutId,
  quantity,
  variantId,
}: {
  checkoutId?: string | null;
  quantity: number;
  variantId: string;
}): Promise<NtmsSaleorCheckout> {
  const safeQuantity = Math.max(1, Math.floor(quantity));

  if (!checkoutId) {
    const channel = getSaleorChannel();
    const data = await saleorFetch<
      SaleorCheckoutCreateResponse,
      {
        input: {
          channel: string;
          lines: { quantity: number; variantId: string }[];
        };
      }
    >({
      query: checkoutCreateMutation,
      variables: {
        input: {
          channel,
          lines: [{ quantity: safeQuantity, variantId }],
        },
      },
    });

    const checkout = checkoutFromPayload(data.checkoutCreate);
    return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
  }

  const data = await saleorFetch<
    SaleorCheckoutLinesAddResponse,
    { id: string; lines: { quantity: number; variantId: string }[] }
  >({
    query: checkoutLinesAddMutation,
    variables: {
      id: checkoutId,
      lines: [{ quantity: safeQuantity, variantId }],
    },
  });

  const checkout = checkoutFromPayload(data.checkoutLinesAdd);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function updateNtmsSaleorCheckoutLine({
  checkoutId,
  lineId,
  quantity,
}: {
  checkoutId: string;
  lineId: string;
  quantity: number;
}): Promise<NtmsSaleorCheckout> {
  if (quantity < 1) {
    return removeNtmsSaleorCheckoutLine({ checkoutId, lineId });
  }

  const data = await saleorFetch<
    SaleorCheckoutLinesUpdateResponse,
    {
      id: string;
      lines: { lineId: string; quantity: number }[];
    }
  >({
    query: checkoutLinesUpdateMutation,
    variables: {
      id: checkoutId,
      lines: [{ lineId, quantity: Math.floor(quantity) }],
    },
  });

  const checkout = checkoutFromPayload(data.checkoutLinesUpdate);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function removeNtmsSaleorCheckoutLine({
  checkoutId,
  lineId,
}: {
  checkoutId: string;
  lineId: string;
}): Promise<NtmsSaleorCheckout> {
  const data = await saleorFetch<
    SaleorCheckoutLinesDeleteResponse,
    { id: string; linesIds: string[] }
  >({
    query: checkoutLinesDeleteMutation,
    variables: {
      id: checkoutId,
      linesIds: [lineId],
    },
  });

  const checkout = checkoutFromPayload(data.checkoutLinesDelete);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function updateNtmsSaleorCheckoutContactAndAddress({
  address,
  checkoutId,
  email,
}: {
  address: NtmsSaleorAddressInput;
  checkoutId: string;
  email: string;
}): Promise<NtmsSaleorCheckout> {
  const emailData = await saleorFetch<
    SaleorCheckoutEmailUpdateResponse,
    { email: string; id: string }
  >({
    query: checkoutEmailUpdateMutation,
    variables: { email, id: checkoutId },
  });

  checkoutFromPayload(emailData.checkoutEmailUpdate);

  const shippingData = await saleorFetch<
    SaleorCheckoutShippingAddressUpdateResponse,
    { id: string; shippingAddress: SaleorAddressInput }
  >({
    query: checkoutShippingAddressUpdateMutation,
    variables: { id: checkoutId, shippingAddress: cleanAddressInput(address) },
  });

  checkoutFromPayload(shippingData.checkoutShippingAddressUpdate);

  const billingData = await saleorFetch<
    SaleorCheckoutBillingAddressUpdateResponse,
    { billingAddress: SaleorAddressInput; id: string }
  >({
    query: checkoutBillingAddressUpdateMutation,
    variables: { billingAddress: cleanAddressInput(address), id: checkoutId },
  });

  const checkout = checkoutFromPayload(
    billingData.checkoutBillingAddressUpdate,
  );
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function updateNtmsSaleorCheckoutDeliveryMethod({
  checkoutId,
  deliveryMethodId,
}: {
  checkoutId: string;
  deliveryMethodId: string;
}): Promise<NtmsSaleorCheckout> {
  const data = await saleorFetch<
    SaleorCheckoutDeliveryMethodUpdateResponse,
    { deliveryMethodId: string; id: string }
  >({
    query: checkoutDeliveryMethodUpdateMutation,
    variables: { deliveryMethodId, id: checkoutId },
  });

  const checkout = checkoutFromPayload(data.checkoutDeliveryMethodUpdate);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function addNtmsSaleorCheckoutPromoCode({
  checkoutId,
  promoCode,
}: {
  checkoutId: string;
  promoCode: string;
}): Promise<NtmsSaleorCheckout> {
  const code = promoCode.trim();
  if (!code) throw new Error("Enter a promo code");
  const data = await saleorFetch<
    SaleorCheckoutAddPromoCodeResponse,
    { id: string; promoCode: string }
  >({
    query: checkoutAddPromoCodeMutation,
    variables: { id: checkoutId, promoCode: code },
  });
  const checkout = checkoutFromPayload(data.checkoutAddPromoCode);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function removeNtmsSaleorCheckoutPromoCode({
  checkoutId,
  promoCode,
}: {
  checkoutId: string;
  promoCode: string;
}): Promise<NtmsSaleorCheckout> {
  const code = promoCode.trim();
  if (!code) throw new Error("Checkout does not have a promo code");
  const data = await saleorFetch<
    SaleorCheckoutRemovePromoCodeResponse,
    { id: string; promoCode: string }
  >({
    query: checkoutRemovePromoCodeMutation,
    variables: { id: checkoutId, promoCode: code },
  });
  const checkout = checkoutFromPayload(data.checkoutRemovePromoCode);
  return requireRepricedCheckout(await getNtmsSaleorCheckout(checkout.id));
}

export async function initializeNtmsSaleorPaymentGatewayConfigs({
  amount,
  checkoutId,
  gateways,
}: {
  amount?: number;
  checkoutId: string;
  gateways: NtmsSaleorPaymentGateway[];
}): Promise<SaleorPaymentGatewayInitializeConfig[]> {
  const paymentAppGateways = gateways.filter(
    (gateway) => gateway.kind !== "legacy-dummy" && gateway.kind !== "unknown",
  );

  if (paymentAppGateways.length === 0) {
    return [];
  }

  const data = await saleorFetch<
    SaleorPaymentGatewayInitializeResponse,
    {
      amount?: number;
      checkoutId: string;
      paymentGateways: { id: string; data: NtmsSaleorPaymentGatewayConfig[] }[];
    }
  >({
    query: paymentGatewayInitializeMutation,
    variables: {
      amount,
      checkoutId,
      paymentGateways: paymentAppGateways.map((gateway) => ({
        id: gateway.id,
        data: gateway.config,
      })),
    },
  });

  const payload = data.paymentGatewayInitialize;
  if (!payload) {
    throw new Error("Saleor did not return payment gateway configs");
  }

  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  const gatewayConfigErrors = (payload.gatewayConfigs ?? []).flatMap(
    (config) => config.errors ?? [],
  );
  if (gatewayConfigErrors.length > 0) {
    throw new Error(formatCheckoutErrors(gatewayConfigErrors));
  }

  return payload.gatewayConfigs ?? [];
}

export async function initializeNtmsSaleorStripePayment({
  checkoutId,
  gatewayId,
}: {
  checkoutId: string;
  gatewayId: string;
}): Promise<NtmsSaleorStripePaymentConfig> {
  const checkout = await getNtmsSaleorCheckout(checkoutId);
  assertStripeCheckoutReady(checkout);

  const gateway = findStripeGateway(checkout, gatewayId);
  const gatewayConfigs = await initializeNtmsSaleorPaymentGatewayConfigs({
    amount: checkout.totalPrice.amount,
    checkoutId,
    gateways: [gateway],
  });
  const stripeData = parseNtmsSaleorStripeGatewayConfig(gatewayConfigs);

  return {
    amount: toStripeMinorAmount(checkout.totalPrice),
    currency: checkout.totalPrice.currency.toLowerCase(),
    publishableKey: stripeData.publishableKey,
  };
}

export async function createNtmsSaleorStripePaymentIntent({
  checkoutId,
  gatewayId,
  paymentMethodId,
}: {
  checkoutId: string;
  gatewayId: string;
  paymentMethodId: string;
}): Promise<NtmsSaleorStripePaymentIntent> {
  const checkout = await getNtmsSaleorCheckout(checkoutId);
  assertStripeCheckoutReady(checkout);
  const gateway = findStripeGateway(checkout, gatewayId);

  const payload = await initializeNtmsSaleorPaymentAppTransaction({
    amount: checkout.totalPrice.amount,
    checkoutId,
    paymentGateway: {
      id: gateway.id,
      data: {
        paymentIntent: {
          paymentMethod: paymentMethodId,
        },
      },
    },
  });
  const { clientSecret } = parseNtmsSaleorStripeTransactionData(payload.data);

  return {
    clientSecret,
    transactionId: payload.transaction?.id ?? "",
  };
}

export async function processNtmsSaleorStripePayment({
  transactionId,
}: {
  transactionId: string;
}) {
  const data = await saleorFetch<
    SaleorTransactionProcessResponse,
    {
      transactionId: string;
    }
  >({
    query: transactionProcessMutation,
    variables: { transactionId },
  });

  const payload = data.transactionProcess;
  if (!payload) {
    throw new Error("Saleor did not return a processed transaction");
  }

  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  return payload;
}

export async function initializeNtmsSaleorPayPalPayment({
  checkoutId,
  gatewayId,
}: {
  checkoutId: string;
  gatewayId: string;
}): Promise<NtmsSaleorPayPalPayment> {
  const checkout = await getNtmsSaleorCheckout(checkoutId);
  assertPaymentCheckoutReady(checkout, "using PayPal");

  const gateway = findPayPalGateway(checkout, gatewayId);
  const payload = await initializeNtmsSaleorPaymentAppTransaction({
    amount: checkout.totalPrice.amount,
    checkoutId,
    paymentGateway: {
      id: gateway.id,
      data: {},
    },
  });
  const paypalData = parseNtmsSaleorPayPalTransactionData(payload.data);
  const transactionId = payload.transaction?.id;
  if (!transactionId) {
    throw new Error("Saleor PayPal app did not return a transaction");
  }

  return {
    ...paypalData,
    amount: checkout.totalPrice.amount,
    currency: checkout.totalPrice.currency.toUpperCase(),
    transactionId,
  };
}

export async function processNtmsSaleorPayPalPayment({
  transactionId,
}: {
  transactionId: string;
}) {
  const data = await saleorFetch<
    SaleorTransactionProcessResponse,
    {
      transactionId: string;
    }
  >({
    query: transactionProcessMutation,
    variables: { transactionId },
  });

  const payload = data.transactionProcess;
  if (!payload) {
    throw new Error("Saleor did not return a processed PayPal transaction");
  }

  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  if (/failure/i.test(payload.transactionEvent?.type ?? "")) {
    throw new Error(
      payload.transactionEvent?.message || "PayPal payment capture failed",
    );
  }

  return payload;
}

export async function initializeNtmsSaleorLegacyStripePayment({
  checkoutId,
  gatewayId,
}: {
  checkoutId: string;
  gatewayId: string;
}): Promise<NtmsSaleorLegacyStripePayment> {
  const checkout = await getNtmsSaleorCheckout(checkoutId);
  if (!checkout) {
    throw new Error("Saleor checkout no longer exists");
  }

  if (!checkout.selectedShippingMethod) {
    throw new Error("Select a delivery method before placing the order");
  }

  const gateway = checkout.paymentGateways.find(
    (paymentGateway) => paymentGateway.id === gatewayId,
  );
  if (gateway?.kind !== "legacy-stripe" || !gateway.supported) {
    throw new Error("Stripe is not available for this checkout");
  }

  const paymentData = await saleorFetch<
    SaleorCheckoutPaymentCreateResponse,
    {
      id: string;
      input: {
        amount: number;
        gateway: string;
        token: string;
      };
    }
  >({
    query: checkoutPaymentCreateMutation,
    variables: {
      id: checkoutId,
      input: {
        amount: checkout.totalPrice.amount,
        gateway: gateway.id,
        token: "stripe-elements",
      },
    },
  });

  checkoutFromPaymentPayload(paymentData.checkoutPaymentCreate);

  const completeData = await saleorFetch<
    SaleorCheckoutCompleteResponse,
    { id: string }
  >({
    query: checkoutCompleteMutation,
    variables: { id: checkoutId },
  });

  if (completeData.checkoutComplete.errors.length > 0) {
    throw new Error(formatCheckoutErrors(completeData.checkoutComplete.errors));
  }

  if (!completeData.checkoutComplete.confirmationNeeded) {
    throw new Error("Saleor Stripe did not return payment confirmation data");
  }

  return parseNtmsSaleorLegacyStripeConfirmationData(
    completeData.checkoutComplete.confirmationData,
  );
}

export async function completeNtmsSaleorCheckout({
  checkoutId,
  gatewayId,
}: {
  checkoutId: string;
  gatewayId?: string | null;
}): Promise<NtmsSaleorOrder> {
  const checkout = await getNtmsSaleorCheckout(checkoutId);
  if (!checkout) {
    throw new Error("Saleor checkout no longer exists");
  }

  if (!checkout.selectedShippingMethod) {
    throw new Error("Select a delivery method before placing the order");
  }

  if (checkout.totalPrice.amount > 0) {
    const gateway =
      checkout.paymentGateways.find((paymentGateway) =>
        gatewayId ? paymentGateway.id === gatewayId : false,
      ) ??
      checkout.paymentGateways.find(
        (paymentGateway) => paymentGateway.supported,
      );

    if (!gateway) {
      throw new Error("No supported payment gateway is available");
    }

    if (!gateway.supported) {
      if (gateway.productionCandidate) {
        throw new Error(
          `${gateway.name} is detected but its client-side payment component is not wired in this storefront yet.`,
        );
      }

      throw new Error(`${gateway.name} is not supported by this storefront.`);
    }

    if (gateway.kind === "stripe") {
      // Stripe Elements confirms the PaymentIntent on the client before this runs.
    } else if (gateway.kind === "payment-app-dummy") {
      await initializeNtmsSaleorPaymentAppTransaction({
        amount: checkout.totalPrice.amount,
        checkoutId,
        paymentGateway: {
          id: gateway.id,
          data: {
            event: {
              includePspReference: true,
              type: "CHARGE_SUCCESS",
            },
          },
        },
      });
    } else if (isNtmsSaleorDummyPaymentGateway(gateway)) {
      const paymentData = await saleorFetch<
        SaleorCheckoutPaymentCreateResponse,
        {
          id: string;
          input: {
            amount: number;
            gateway: string;
            token: string;
          };
        }
      >({
        query: checkoutPaymentCreateMutation,
        variables: {
          id: checkoutId,
          input: {
            amount: checkout.totalPrice.amount,
            gateway: gateway.id,
            token: "charged",
          },
        },
      });

      checkoutFromPaymentPayload(paymentData.checkoutPaymentCreate);
    }
  }

  const completeData = await saleorFetch<
    SaleorCheckoutCompleteResponse,
    { id: string }
  >({
    query: checkoutCompleteMutation,
    variables: { id: checkoutId },
  });

  return orderFromCompletePayload(completeData.checkoutComplete);
}

function checkoutFromPayload(payload: SaleorCheckoutPayload) {
  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  if (!payload.checkout) {
    throw new Error("Saleor did not return a checkout");
  }

  return mapCheckout(payload.checkout);
}

function checkoutFromPaymentPayload(payload: SaleorPaymentPayload) {
  checkoutFromPayload(payload);

  if (!payload.payment) {
    throw new Error("Saleor did not return a payment");
  }

  return payload.payment;
}

function orderFromCompletePayload(payload: SaleorCheckoutCompletePayload) {
  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  if (payload.confirmationNeeded) {
    throw new Error("Additional payment confirmation is required");
  }

  if (!payload.order) {
    throw new Error("Saleor did not return an order");
  }

  return mapOrder(payload.order);
}

function mapCheckout(checkout: SaleorCheckoutNode): NtmsSaleorCheckout {
  return {
    id: checkout.id,
    token: checkout.token,
    email: checkout.email ?? "",
    quantity: checkout.quantity,
    shippingAddress: checkout.shippingAddress
      ? mapAddress(checkout.shippingAddress)
      : null,
    billingAddress: checkout.billingAddress
      ? mapAddress(checkout.billingAddress)
      : null,
    subtotalPrice: checkout.subtotalPrice.gross,
    totalPrice: checkout.totalPrice.gross,
    shippingPrice: checkout.shippingPrice.gross,
    discountPrice:
      checkout.discount ??
      ({
        amount: 0,
        currency: checkout.totalPrice.gross.currency,
      } satisfies SaleorMoney),
    discountName: checkout.discountName ?? "",
    automaticDiscountPrice: {
      amount: 0,
      currency: checkout.totalPrice.gross.currency,
    },
    automaticDiscountNames: [],
    originalSubtotalPrice: checkout.subtotalPrice.gross,
    voucherCode: checkout.voucherCode ?? "",
    selectedShippingMethod: checkout.delivery?.shippingMethod
      ? mapShippingMethod(checkout.delivery.shippingMethod)
      : null,
    shippingMethods: checkout.shippingMethods.map((method) =>
      mapShippingMethod(method),
    ),
    paymentGateways: checkout.availablePaymentGateways.map((gateway) =>
      mapPaymentGateway(gateway),
    ),
    lines: checkout.lines.map((line) => {
      const prod = line.variant.product;
      const imageUrl = prod.thumbnail?.url || "";
      const imageAlt = prod.thumbnail?.alt || prod.name;
      return {
        id: line.id,
        quantity: line.quantity,
        variantId: line.variant.id,
        variantName: line.variant.name,
        sku: line.variant.sku ?? "",
        productName: prod.name,
        productSlug: prod.slug,
        imageUrl,
        imageAlt,
        unitPrice: line.unitPrice.gross,
        totalPrice: line.totalPrice.gross,
        quantityAvailable: line.variant.quantityAvailable ?? null,
      };
    }),
  };
}

async function repriceNtmsSaleorCheckout(
  checkoutId: string,
): Promise<NtmsPricingResponse | null> {
  const url = serverEnv.NTMS_SALEOR_PRICING_URL;
  const secret = serverEnv.NTMS_SALEOR_PRICING_SECRET;
  if (!url && !secret) return null;
  if (!url || !secret) {
    throw new Error("Automatic checkout pricing is not fully configured");
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/api/pricing/checkout/reprice`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-provider-app-secret": secret,
      },
      body: JSON.stringify({ checkoutId }),
      signal: AbortSignal.timeout(8_000),
    },
  );
  const payload = (await response
    .json()
    .catch(() => null)) as NtmsPricingResponse | null;
  if (!response.ok || !payload?.ok || !payload.calculation) {
    throw new Error(`Automatic checkout pricing failed (${response.status})`);
  }
  return payload;
}

function applyNtmsAutomaticPricing(
  checkout: NtmsSaleorCheckout,
  pricing: NtmsPricingResponse,
): NtmsSaleorCheckout {
  const currency = pricing.currency || checkout.subtotalPrice.currency;
  const calculationLines = new Map(
    pricing.calculation.lines?.map((line) => [line.id, line]) ?? [],
  );
  const checkoutLines = new Map(
    pricing.checkout?.lines?.map((line) => [line.id, line]) ?? [],
  );
  const pricedSubtotal =
    pricing.checkout?.subtotalPrice?.gross ??
    ({
      amount: pricing.calculation.pricedSubtotal,
      currency,
    } satisfies SaleorMoney);
  const totalPrice =
    pricing.checkout?.totalPrice?.gross ??
    ({
      amount:
        checkout.totalPrice.amount -
        (checkout.subtotalPrice.amount - pricing.calculation.pricedSubtotal),
      currency,
    } satisfies SaleorMoney);
  return {
    ...checkout,
    subtotalPrice: pricedSubtotal,
    totalPrice,
    automaticDiscountPrice: {
      amount: pricing.calculation.discountTotal,
      currency,
    },
    automaticDiscountNames: pricing.calculation.appliedRules.map(
      (rule) => rule.name,
    ),
    originalSubtotalPrice: {
      amount: pricing.calculation.originalSubtotal,
      currency,
    },
    lines: checkout.lines.map((line) => {
      const calculated = calculationLines.get(line.id);
      const authoritative = checkoutLines.get(line.id);
      return {
        ...line,
        unitPrice:
          authoritative?.unitPrice?.gross ??
          (calculated
            ? { amount: calculated.unitPrice, currency }
            : line.unitPrice),
        totalPrice:
          authoritative?.totalPrice?.gross ??
          (calculated
            ? { amount: calculated.total, currency }
            : line.totalPrice),
      };
    }),
  };
}

function requireRepricedCheckout(checkout: NtmsSaleorCheckout | null) {
  if (!checkout) throw new Error("Saleor checkout no longer exists");
  return checkout;
}

async function initializeNtmsSaleorPaymentAppTransaction({
  amount,
  checkoutId,
  paymentGateway,
}: {
  amount: number;
  checkoutId: string;
  paymentGateway: SaleorPaymentGatewayToInitialize;
}) {
  const data = await saleorFetch<
    SaleorTransactionInitializeResponse,
    {
      amount: number;
      checkoutId: string;
      paymentGateway: SaleorPaymentGatewayToInitialize;
    }
  >({
    query: transactionInitializeMutation,
    variables: {
      amount,
      checkoutId,
      paymentGateway,
    },
  });

  const payload = data.transactionInitialize;
  if (!payload) {
    throw new Error("Saleor did not return a payment transaction");
  }

  if (payload.errors.length > 0) {
    throw new Error(formatCheckoutErrors(payload.errors));
  }

  return payload;
}

function assertStripeCheckoutReady(
  checkout: NtmsSaleorCheckout | null,
): asserts checkout is NtmsSaleorCheckout {
  assertPaymentCheckoutReady(checkout, "entering card details");
}

function assertPaymentCheckoutReady(
  checkout: NtmsSaleorCheckout | null,
  paymentLabel: string,
): asserts checkout is NtmsSaleorCheckout {
  if (!checkout) {
    throw new Error("Saleor checkout no longer exists");
  }

  if (!checkout.selectedShippingMethod) {
    throw new Error(`Select a delivery method before ${paymentLabel}`);
  }

  if (!checkout.shippingAddress || !checkout.billingAddress) {
    throw new Error(`Save delivery details before ${paymentLabel}`);
  }
}

function findStripeGateway(
  checkout: NtmsSaleorCheckout,
  gatewayId: string,
): NtmsSaleorPaymentGateway {
  const gateway = checkout.paymentGateways.find(
    (paymentGateway) => paymentGateway.id === gatewayId,
  );
  if (gateway?.kind !== "stripe" || !gateway.supported) {
    throw new Error("Stripe is not available for this checkout");
  }

  return gateway;
}

function findPayPalGateway(
  checkout: NtmsSaleorCheckout,
  gatewayId: string,
): NtmsSaleorPaymentGateway {
  const gateway = checkout.paymentGateways.find(
    (paymentGateway) => paymentGateway.id === gatewayId,
  );
  if (gateway?.kind !== "paypal" || !gateway.supported) {
    throw new Error("PayPal is not available for this checkout");
  }

  return gateway;
}

function parseNtmsSaleorStripeGatewayConfig(
  gatewayConfigs: SaleorPaymentGatewayInitializeConfig[],
): Pick<NtmsSaleorStripePaymentConfig, "publishableKey"> {
  const data = gatewayConfigs.find((config) => config.data)?.data;
  if (!data || typeof data !== "object") {
    throw new Error("Saleor Stripe app did not return gateway config");
  }

  const payload = data as {
    publishableKey?: unknown;
    stripePublishableKey?: unknown;
  };
  const publishableKey = payload.stripePublishableKey ?? payload.publishableKey;
  if (typeof publishableKey !== "string" || !publishableKey.trim()) {
    throw new Error("Saleor Stripe app did not return a publishable key");
  }

  return {
    publishableKey,
  };
}

function parseNtmsSaleorStripeTransactionData(
  data: SaleorTransactionInitializePayload["data"],
): Omit<NtmsSaleorStripePaymentIntent, "transactionId"> {
  if (!data || typeof data !== "object") {
    throw new Error("Saleor Stripe app did not return payment data");
  }

  const payload = data as {
    paymentIntent?: {
      clientSecret?: unknown;
      client_secret?: unknown;
    };
    stripeClientSecret?: unknown;
  };
  const clientSecret =
    payload.stripeClientSecret ??
    payload.paymentIntent?.clientSecret ??
    payload.paymentIntent?.client_secret;

  if (typeof clientSecret !== "string" || !clientSecret.trim()) {
    throw new Error("Saleor Stripe app did not return a client secret");
  }

  return {
    clientSecret,
  };
}

function parseNtmsSaleorPayPalTransactionData(
  data: SaleorTransactionInitializePayload["data"],
): Omit<NtmsSaleorPayPalPayment, "amount" | "currency" | "transactionId"> {
  const payload = normalizeTransactionData(data);
  const paypalOrderId = payload.paypalOrderId ?? payload.orderId;
  const clientId = payload.clientId ?? payload.paypalClientId;

  if (typeof paypalOrderId !== "string" || !paypalOrderId.trim()) {
    throw new Error("Saleor PayPal app did not return a PayPal order ID");
  }

  if (typeof clientId !== "string" || !clientId.trim()) {
    throw new Error("Saleor PayPal app did not return a client ID");
  }

  return {
    clientId,
    environment:
      typeof payload.environment === "string" && payload.environment.trim()
        ? payload.environment
        : "sandbox",
    orderId: paypalOrderId,
  };
}

function normalizeTransactionData(data: unknown): Record<string, unknown> {
  if (typeof data === "string") {
    try {
      return normalizeTransactionData(JSON.parse(data));
    } catch {
      return {};
    }
  }

  if (!data || typeof data !== "object") {
    return {};
  }

  const payload = data as Record<string, unknown>;
  if (payload.data && typeof payload.data === "object") {
    return {
      ...payload,
      ...(payload.data as Record<string, unknown>),
    };
  }

  return payload;
}

function parseNtmsSaleorLegacyStripeConfirmationData(
  confirmationData: string | null | undefined,
): NtmsSaleorLegacyStripePayment {
  if (!confirmationData) {
    throw new Error("Saleor Stripe did not return confirmation data");
  }

  let payload: {
    client_secret?: unknown;
    id?: unknown;
  };
  try {
    payload = JSON.parse(confirmationData) as typeof payload;
  } catch {
    throw new Error("Saleor Stripe confirmation data is invalid");
  }

  if (
    typeof payload.client_secret !== "string" ||
    !payload.client_secret.trim()
  ) {
    throw new Error("Saleor Stripe did not return a client secret");
  }

  if (typeof payload.id !== "string" || !payload.id.trim()) {
    throw new Error("Saleor Stripe did not return a payment intent id");
  }

  return {
    clientSecret: payload.client_secret,
    paymentIntentId: payload.id,
  };
}

function toStripeMinorAmount(price: SaleorMoney) {
  const zeroDecimalCurrencies = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
  ]);

  return Math.round(
    price.amount *
      (zeroDecimalCurrencies.has(price.currency.toUpperCase()) ? 1 : 100),
  );
}

function mapPaymentGateway(
  gateway: SaleorPaymentGatewayNode,
): NtmsSaleorPaymentGateway {
  const classification = classifyNtmsSaleorPaymentGateway(gateway);
  const availability = getNtmsSaleorPaymentGatewayAvailability(gateway, {
    allowUnsafeGateways: getSaleorAllowUnsafePaymentGateways(),
    enabledProductionGatewayIds: getSaleorEnabledPaymentGatewayIds(),
  });

  return {
    id: gateway.id,
    name: gateway.name,
    currencies: gateway.currencies,
    config: gateway.config ?? [],
    kind: classification.kind,
    productionCandidate: classification.productionCandidate,
    productionCapable: classification.productionCapable,
    productionBlocker: classification.productionBlocker,
    supported: availability.supported,
    supportLabel: availability.supportLabel,
  };
}

function mapOrder(order: SaleorOrderNode): NtmsSaleorOrder {
  return {
    id: order.id,
    number: order.number,
    created: order.created,
    status: order.status,
    statusDisplay: order.statusDisplay,
    isPaid: order.isPaid,
    paymentStatusDisplay: order.paymentStatusDisplay,
    userEmail: order.userEmail ?? "",
    shippingMethodName: order.shippingMethodName ?? "",
    subtotalPrice: order.subtotal.gross,
    shippingPrice: order.shippingPrice.gross,
    totalPrice: order.total.gross,
    lines: order.lines.map((line) => ({
      id: line.id,
      productName: line.productName,
      variantName: line.variantName,
      sku: line.productSku ?? "",
      quantity: line.quantity,
      totalPrice: line.totalPrice.gross,
      imageUrl: line.thumbnail?.url ?? "",
      imageAlt: line.thumbnail?.alt || line.productName,
    })),
  };
}

function mapAddress(address: SaleorAddressNode): NtmsSaleorAddress {
  return {
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    companyName: address.companyName ?? "",
    streetAddress1: address.streetAddress1 ?? "",
    streetAddress2: address.streetAddress2 ?? "",
    city: address.city ?? "",
    cityArea: address.cityArea ?? "",
    postalCode: address.postalCode ?? "",
    countryCode: address.country?.code ?? "US",
    countryName: address.country?.country ?? "",
    countryArea: address.countryArea ?? "",
    phone: address.phone ?? "",
  };
}

function mapShippingMethod(
  method: SaleorShippingMethodNode,
): NtmsSaleorShippingMethod {
  return {
    id: method.id,
    name: method.name,
    description: parseSaleorDescription(method.description),
    price: method.price,
    minimumDeliveryDays: method.minimumDeliveryDays ?? null,
    maximumDeliveryDays: method.maximumDeliveryDays ?? null,
    message: method.message ?? "",
  };
}

function cleanAddressInput(
  address: NtmsSaleorAddressInput,
): SaleorAddressInput {
  return {
    firstName: address.firstName.trim(),
    lastName: address.lastName.trim(),
    companyName: address.companyName?.trim() || undefined,
    streetAddress1: address.streetAddress1.trim(),
    streetAddress2: address.streetAddress2?.trim() || undefined,
    city: address.city.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country,
    countryArea: address.countryArea?.trim() || undefined,
    phone: normalizePhone(address.phone, address.country),
  };
}

function normalizePhone(phone: string | undefined, country: string) {
  const trimmedPhone = phone?.trim();
  if (!trimmedPhone) {
    return undefined;
  }

  if (trimmedPhone.startsWith("+")) {
    return trimmedPhone;
  }

  const digits = trimmedPhone.replace(/\D/g, "");
  if ((country === "US" || country === "CA") && digits.length === 10) {
    return `+1${digits}`;
  }
  if ((country === "US" || country === "CA") && digits.length === 11) {
    return `+${digits}`;
  }

  return trimmedPhone;
}

function parseSaleorDescription(description: string | null | undefined) {
  if (!description) {
    return "";
  }

  try {
    const parsed = JSON.parse(description);
    if (typeof parsed === "string") {
      return parsed;
    }
    return "";
  } catch {
    return description;
  }
}

function formatCheckoutErrors(errors: SaleorCheckoutError[]) {
  return errors
    .map((error) => error.message || error.code)
    .filter(Boolean)
    .join("; ");
}
