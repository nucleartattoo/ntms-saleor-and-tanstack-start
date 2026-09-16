import { Link } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { ArrowRight, CheckCircle2, MapPin, Package2 } from "lucide-react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { OrderStatusSummary } from "@/components/custom/order/order-status-summary";
import { Button } from "@/components/ui/button";
import { readFragment } from "@/gql/graphql";
import {
  getDeliveryDetail,
  getDeliverySummary,
  getPaymentDetail,
  getPaymentSummary,
} from "@/lib/utils";
import {
  orderAddressFragment,
  orderCustomerFragment,
  orderPaymentFragment,
  orderShippingLineFragment,
} from "@/lib/vendure/fragments/active-order";
import type { orderFragment } from "@/lib/vendure/fragments/order";
import { CartContents } from "./cart-contents";
import { CartTotals } from "./cart-totals";

interface ConfirmationProps {
  order: ResultOf<typeof orderFragment> | null;
}

export function Confirmation({ order }: ConfirmationProps) {
  if (!order) {
    return (
      <StatusPanel
        icon={<Package2 className="h-5 w-5" />}
        title="Order not found"
        description="The confirmation link is no longer available or the order code could not be resolved."
        actions={
          <>
            <Button asChild>
              <Link to="/account/orders">View orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Continue shopping</Link>
            </Button>
          </>
        }
      />
    );
  }

  const payment = order.payments?.[0]
    ? readFragment(orderPaymentFragment, order.payments[0])
    : null;
  const shippingLine = order.shippingLines[0]
    ? readFragment(orderShippingLineFragment, order.shippingLines[0])
    : null;
  const shippingAddress = order.shippingAddress
    ? readFragment(orderAddressFragment, order.shippingAddress)
    : null;
  const customer = order.customer
    ? readFragment(orderCustomerFragment, order.customer)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-2xl border border-black/5 bg-card/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
              Checkout complete
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Order confirmed!
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground/60">
              Your order <span className="font-semibold">{order.code}</span> has
              been received! It is now moving through fulfillment.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs text-foreground/55">
            <CheckCircle2 className="h-4 w-4 text-[#0071e3]" />
            <span>Confirmed</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-card/85 shadow-[0_24px_80px_rgba(0,0,0,.12)]">
        <div className="border-b border-black/5 px-4 py-4 sm:px-6">
          <h3 className="text-lg font-medium text-foreground">Order status</h3>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <OrderStatusSummary
            deliveryDetail={getDeliveryDetail(shippingLine, order.currencyCode)}
            deliverySummary={getDeliverySummary(shippingLine)}
            orderState={order.state}
            paymentDetail={getPaymentDetail(payment)}
            paymentSummary={getPaymentSummary(payment, order.currencyCode)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-card/85 shadow-[0_24px_80px_rgba(0,0,0,.12)]">
        <div className="flex items-center gap-2 border-b border-black/5 px-4 py-4 sm:px-6">
          <Package2 className="h-5 w-5 text-[#0071e3]" />
          <h3 className="text-lg font-medium text-foreground">Order summary</h3>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <CartContents order={order} editable={false} />
        </div>
        <div className="border-t border-black/5 px-4 py-5 sm:px-6">
          <CartTotals order={order} readonly />
        </div>
      </section>

      {(shippingAddress || customer) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {shippingAddress && (
            <section className="overflow-hidden rounded-2xl border border-black/5 bg-card/85 shadow-[0_24px_80px_rgba(0,0,0,.12)]">
              <div className="flex items-center gap-2 border-b border-black/5 px-4 py-4 sm:px-6">
                <MapPin className="h-5 w-5 text-[#0071e3]" />
                <h3 className="text-lg font-medium text-foreground">
                  Shipping address
                </h3>
              </div>
              <div className="space-y-1 px-4 py-5 text-sm text-foreground/75 sm:px-6">
                <p className="font-medium">{shippingAddress.fullName}</p>
                <p>{shippingAddress.streetLine1}</p>
                {shippingAddress.streetLine2 && (
                  <p>{shippingAddress.streetLine2}</p>
                )}
                <p>
                  {shippingAddress.city}
                  {shippingAddress.province && `, ${shippingAddress.province}`}{" "}
                  {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
                {shippingAddress.phoneNumber && (
                  <p className="mt-2">{shippingAddress.phoneNumber}</p>
                )}
              </div>
            </section>
          )}

          {customer && (
            <section className="overflow-hidden rounded-2xl border border-black/5 bg-card/85 shadow-[0_24px_80px_rgba(0,0,0,.12)]">
              <div className="flex items-center gap-2 border-b border-black/5 px-4 py-4 sm:px-6">
                <MapPin className="h-5 w-5 text-[#0071e3]" />
                <h3 className="text-lg font-medium text-foreground">
                  Contact information
                </h3>
              </div>
              <div className="space-y-1 px-4 py-5 text-sm text-foreground/75 sm:px-6">
                <p>
                  {customer.firstName} {customer.lastName}
                </p>
                <p>{customer.emailAddress}</p>
                {customer.phoneNumber && <p>{customer.phoneNumber}</p>}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/account/orders">View orders</Link>
        </Button>
      </div>
    </div>
  );
}
