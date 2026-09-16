import { useRouter } from "@tanstack/react-router";
import {
  CircleCheckIcon,
  CreditCardIcon,
  RotateCcw,
  WalletCardsIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/env/client";
import { useCheckoutPaymentReadiness } from "@/hooks/use-checkout-options";
import { SettlementPayment } from "./settlement-payment";

const StripePayments = lazy(async () => {
  const module = await import("./stripe-payments");
  return { default: module.StripePayments };
});

const PayPalButtons = lazy(async () => {
  const module = await import("./paypal-buttons");
  return { default: module.PayPalButtons };
});

export function Payment() {
  const router = useRouter();
  const paymentReadinessQuery = useCheckoutPaymentReadiness();
  const readiness = paymentReadinessQuery.data;
  const activeOrder = readiness?.activeOrder;
  const paymentMethods = readiness?.eligiblePaymentMethods ?? [];
  const eligibleMethods = paymentMethods.filter((method) => method.isEligible);
  const stripeMethod = eligibleMethods.find((method) =>
    method.code.includes("stripe"),
  );
  const paypalMethod = eligibleMethods.find((method) =>
    method.code.includes("paypal"),
  );
  const settlementMethod = eligibleMethods.find(
    (method) => method.code === "settle-order-without-payment",
  );
  const [selectedPaymentMethodCode, setSelectedPaymentMethodCode] = useState<
    string | undefined
  >();
  const stripePublishableKey = clientEnv.VITE_STRIPE_PUBLISHABLE_KEY;
  const handleBack = () => {
    router.navigate({
      to: "/checkout/$step",
      params: { step: "shipping" },
    });
  };

  const handleRetry = () => {
    void paymentReadinessQuery.refetch();
  };

  useEffect(() => {
    if (
      selectedPaymentMethodCode &&
      eligibleMethods.some(
        (method) => method.code === selectedPaymentMethodCode,
      )
    ) {
      return;
    }

    setSelectedPaymentMethodCode(
      stripeMethod?.code ??
        paypalMethod?.code ??
        settlementMethod?.code ??
        eligibleMethods[0]?.code,
    );
  }, [
    eligibleMethods,
    selectedPaymentMethodCode,
    paypalMethod?.code,
    settlementMethod?.code,
    stripeMethod?.code,
  ]);

  if (paymentReadinessQuery.isLoading) {
    return (
      <StatusPanel
        title="Loading payment methods"
        description="We are checking which payment providers are eligible for this order."
        testId="checkout-payment-loading"
      />
    );
  }

  const stripeReady =
    Boolean(stripeMethod) &&
    Boolean(activeOrder?.code) &&
    Boolean(readiness?.stripePaymentIntent) &&
    Boolean(stripePublishableKey);
  const paypalReady =
    Boolean(paypalMethod) &&
    Boolean(activeOrder?.currencyCode) &&
    Boolean(readiness?.paypalClientId);

  return (
    <div className="space-y-8" data-testid="checkout-payment-section">
      <CommercePageHero
        eyebrow="Checkout"
        title="Payment method"
        description="Select the provider that matches this order. Only eligible methods are shown."
        icon={<CreditCardIcon className="h-5 w-5" />}
        meta={<CommerceSignal>Step 3 of 3</CommerceSignal>}
      />

      {paymentReadinessQuery.isError && (
        <StatusPanel
          variant="destructive"
          title="Failed to load payment methods"
          description="We could not fetch the eligible payment providers."
          testId="checkout-payment-error"
          actions={
            <>
              <Button type="button" variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            </>
          }
        />
      )}

      {!paymentReadinessQuery.isError && eligibleMethods.length === 0 ? (
        <StatusPanel
          title="No payment methods are currently eligible"
          description="This order does not currently have an eligible payment provider."
          actions={
            <>
              <Button type="button" variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-4">
          {eligibleMethods.map((method) => {
            const isSelected = method.code === selectedPaymentMethodCode;
            const isStripeMethod = method.code.includes("stripe");
            const isPayPalMethod = method.code.includes("paypal");
            const isSettlementMethod =
              method.code === "settle-order-without-payment";

            return (
              <section
                key={method.code}
                data-payment-provider={
                  isStripeMethod
                    ? "stripe"
                    : isPayPalMethod
                      ? "paypal"
                      : isSettlementMethod
                        ? "settlement"
                        : method.code
                }
                data-testid="payment-method-card"
                className={`overflow-hidden rounded-2xl border transition ${
                  isSelected
                    ? "border-black/10/24 bg-card/92 shadow-[0_16px_36px_rgba(0,0,0,.08)]"
                    : "border-black/5 bg-card/84"
                }`}
              >
                <button
                  type="button"
                  data-testid={`payment-method-toggle-${
                    isStripeMethod
                      ? "stripe"
                      : isPayPalMethod
                        ? "paypal"
                        : isSettlementMethod
                          ? "settlement"
                          : method.code
                  }`}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left"
                  onClick={() => setSelectedPaymentMethodCode(method.code)}
                  aria-expanded={isSelected}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {isPayPalMethod ? (
                        <WalletCardsIcon className="h-5 w-5 text-foreground/55" />
                      ) : isSettlementMethod ? (
                        <CircleCheckIcon className="h-5 w-5 text-foreground/55" />
                      ) : (
                        <CreditCardIcon className="h-5 w-5 text-foreground/55" />
                      )}
                      <h3 className="font-medium text-foreground">
                        {method.name}
                      </h3>
                    </div>
                    {method.description ? (
                      <p className="mt-2 text-sm text-foreground/60">
                        {method.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </button>

                {isSelected ? (
                  <div className="border-t border-black/5 px-6 py-5">
                    {isStripeMethod ? (
                      <StripePaymentStatus
                        clientSecret={readiness?.stripePaymentIntent}
                        error={readiness?.stripeError}
                        orderCode={activeOrder?.code}
                        publishableKey={stripePublishableKey}
                        ready={stripeReady}
                      />
                    ) : isPayPalMethod ? (
                      <PayPalPaymentStatus
                        clientId={readiness?.paypalClientId}
                        currencyCode={activeOrder?.currencyCode}
                        error={readiness?.paypalError}
                        paymentMethodCode={method.code}
                        ready={paypalReady}
                      />
                    ) : isSettlementMethod ? (
                      <SettlementPayment paymentMethodCode={method.code} />
                    ) : (
                      <StatusPanel
                        title="Payment method integration pending"
                        description="This payment method still needs a dedicated integration."
                      />
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-black/5 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.navigate({
              to: "/checkout/$step",
              params: { step: "shipping" },
            })
          }
        >
          Back
        </Button>
      </div>
    </div>
  );
}

function StripePaymentStatus({
  clientSecret,
  error,
  orderCode,
  publishableKey,
  ready,
}: {
  clientSecret?: string;
  error?: string;
  orderCode?: string;
  publishableKey?: string;
  ready: boolean;
}) {
  if (error) {
    return (
      <StatusPanel
        variant="destructive"
        title="Stripe payment error"
        description={error}
        testId="stripe-payment-status"
      />
    );
  }

  if (!clientSecret) {
    return (
      <StatusPanel
        title="Stripe PaymentIntent is not ready"
        description="The order has not produced a usable payment intent yet."
        testId="stripe-payment-status"
      />
    );
  }

  if (!orderCode) {
    return (
      <StatusPanel
        title="Stripe payment needs an order code"
        description="Stripe PaymentIntent is ready, but the active order code is missing."
        testId="stripe-payment-status"
      />
    );
  }

  if (!publishableKey) {
    return (
      <StatusPanel
        title="Stripe publishable key is missing"
        description="Stripe PaymentIntent is ready, but VITE_STRIPE_PUBLISHABLE_KEY is not configured for this POC."
        testId="stripe-payment-status"
      />
    );
  }

  if (!ready) {
    return (
      <StatusPanel
        title="Stripe is not ready yet"
        description="The payment provider is not fully configured for this order."
        testId="stripe-payment-status"
      />
    );
  }

  return (
    <Suspense
      fallback={
        <StatusPanel
          title="Loading Stripe"
          description="Preparing the secure Stripe payment form."
          testId="stripe-payment-loading"
        />
      }
    >
      <StripePayments
        clientSecret={clientSecret}
        orderCode={orderCode}
        publishableKey={publishableKey}
      />
    </Suspense>
  );
}

function PayPalPaymentStatus({
  clientId,
  currencyCode,
  error,
  paymentMethodCode,
  ready,
}: {
  clientId?: string | null;
  currencyCode?: string;
  error?: string;
  paymentMethodCode: string;
  ready: boolean;
}) {
  if (error) {
    return (
      <StatusPanel
        variant="destructive"
        title="PayPal payment error"
        description={error}
        testId="paypal-payment-status"
      />
    );
  }

  if (!clientId) {
    return (
      <StatusPanel
        title="PayPal client id is missing"
        description="PayPal client id is not configured for this channel."
        testId="paypal-payment-status"
      />
    );
  }

  if (!currencyCode) {
    return (
      <StatusPanel
        title="PayPal currency is missing"
        description="PayPal client configuration is ready, but the active order currency is missing."
        testId="paypal-payment-status"
      />
    );
  }

  if (!ready) {
    return (
      <StatusPanel
        title="PayPal is not ready yet"
        description="The payment provider is not fully configured for this order."
        testId="paypal-payment-status"
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="paypal-payment-status">
      <StatusPanel
        title="PayPal client configuration is ready"
        description="The button flow is available for this order."
      />
      <Suspense
        fallback={
          <StatusPanel
            title="Loading PayPal"
            description="Preparing the PayPal button flow."
            testId="paypal-payment-loading"
          />
        }
      >
        <PayPalButtons
          clientId={clientId}
          currencyCode={currencyCode}
          paymentMethodCode={paymentMethodCode}
        />
      </Suspense>
    </div>
  );
}
