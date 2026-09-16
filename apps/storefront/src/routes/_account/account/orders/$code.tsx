import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Download,
  Hash,
  MapPinned,
  Package2,
  ReceiptText,
  Truck,
} from "lucide-react";
import { OrderStatusSummary } from "@/components/custom/order/order-status-summary";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/env/client";
import { orderByCodeQueryOptions, useOrderByCode } from "@/hooks/use-orders";
import {
  type AccountOrder,
  type AccountOrderAddress,
  formatSaleorCurrency,
} from "@/lib/account-types";
import { createBasicMeta } from "@/lib/metadata";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";

export const Route = createFileRoute("/_account/account/orders/$code")({
  loader: async ({ context, params: { code } }) => {
    const order = await context.queryClient.ensureQueryData(
      orderByCodeQueryOptions(code),
    );

    if (!order) {
      throw notFound();
    }

    return { order };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.order) return {};

    const order = loaderData.order;
    const description = `View details for order #${order.code} placed on ${formatDate(order.createdAt)}. Total: ${formatAccountOrderCurrency(order, order.totalWithTax)}. Status: ${order.stateLabel}.`;

    return {
      meta: createBasicMeta(`Order #${order.code}`, description, true),
    };
  },
  component: OrderDetailComponent,
});

function OrderDetailComponent() {
  const { code } = Route.useParams();
  const { order: loaderOrder } = Route.useLoaderData();
  const orderQuery = useOrderByCode(code);
  const order = orderQuery.data === undefined ? loaderOrder : orderQuery.data;

  if (!order) {
    throw notFound();
  }

  return (
    <div className="space-y-6 py-6">
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/5 px-6 py-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-fit rounded-full px-3 py-1 text-xs font-semibold text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition"
          >
            <Link to="/account/orders">
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
              Order receipt
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Order #{order.code}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-[#f5f5f7] px-3.5 py-1 text-xs text-[#86868b]">
                <CalendarDays className="h-3.5 w-3.5" />
                Placed {formatDate(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-[#f5f5f7] px-3.5 py-1 text-xs text-[#86868b]">
                <Package2 className="h-3.5 w-3.5" />
                {order.totalQuantity}{" "}
                {order.totalQuantity === 1 ? "item" : "items"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-[#f5f5f7] px-3.5 py-1 text-xs text-[#86868b]">
                <Hash className="h-3.5 w-3.5" />
                Updated {formatDate(order.updatedAt)}
              </span>
            </div>
          </div>
          <div className="px-5 pb-5 sm:px-6 lg:pb-6">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${getOrderStatusColor(order.state)}`}
            >
              {order.stateLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-5 sm:px-6">
          <OrderStatusSummary
            deliveryDetail={getAccountDeliveryDetail(order)}
            deliverySummary={getAccountDeliverySummary(order)}
            orderState={order.stateLabel}
            paymentDetail={order.paymentState}
            paymentSummary={getAccountPaymentSummary(order)}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 border-b border-black/5 px-6 py-4">
              <Package2 className="h-5 w-5 text-[#0071e3]" />
              <h2 className="text-lg font-medium text-foreground">
                Order Items
              </h2>
            </div>
            <ul className="divide-y divide-black/5">
              {order.lines.map((line) => {
                return (
                  <li key={line.id} className="px-5 py-4 sm:px-6">
                    <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:items-center">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-[#f5f5f7]">
                        {line.thumbnailUrl ? (
                          <Image
                            src={line.thumbnailUrl}
                            alt={line.thumbnailAlt || line.productName}
                            width={96}
                            height={96}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/35">
                            {clientEnv.VITE_SITE_NAME.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {line.productSlug ? (
                          <Link
                            to="/product/$productId"
                            params={{ productId: line.productSlug }}
                            className="line-clamp-2 text-sm font-semibold text-foreground transition hover:text-[#0071e3]"
                          >
                            {line.variantName || line.productName}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">
                            {line.variantName || line.productName}
                          </p>
                        )}
                        {line.productName !== line.variantName ? (
                          <p className="mt-1 line-clamp-2 text-sm text-foreground/55">
                            {line.productName}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-black/5 bg-[#f5f5f7] px-3 py-1 text-xs text-[#86868b]">
                            SKU {line.sku || "N/A"}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-black/5 bg-[#f5f5f7] px-3 py-1 text-xs text-[#86868b]">
                            Qty {line.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-base font-semibold text-foreground">
                          {formatAccountOrderCurrency(order, line.linePrice)}
                        </p>
                        <p className="text-sm text-foreground/55">
                          {formatAccountOrderCurrency(order, line.unitPrice)}{" "}
                          each
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {order.shippingAddress && (
            <AddressPanel
              address={order.shippingAddress}
              icon={<MapPinned className="h-5 w-5" />}
              title="Shipping address"
            />
          )}
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 border-b border-black/5 px-6 py-4">
              <Truck className="h-5 w-5 text-[#0071e3]" />
              <h2 className="text-lg font-medium text-foreground">
                Fulfillment
              </h2>
            </div>
            <div className="grid gap-3 px-5 py-5 sm:px-6">
              <InfoTile
                icon={<Truck className="h-4 w-4" />}
                label="Delivery"
                value={getAccountDeliverySummary(order)}
                detail={getAccountDeliveryDetail(order)}
              />
              <InfoTile
                icon={<CreditCard className="h-4 w-4" />}
                label="Payment"
                value={getAccountPaymentSummary(order)}
                detail={order.paymentState}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 border-b border-black/5 px-6 py-4">
              <ReceiptText className="h-5 w-5 text-[#0071e3]" />
              <h2 className="text-lg font-medium text-foreground">
                Order Summary
              </h2>
            </div>
            <dl className="divide-y divide-black/5">
              <SummaryRow
                label="Subtotal"
                value={formatAccountOrderCurrency(order, order.subTotalWithTax)}
              />
              {order.discountWithTax !== 0 ? (
                <SummaryRow
                  label="Discounts"
                  value={`-${formatAccountOrderCurrency(order, Math.abs(order.discountWithTax))}`}
                />
              ) : null}
              <SummaryRow
                label="Shipping"
                value={formatAccountOrderCurrency(order, order.shippingWithTax)}
              />
              <SummaryRow
                label="Total"
                value={formatAccountOrderCurrency(order, order.totalWithTax)}
                strong
              />
            </dl>
          </section>

          {order.invoices.length > 0 ? (
            <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-black/5 px-6 py-4">
                <ReceiptText className="h-5 w-5 text-[#0071e3]" />
                <h2 className="text-lg font-medium text-foreground">
                  Invoices
                </h2>
              </div>
              <div className="space-y-3 px-5 py-5 sm:px-6">
                {order.invoices.map((invoice) => (
                  <a
                    key={invoice.id}
                    href={invoice.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-[#f5f5f7] px-4 py-3.5 text-sm font-semibold text-[#1d1d1f] rounded-2xl transition hover:bg-[#0071e3]/5 hover:text-[#0071e3]"
                  >
                    <span className="min-w-0 truncate">{invoice.number}</span>
                    <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {order.billingAddress && (
            <AddressPanel
              address={order.billingAddress}
              icon={<MapPinned className="h-5 w-5" />}
              title="Billing address"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatAccountOrderCurrency(order: AccountOrder, amount: number) {
  return order.isSaleor
    ? formatSaleorCurrency(amount, order.currencyCode)
    : formatCurrency(amount, order.currencyCode);
}

function getAccountPaymentSummary(order: AccountOrder) {
  return order.paymentState || "Payment not recorded";
}

function getAccountDeliverySummary(order: AccountOrder) {
  return order.shippingMethodName || "Shipping not recorded";
}

function getAccountDeliveryDetail(order: AccountOrder) {
  if (!order.shippingMethodName) {
    return undefined;
  }

  return formatAccountOrderCurrency(order, order.shippingWithTax);
}

function AddressPanel({
  address,
  icon,
  title,
}: {
  address: AccountOrderAddress;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4 text-[#0071e3] sm:px-6">
        {icon}
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
      </div>
      <div className="space-y-1 px-5 py-5 text-sm text-foreground/75 sm:px-6">
        <p className="font-medium text-foreground">{address.fullName}</p>
        <p>{address.streetLine1}</p>
        {address.streetLine2 ? <p>{address.streetLine2}</p> : null}
        <p>
          {address.city}, {address.province} {address.postalCode}
        </p>
        <p>{address.country}</p>
        {address.phoneNumber ? (
          <p className="mt-2 text-foreground/58">{address.phoneNumber}</p>
        ) : null}
      </div>
    </section>
  );
}

function InfoTile({
  detail,
  icon,
  label,
  value,
}: {
  detail?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#f5f5f7] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[#0071e3]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-white text-[#0071e3] shadow-sm">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
      {detail ? (
        <p className="mt-1 text-sm text-foreground/55">{detail}</p>
      ) : null}
    </div>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 sm:px-6">
      <dt
        className={
          strong
            ? "text-base font-semibold text-foreground"
            : "text-sm font-medium text-foreground/55"
        }
      >
        {label}
      </dt>
      <dd
        className={
          strong
            ? "text-base font-semibold text-[#0071e3]"
            : "text-sm font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
