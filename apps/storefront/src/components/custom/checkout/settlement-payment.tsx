import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CircleCheckIcon } from "lucide-react";
import { useState } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";
import { refreshStorefrontState } from "@/hooks/use-active-order";
import { submitSettlementPayment } from "@/lib/vendure";

export function SettlementPayment({
  paymentMethodCode,
}: {
  paymentMethodCode: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setPaymentError(null);

    const result = await submitSettlementPayment({
      data: { paymentMethodCode },
    });

    if (result.type === "confirmation") {
      await router.navigate({
        to: "/checkout/confirmation/$code",
        params: { code: result.orderCode },
      });
      await refreshStorefrontState({
        queryClient,
        router,
        invalidateRouter: false,
      });
      return;
    }

    setPaymentError(
      result.type === "error" ? result.message : "Settlement payment failed.",
    );
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-4" data-testid="settlement-payment-status">
      <StatusPanel
        title="Settlement payment"
        description="This order is eligible to be settled without collecting an online payment."
      />

      {paymentError ? (
        <StatusPanel
          variant="destructive"
          title="Settlement payment error"
          description={paymentError}
        />
      ) : null}

      <Button
        className="w-full"
        disabled={isSubmitting}
        size="lg"
        type="button"
        onClick={() => {
          void handleSubmit();
        }}
      >
        <CircleCheckIcon />
        {isSubmitting ? "Submitting..." : "Complete order"}
      </Button>
    </div>
  );
}
