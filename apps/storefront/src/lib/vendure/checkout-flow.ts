import type { ResultOf } from "gql.tada";
import { readFragment } from "@/gql/graphql";
import type activeOrderFragment from "@/lib/vendure/fragments/active-order";
import { orderAddressFragment } from "@/lib/vendure/fragments/active-order";

export type CheckoutStepDefinition = {
  title?: string;
  identifier: string;
  validate: (order: ResultOf<typeof activeOrderFragment>) => boolean;
};

export const checkoutStepDefinitions: CheckoutStepDefinition[] = [
  {
    title: "Addresses",
    identifier: "addresses",
    validate: (order) => {
      return !!order.billingAddress && !!order.shippingAddress;
    },
  },
  {
    title: "Shipping",
    identifier: "shipping",
    validate: (order) => {
      return !!order.shippingLines && order.shippingLines.length > 0;
    },
  },
  {
    title: "Payment",
    identifier: "payment",
    validate: (order) => {
      return !!order.payments && order.payments.length > 0;
    },
  },
  {
    title: "Summary",
    identifier: "summary",
    validate: (order) => {
      return !!(
        order.billingAddress &&
        order.shippingAddress &&
        order.shippingLines?.length &&
        order.customer
      );
    },
  },
];

export type CheckoutStepRedirect = "home" | "addresses" | "shipping";

function hasCheckoutAddress(
  order: ResultOf<typeof activeOrderFragment> | null | undefined,
) {
  const shippingAddress = readFragment(
    orderAddressFragment,
    order?.shippingAddress,
  );

  return Boolean(
    shippingAddress?.streetLine1 &&
      shippingAddress.city &&
      shippingAddress.postalCode &&
      shippingAddress.country,
  );
}

function hasShippingMethod(
  order: ResultOf<typeof activeOrderFragment> | null | undefined,
) {
  return Boolean(order?.shippingLines && order.shippingLines.length > 0);
}

export function getCheckoutStepRedirect(
  order: ResultOf<typeof activeOrderFragment> | null | undefined,
  targetStep: string,
): CheckoutStepRedirect | null {
  if (!order || order.lines.length === 0) {
    return "home";
  }

  if (
    (targetStep === "shipping" || targetStep === "payment") &&
    !hasCheckoutAddress(order)
  ) {
    return "addresses";
  }

  if (targetStep === "payment" && !hasShippingMethod(order)) {
    return "shipping";
  }

  return null;
}

export function getCheckoutSteps(
  currentStep: string | undefined = undefined,
): Array<CheckoutStepDefinition & { active: boolean; done: boolean }> {
  return checkoutStepDefinitions.map((step) => {
    return {
      ...step,
      active: step.identifier === currentStep,
      done:
        checkoutStepDefinitions.findIndex(
          (item) => item.identifier === currentStep,
        ) >
        checkoutStepDefinitions.findIndex(
          (item) => item.identifier === step.identifier,
        ),
    };
  });
}
