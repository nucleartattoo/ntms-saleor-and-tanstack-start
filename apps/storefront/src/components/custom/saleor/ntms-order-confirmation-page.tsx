import { Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NtmsSaleorOrder } from "@/lib/saleor/checkout";

export function NtmsSaleorOrderConfirmationPage({
  order,
}: {
  order: NtmsSaleorOrder | null;
}) {
  if (!order) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-12 text-[#1d1d1f]">
        <div className="mx-auto max-w-screen-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-[#1d1d1f] transition-colors hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <PackageCheck className="mx-auto h-9 w-9 text-[#0071e3]" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1d1d1f]">
              Order not found
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e6e73]">
              The Saleor order confirmation link is no longer available.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]"
              >
                <Link to="/search">Search products</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-black/[0.1] px-6"
              >
                <Link to="/">Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl saturate-150">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="text-sm font-bold tracking-tight text-[#1d1d1f] transition-colors hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <span className="rounded-full border border-black/[0.06] bg-[#f5f5f7] px-3.5 py-1 text-xs font-semibold tracking-tight text-[#0071e3]">
            Confirmation
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <section className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.06] px-6 py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Order confirmed</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
              Order #{order.number}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6e73]">
              Your checkout was accepted and your order has been created.
            </p>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-3">
            <Metric label="Status" value={order.statusDisplay} />
            <Metric label="Payment" value={order.paymentStatusDisplay} />
            <Metric
              label="Delivery"
              value={order.shippingMethodName || "Pending"}
            />
          </div>

          <div className="border-t border-black/[0.06] p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[#1d1d1f]">
              <ReceiptText className="h-4 w-4 text-[#0071e3]" />
              Items
            </h2>
            <ul className="mt-4 space-y-3">
              {order.lines.map((line) => (
                <li
                  className="flex gap-3.5 rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4"
                  key={line.id}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                    {line.imageUrl ? (
                      <img
                        alt={line.imageAlt}
                        className="h-full w-full object-contain p-1.5"
                        src={line.imageUrl}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-[#1d1d1f]">
                      {line.productName}
                    </p>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      Qty {line.quantity}
                      {line.sku ? ` - SKU ${line.sku}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#1d1d1f]">
                    {formatSaleorMoney(line.totalPrice)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="sticky top-20 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.06] px-6 py-5">
            <p className="text-xs font-semibold text-[#6e6e73]">Receipt</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1f]">
              {order.userEmail || "Guest order"}
            </h2>
          </div>
          <div className="p-6">
            <SummaryRow label="Subtotal" price={order.subtotalPrice} />
            <SummaryRow label="Shipping" price={order.shippingPrice} />
            <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-4">
              <p className="font-semibold text-[#1d1d1f]">Total</p>
              <p className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                {formatSaleorMoney(order.totalPrice)}
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <Button
                asChild
                className="h-11 rounded-full bg-[#0071e3] font-semibold text-white hover:bg-[#0077ed]"
              >
                <Link to="/">Continue shopping</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-black/[0.1] font-semibold"
              >
                <Link to="/search">Search products</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-bold text-[#1d1d1f]">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  price,
}: {
  label: string;
  price: { amount: number; currency: string };
}) {
  return (
    <div className="mb-2 flex items-center justify-between text-sm text-[#6e6e73]">
      <p>{label}</p>
      <p className="font-medium text-[#1d1d1f]">{formatSaleorMoney(price)}</p>
    </div>
  );
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}
