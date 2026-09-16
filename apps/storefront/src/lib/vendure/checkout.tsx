import { type ComponentType, lazy, type ReactNode, Suspense } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import {
  type CheckoutStepDefinition,
  checkoutStepDefinitions,
} from "./checkout-flow";

export type CheckoutStep = CheckoutStepDefinition & {
  component?: ReactNode;
};

function lazyStepComponent(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);

  return (
    <Suspense
      fallback={
        <StatusPanel
          title="Loading checkout step"
          description="We are preparing the next part of checkout."
        />
      }
    >
      <Component />
    </Suspense>
  );
}

const stepComponents: Partial<Record<string, ReactNode>> = {
  addresses: lazyStepComponent(async () => {
    const module = await import("@/components/custom/checkout/addresses");
    return { default: module.Addresses };
  }),
  shipping: lazyStepComponent(async () => {
    const module = await import("@/components/custom/checkout/shipping");
    return { default: module.Shipping };
  }),
  payment: lazyStepComponent(async () => {
    const module = await import("@/components/custom/checkout/payment");
    return { default: module.Payment };
  }),
};

export const checkoutSteps: CheckoutStep[] = checkoutStepDefinitions.map(
  (step) => ({
    ...step,
    component: stepComponents[step.identifier],
  }),
);
