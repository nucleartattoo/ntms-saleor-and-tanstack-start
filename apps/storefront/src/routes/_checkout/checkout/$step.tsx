import { createFileRoute, redirect } from "@tanstack/react-router";
import { activeOrderQueryOptions } from "@/hooks/use-active-order";
import {
  availableCountriesQueryOptions,
  checkoutPaymentReadinessQueryOptions,
  eligibleShippingMethodsQueryOptions,
} from "@/hooks/use-checkout-options";
import { createBasicMeta } from "@/lib/metadata";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { checkoutSteps } from "@/lib/vendure/checkout";
import { getCheckoutStepRedirect } from "@/lib/vendure/checkout-flow";

export const Route = createFileRoute("/_checkout/checkout/$step")({
  beforeLoad: ({ params }) => {
    if (isSaleorStorefront) {
      throw redirect({ to: "/checkout" });
    }

    const thisStep = checkoutSteps.find((cs) => cs.identifier === params.step);

    if (!thisStep?.component) {
      throw redirect({ to: "/" });
    }
  },
  loader: async ({ context, params }) => {
    const activeOrder = await context.queryClient.fetchQuery(
      activeOrderQueryOptions(),
    );
    const redirectTo = getCheckoutStepRedirect(activeOrder, params.step);

    if (redirectTo === "home") {
      throw redirect({ to: "/" });
    }

    if (redirectTo) {
      throw redirect({
        to: "/checkout/$step",
        params: { step: redirectTo },
      });
    }

    if (params.step === "addresses") {
      await context.queryClient.ensureQueryData(
        availableCountriesQueryOptions(),
      );
    }

    if (params.step === "shipping") {
      await context.queryClient.fetchQuery(
        eligibleShippingMethodsQueryOptions(),
      );
    }

    if (params.step === "payment") {
      await context.queryClient.fetchQuery(
        checkoutPaymentReadinessQueryOptions(),
      );
    }

    return { stepIdentifier: params.step };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.stepIdentifier) return {};

    const stepIdentifier = loaderData.stepIdentifier;
    const thisStep = checkoutSteps.find(
      (cs) => cs.identifier === stepIdentifier,
    );

    const stepName = thisStep?.title || "Checkout";
    const title = `${stepName} - Checkout`;
    const description = `Complete your purchase. ${stepName} step of our secure checkout process.`;

    return {
      meta: createBasicMeta(title, description, true),
    };
  },
  component: CheckoutStepComponent,
});

function CheckoutStepComponent() {
  const { stepIdentifier } = Route.useLoaderData();
  const thisStep = checkoutSteps.find((cs) => cs.identifier === stepIdentifier);

  return thisStep?.component;
}
