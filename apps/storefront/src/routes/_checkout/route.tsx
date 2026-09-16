import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import {
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/components/custom/cart/cart-context";
import { CartContents } from "@/components/custom/checkout/cart-contents";
import { CartTotals } from "@/components/custom/checkout/cart-totals";
import { CommerceSignal } from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import LogoSquare from "@/components/custom/logo-square";
import { NtmsSaleorCheckoutPage } from "@/components/custom/saleor/ntms-checkout-page";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/env/client";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_checkout")({
  component: CheckoutLayoutComponent,
});

function CheckoutLayoutComponent() {
  const matchRoute = useMatchRoute();

  if (isSaleorStorefront) {
    const isConfirmation = !!matchRoute({ to: "/checkout/confirmation/$code" });
    return isConfirmation ? <Outlet /> : <NtmsSaleorCheckoutPage />;
  }

  return <VendureCheckoutLayout />;
}

function VendureCheckoutLayout() {
  const { VITE_SITE_NAME } = clientEnv;
  const { cart: activeOrder } = useCart();
  const matchRoute = useMatchRoute();
  const isConfirmation = !!matchRoute({ to: "/checkout/confirmation/$code" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/10/14 bg-background/82 px-4 py-3 backdrop-blur-2xl lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-full border border-black/10/12 bg-card/75 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,.08)] transition hover:border-black/10/22 hover:bg-card/90"
          >
            <LogoSquare />
            <div className="text-sm font-medium uppercase tracking-[0.16em]">
              {VITE_SITE_NAME}
            </div>
          </Link>
          <div className="hidden text-xs uppercase tracking-[0.22em] text-foreground/55 md:block">
            Secure checkout
          </div>
        </div>
      </header>
      <div
        className={cn(
          "mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 sm:py-8 lg:px-8",
          !isConfirmation && "lg:grid-cols-[minmax(0,1fr)_400px]",
        )}
      >
        <div className="min-w-0 space-y-6">
          <Outlet />
        </div>
        {!isConfirmation && (
          <aside className="relative min-w-0 self-start overflow-hidden rounded-2xl border border-black/10/16 bg-card/92 p-5 shadow-[0_24px_75px_rgba(0,0,0,.12)] backdrop-blur-xl lg:sticky lg:top-24">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/75 to-transparent" />
            <div className="mb-5 border-b border-black/10/10 pb-4">
              <div className="flex items-center gap-2 text-[#0071e3]">
                <ReceiptText className="h-4 w-4" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Order Summary
                </h2>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Checkout review
              </p>
              {activeOrder && "id" in activeOrder ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <CommerceSignal>
                    {activeOrder.totalQuantity} item
                    {activeOrder.totalQuantity === 1 ? "" : "s"}
                  </CommerceSignal>
                  <CommerceSignal>Order {activeOrder.code}</CommerceSignal>
                </div>
              ) : null}
            </div>
            {activeOrder ? (
              <>
                <CartContents order={activeOrder} editable={false} />
                <CartTotals order={activeOrder} readonly />
                <div className="mt-4 grid gap-2 border-t border-black/10/10 pt-4 text-xs leading-5 text-foreground/48">
                  <p className="flex items-center gap-2">
                    <LockKeyhole className="h-3.5 w-3.5 text-[#0071e3]" />
                    Payment details stay on the secure checkout step.
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0071e3]" />
                    Totals come from the live Vendure order.
                  </p>
                </div>
              </>
            ) : (
              <StatusPanel
                icon={<ShoppingCart className="h-5 w-5" />}
                title="Your cart is empty"
                description="Add products to start checkout."
                actions={
                  <>
                    <Button asChild variant="outline">
                      <Link to="/search">Search products</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/">Browse catalog</Link>
                    </Button>
                  </>
                }
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
