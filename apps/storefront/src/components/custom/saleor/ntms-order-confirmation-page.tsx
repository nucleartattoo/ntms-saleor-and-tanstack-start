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
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-screen-md">
          <Link
            to="/"
            className="text-sm font-black uppercase text-foreground transition hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <div className="mt-8 border border-black/10/12 bg-card p-8 text-center">
            <PackageCheck className="mx-auto h-9 w-9 text-[#0071e3]" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Order not found
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/58">
              The Saleor order confirmation link is no longer available.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link to="/search">Search products</Link>
              </Button>
              <Button asChild variant="outline">
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
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/68 transition hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <span className="rounded-full border border-black/5 bg-[#f5f5f7] px-3.5 py-1 text-xs font-semibold tracking-tight text-[#0071e3]">
            Confirmation
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/5 px-6 py-6">
            <div className="flex items-center gap-2 text-[#0071e3]">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Order confirmed
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Order #{order.number}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/58">
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

          <div className="border-t border-black/5 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
              <ReceiptText className="h-4 w-4" />
              Items
            </h2>
            <ul className="mt-4 space-y-3">
              {order.lines.map((line) => (
                <li
                  className="flex gap-3 rounded-2xl border border-black/5 bg-[#f5f5f7]/60 p-4"
                  key={line.id}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-white">
                    {line.imageUrl ? (
                      <img
                        alt={line.imageAlt}
                        className="h-full w-full object-contain p-1.5"
                        src={line.imageUrl}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">
                      {line.productName}
                    </p>
                    <p className="mt-1 text-xs text-foreground/45">
                      Qty {line.quantity}
                      {line.sku ? ` - SKU ${line.sku}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#0071e3]">
                    {formatSaleorMoney(line.totalPrice)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="sticky top-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/5 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
              Receipt
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {order.userEmail || "Guest order"}
            </h2>
          </div>
          <div className="p-6">
            <SummaryRow label="Subtotal" price={order.subtotalPrice} />
            <SummaryRow label="Shipping" price={order.shippingPrice} />
            <div className="mt-3 flex items-center justify-between border-t border-black/10/10 pt-3">
              <p className="font-semibold">Total</p>
              <p className="text-2xl font-semibold text-[#0071e3]">
                {formatSaleorMoney(order.totalPrice)}
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              <Button asChild>
                <Link to="/">Continue shopping</Link>
              </Button>
              <Button asChild variant="outline">
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
    <div className="rounded-2xl border border-black/5 bg-[#f5f5f7] p-4.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
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
    <div className="mb-2 flex items-center justify-between text-sm text-foreground/58">
      <p>{label}</p>
      <p>{formatSaleorMoney(price)}</p>
    </div>
  );
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}
