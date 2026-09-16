import { StatusPanel } from "@/components/custom/layout/status-panel";
import { getOrderStatusColor } from "@/lib/utils";

type OrderStatusSummaryProps = {
  compact?: boolean;
  deliveryDetail?: string;
  deliverySummary: string;
  orderState: string;
  paymentDetail?: string;
  paymentSummary: string;
};

export function OrderStatusSummary({
  compact = false,
  deliveryDetail,
  deliverySummary,
  orderState,
  paymentDetail,
  paymentSummary,
}: OrderStatusSummaryProps) {
  if (compact) {
    return (
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/55">
        <div>
          <dt className="sr-only">Payment</dt>
          <dd>{paymentSummary}</dd>
        </div>
        <div>
          <dt className="sr-only">Shipping</dt>
          <dd>{deliverySummary}</dd>
        </div>
      </dl>
    );
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-3"
      data-testid="order-status-summary"
    >
      <StatusPanel
        size="compact"
        eyebrow="Order status"
        title="Current state"
        description={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusColor(orderState)}`}
          >
            {orderState}
          </span>
        }
        className="min-h-[110px]"
      />
      <StatusPanel
        size="compact"
        eyebrow="Payment"
        title={paymentSummary}
        description={paymentDetail || "Payment information is available here."}
        className="min-h-[110px]"
      />
      <StatusPanel
        size="compact"
        eyebrow="Delivery"
        title={deliverySummary}
        description={
          deliveryDetail || "Delivery information is available here."
        }
        className="min-h-[110px]"
      />
    </div>
  );
}
