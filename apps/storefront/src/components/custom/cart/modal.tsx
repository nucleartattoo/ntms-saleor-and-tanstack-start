import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  LockKeyhole,
  PackageCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { CartItem } from "@/components/custom/cart/cart-item";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import Price from "@/components/custom/price";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCheckoutSteps } from "@/lib/vendure/checkout-flow";
import { useCart } from "./cart-context";
import CloseCart from "./close-cart";
import OpenCart from "./open-cart";

export default function CartModal() {
  const { cart, closeCart, isCartOpen, openCart } = useCart();
  const hasActiveCart = cart && "id" in cart && cart.lines.length > 0;

  return (
    <>
      <button type="button" aria-label="Open cart" onClick={openCart}>
        <OpenCart
          quantity={
            cart && "totalQuantity" in cart ? cart.totalQuantity : undefined
          }
        />
      </button>

      <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="fixed inset-0 bg-black/65 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all ease-in-out duration-300 data-[state=open]:backdrop-blur-[2px] data-[state=closed]:backdrop-blur-none"
          className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col gap-0 border-l border-black/5 bg-white/95 p-0 text-[#1d1d1f] shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl md:w-[440px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right transition-all ease-in-out duration-300 sm:max-w-none"
        >
          <div className="border-b border-black/5 bg-white/80 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
                    Cart
                  </p>
                  {hasActiveCart ? (
                    <span className="rounded-full border border-[color:var(--apple-blue)]/18 bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-foreground/58">
                      {cart.totalQuantity} item
                      {cart.totalQuantity === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <SheetTitle className="mt-2 text-2xl font-semibold tracking-tight">
                  Studio order
                </SheetTitle>
                <p className="mt-2 max-w-xs text-sm leading-5 text-foreground/52">
                  Review quantities and confirm the live checkout total before
                  payment.
                </p>
              </div>
              <SheetClose asChild>
                <button type="button" aria-label="Close cart">
                  <CloseCart />
                </button>
              </SheetClose>
            </div>
            <SheetDescription className="sr-only">
              Review and manage items in your shopping cart
            </SheetDescription>
          </div>

          {!cart || !("id" in cart) || cart.lines.length === 0 ? (
            <div className="px-5 pt-5 sm:px-6">
              <StatusPanel
                icon={<ShoppingCart className="h-5 w-5" />}
                title="Your cart is empty"
                description="Browse products or open checkout once items have been added."
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
            </div>
          ) : cart && "id" in cart ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
              <ul className="min-h-0 grow space-y-3 overflow-auto py-4 pr-1">
                {cart.lines.map((item) => {
                  return (
                    <CartItem
                      cart={cart}
                      key={item.id}
                      item={item}
                      closeCart={closeCart}
                    />
                  );
                })}
              </ul>
              <div className="rounded-3xl border border-black/5 bg-[#f5f5f7] p-5 text-sm text-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="mb-3 flex items-center gap-2 border-b border-black/5 pb-3">
                  <Sparkles className="h-4 w-4 text-[#0071e3]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                    Order total
                  </p>
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-2">
                  <p>Subtotal</p>
                  <Price
                    className="text-right font-medium text-foreground"
                    amount={cart.subTotalWithTax}
                    currencyCode={cart.currencyCode}
                    currencyCodeClassName="text-foreground/40"
                  />
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-2 pt-1">
                  <p>Estimated tax</p>
                  <Price
                    className="text-right font-medium text-foreground"
                    amount={cart.totalWithTax - cart.total}
                    currencyCode={cart.currencyCode}
                    currencyCodeClassName="text-foreground/40"
                  />
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-2 pt-1">
                  <p>Shipping</p>
                  <p className="text-right">Calculated at checkout</p>
                </div>
                <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-3 pt-1">
                  <p className="font-medium text-foreground">Total</p>
                  <Price
                    className="text-right text-xl font-semibold text-[#0071e3]"
                    amount={cart.totalWithTax}
                    currencyCode={cart.currencyCode}
                    currencyCodeClassName="text-xs text-foreground/42"
                  />
                </div>
                <div className="grid gap-2 text-xs text-foreground/45">
                  <p className="flex items-center gap-2">
                    <PackageCheck className="h-3.5 w-3.5 text-[#0071e3]" />
                    Inventory and shipping are finalized at checkout.
                  </p>
                  <p className="flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-[color:var(--apple-blue)]" />
                    Order updates stay synced to this session.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <SheetClose asChild>
                  <CheckoutButton />
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/search"
                    className="mt-3 flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                  >
                    Continue shopping
                  </Link>
                </SheetClose>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CheckoutButton() {
  const checkoutSteps = getCheckoutSteps();

  return (
    <Link
      to="/checkout/$step"
      params={{ step: checkoutSteps.at(0)?.identifier ?? "addresses" }}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0077ed]"
    >
      <LockKeyhole className="h-4 w-4" />
      Checkout
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
