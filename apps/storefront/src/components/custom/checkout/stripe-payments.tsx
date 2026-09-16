import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import { CreditCardIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";

const stripePromises = new Map<string, Promise<Stripe | null>>();

function getStripe(publishableKey: string) {
  const existing = stripePromises.get(publishableKey);

  if (existing) {
    return existing;
  }

  const stripePromise = loadStripe(publishableKey);
  stripePromises.set(publishableKey, stripePromise);

  return stripePromise;
}

export function StripePayments({
  clientSecret,
  orderCode,
  publishableKey,
}: {
  clientSecret: string;
  orderCode: string;
  publishableKey: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <StatusPanel
        title="Loading Stripe payment form"
        description="We are preparing Stripe Elements for this order."
        testId="stripe-payment-status"
      />
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      variables: {
        borderRadius: "8px",
        colorPrimary: "#111827",
      },
    },
  };

  return (
    <Elements stripe={getStripe(publishableKey)} options={options}>
      <StripeCheckoutForm orderCode={orderCode} />
    </Elements>
  );
}

function StripeCheckoutForm({ orderCode }: { orderCode: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation/${orderCode}`,
      },
    });

    if (result.error) {
      setPaymentError(
        result.error.message ||
          "Stripe could not complete the payment. Please review your card details and try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4"
      data-testid="stripe-payment-form"
      onSubmit={handleSubmit}
    >
      <PaymentElement />
      {paymentError ? (
        <StatusPanel
          variant="destructive"
          title="Stripe payment error"
          description={paymentError}
        />
      ) : null}
      <Button
        className="w-full"
        disabled={!stripe || isSubmitting}
        size="lg"
        type="submit"
      >
        <CreditCardIcon />
        {isSubmitting ? "Processing payment..." : "Pay with Stripe"}
      </Button>
    </form>
  );
}
