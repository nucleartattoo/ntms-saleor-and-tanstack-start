import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Package2, PackageOpen, ReceiptText } from "lucide-react";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { Button } from "@/components/ui/button";
import { orderHistoryQueryOptions, useOrderHistory } from "@/hooks/use-orders";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_account/account/orders/")({
  loader: async ({ context }) => {
    const ordersResult = await context.queryClient.ensureQueryData(
      orderHistoryQueryOptions(),
    );

    return {
      orders: ordersResult.items,
    };
  },
  head: ({ loaderData }) => {
    const ordersCount = loaderData?.orders?.length || 0;
    const description =
      ordersCount > 0
        ? `View your ${ordersCount} ${ordersCount === 1 ? "order" : "orders"}. Track shipments, view order details, and manage returns.`
        : "Your order history. Start shopping to see your orders here.";

    return {
      meta: createBasicMeta("Order History", description, true),
    };
  },
  component: AccountOrdersComponent,
});

function AccountOrdersComponent() {
  const { orders: loaderOrders } = Route.useLoaderData();
  const ordersQuery = useOrderHistory();
  const orders = ordersQuery.data?.items ?? loaderOrders;
  const orderCount = orders.length;

  return (
    <div className="space-y-6">
      <CommercePageHero
        eyebrow="Account Overview"
        title="Order History"
        description="Track live shipments, review receipts, and view order details."
        meta={
          <CommerceSignal
            icon={<Package2 className="h-3.5 w-3.5 text-[#0071e3]" />}
          >
            {orderCount} {orderCount === 1 ? "order" : "orders"}
          </CommerceSignal>
        }
      />

      {orderCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-black/5 bg-white p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] sm:p-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f5f5f7] text-[#0071e3] shadow-inner transition-transform duration-500 hover:scale-105">
            <PackageOpen className="h-9 w-9 text-[#0071e3]" />
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-tight text-[#1d1d1f] sm:text-2xl">
            No Orders Yet
          </h2>
          <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-[#86868b]">
            Your completed studio hardware and supply orders will appear here
            with live tracking numbers and PDF invoices.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-11 rounded-full bg-[#0071e3] px-8 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0077ed] hover:scale-105 active:scale-95"
            >
              <Link to="/">
                <span>Start Shopping</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border border-black/10 bg-white px-7 text-xs sm:text-sm font-semibold text-[#1d1d1f] shadow-sm transition hover:bg-[#f5f5f7]"
            >
              <Link to="/search">Search Products</Link>
            </Button>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
            <div className="flex items-center gap-2 text-[#0071e3]">
              <ReceiptText className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1d1d1f]">
                Recent Orders
              </h2>
            </div>
            <span className="rounded-full border border-black/5 bg-[#f5f5f7] px-3.5 py-1 text-xs font-medium text-[#86868b]">
              Live Records
            </span>
          </div>
          <ul className="divide-y divide-black/[0.06]">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to="/account/orders/$code"
                  params={{ code: order.code }}
                  className="block px-6 py-5 transition hover:bg-[#f5f5f7]/60"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1d1d1f]">
                          Order #{order.code}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
