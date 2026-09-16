import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NtmsSaleorCartLine } from "@/lib/saleor/checkout";
import { cn } from "@/lib/utils";
import { useSaleorCart } from "./ntms-cart-context";
import { NtmsSaleorPromoCode } from "./ntms-promo-code";

export function NtmsSaleorCartDrawer() {
  const {
    checkout,
    clearCartSession,
    closeCart,
    isCartOpen,
    isLoading,
    isMutating,
    removeLine,
    updateLine,
  } = useSaleorCart();
  const quantity = checkout?.quantity ?? 0;
  const hasLines = Boolean(checkout && checkout.lines.length > 0);

  const subtotalAmount = checkout?.originalSubtotalPrice?.amount ?? 0;
  const freeShippingThreshold = 150;
  const amountToFreeShipping = Math.max(
    0,
    freeShippingThreshold - subtotalAmount,
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalAmount / freeShippingThreshold) * 100),
  );

  const handleUpdateLine = async (
    line: NtmsSaleorCartLine,
    quantity: number,
  ) => {
    try {
      await updateLine({ lineId: line.id, quantity });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update item",
      );
    }
  };

  const handleRemoveLine = async (line: NtmsSaleorCartLine) => {
    try {
      await removeLine(line.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove item",
      );
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
        className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full flex-col gap-0 border-l border-black/[0.06] bg-[#fbfbfd] p-0 text-[#1d1d1f] shadow-2xl md:w-[480px] sm:max-w-none antialiased"
        data-saleor-cart-drawer
      >
        {/* Apple Style Header */}
        <div className="border-b border-black/[0.06] bg-white/80 px-6 py-5 backdrop-blur-2xl saturate-150 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#1d1d1f]">
                <ShoppingBag className="h-5 w-5 text-[#1d1d1f]" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                  Review Your Bag
                </SheetTitle>
                <p className="text-[12px] font-medium text-[#86868b]">
                  {quantity > 0
                    ? `${quantity} ${quantity === 1 ? "item" : "items"} in order`
                    : "Your bag is currently empty"}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close cart"
              onClick={closeCart}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition-[transform,background-color] duration-160 ease-out hover:bg-[#e8e8ed] [@media(hover:hover)]:hover:scale-[1.04] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {hasLines ? (
            <div className="mt-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.04] p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                <span className="flex items-center gap-1.5 text-[#1d1d1f]">
                  <Truck className="h-3.5 w-3.5 text-[#0071e3]" />
                  {amountToFreeShipping === 0 ? (
                    <span className="text-[#0071e3] font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Free Express Studio Shipping Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <strong className="text-[#0071e3]">
                        ${amountToFreeShipping.toFixed(2)}
                      </strong>{" "}
                      for Free Studio Shipping
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-bold text-[#86868b]">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-500 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          <SheetDescription className="sr-only">
            Review and manage your cart items
          </SheetDescription>
        </div>

        {/* Body */}
        {isLoading && !checkout ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm font-semibold text-[#86868b]">
            <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
            <span>Updating your bag...</span>
          </div>
        ) : !hasLines ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-black/[0.04] text-[#86868b]">
              <ShoppingBag className="h-10 w-10 text-[#86868b] stroke-[1.5]" />
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Your Bag is Empty
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6e6e73]">
              Explore our premium precision hardware, cartridges, and studio
              supplies.
            </p>
            <Button
              asChild
              className="mt-8 rounded-full bg-[#0071e3] px-8 py-6 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,113,227,0.25)] hover:bg-[#0077ed] hover:scale-105 transition-all"
            >
              <Link to="/search" onClick={closeCart}>
                Explore Hardware Catalog
              </Link>
            </Button>
          </div>
        ) : checkout ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-2">
            <ul className="min-h-0 grow space-y-3.5 overflow-auto py-3 pr-1">
              {checkout.lines.map((line) => (
                <li
                  className="overflow-hidden rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                  data-saleor-cart-line
                  key={line.id}
                >
                  <div className="flex w-full gap-4">
                    <Link
                      aria-label={`Open ${line.productName}`}
                      className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl bg-[#fbfbfd] p-2 border border-black/[0.04]"
                      onClick={closeCart}
                      params={{ productId: line.productSlug }}
                      to="/product/$productId"
                    >
                      {line.imageUrl ? (
                        <img
                          alt={line.imageAlt}
                          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          src={line.imageUrl}
                          onError={(e) => {
                            const target = e.currentTarget;
                            let src = target.src;
                            if (src.includes("/thumbnails/products/")) {
                              src = src.replace(
                                "/thumbnails/products/",
                                "/products/",
                              );
                            } else if (src.includes("/thumbnails/")) {
                              src = src.replace("/thumbnails/", "/");
                            }
                            const fixed = src
                              .replace(
                                /_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i,
                                ".$1",
                              )
                              .replace(
                                /_thu_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                                ".$1",
                              )
                              .replace(
                                /_thum_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                                ".$1",
                              );
                            if (fixed !== target.src) {
                              target.src = fixed;
                            } else {
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".img-fallback")
                              ) {
                                const fallback = document.createElement("div");
                                fallback.className =
                                  "img-fallback flex h-full w-full items-center justify-center text-center text-[9px] font-bold uppercase text-[#86868b]";
                                fallback.textContent = "Studio Item";
                                parent.appendChild(fallback);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-center text-[10px] font-bold uppercase text-[#86868b]">
                          Studio Item
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          className="min-w-0 flex-1"
                          onClick={closeCart}
                          params={{ productId: line.productSlug }}
                          to="/product/$productId"
                        >
                          <span className="line-clamp-2 text-xs font-bold leading-snug text-[#1d1d1f] hover:text-[#0071e3] transition">
                            {line.productName}
                          </span>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#86868b]">
                            SKU {line.sku || "N/A"}
                          </p>
                        </Link>

                        <button
                          type="button"
                          aria-label="Remove item"
                          data-saleor-cart-remove-line
                          disabled={isMutating}
                          onClick={() => handleRemoveLine(line)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#86868b] transition hover:bg-[#f5f5f7] hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm font-extrabold text-[#1d1d1f]">
                          {formatSaleorMoney(line.totalPrice)}
                        </p>

                        <div className="flex h-8 items-center rounded-full bg-[#f5f5f7] border border-black/[0.04] p-1">
                          <QuantityButton
                            disabled={isMutating || line.quantity <= 1}
                            icon={<Minus className="h-3 w-3 text-[#1d1d1f]" />}
                            label="Decrease quantity"
                            onClick={() =>
                              handleUpdateLine(line, line.quantity - 1)
                            }
                          />
                          <span className="w-6 text-center text-xs font-bold text-[#1d1d1f]">
                            {line.quantity}
                          </span>
                          <QuantityButton
                            disabled={
                              isMutating ||
                              (line.quantityAvailable !== null &&
                                line.quantity >= line.quantityAvailable)
                            }
                            icon={<Plus className="h-3 w-3 text-[#1d1d1f]" />}
                            label="Increase quantity"
                            onClick={() =>
                              handleUpdateLine(line, line.quantity + 1)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Promo Code Capsule */}
            <div className="border-t border-black/[0.06] pt-3">
              <NtmsSaleorPromoCode />
            </div>

            {/* Price Breakdown Card */}
            <div className="mt-3 rounded-2xl bg-white p-4 border border-black/[0.04] shadow-sm text-xs font-medium text-[#6e6e73] space-y-2">
              <SummaryRow
                label="Bag Subtotal"
                price={checkout.originalSubtotalPrice}
              />
              {checkout.automaticDiscountPrice.amount > 0 ? (
                <SummaryRow
                  discount
                  label="Automatic Promotion"
                  price={checkout.automaticDiscountPrice}
                />
              ) : null}
              {checkout.discountPrice.amount > 0 ? (
                <SummaryRow
                  discount
                  label={checkout.discountName || "Applied Coupon"}
                  price={checkout.discountPrice}
                />
              ) : null}
              <SummaryRow
                label="Estimated Freight"
                price={checkout.shippingPrice}
              />

              <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3 text-[#1d1d1f]">
                <span className="text-sm font-bold">Total Estimated</span>
                <span className="text-xl font-extrabold tracking-tight text-[#1d1d1f]">
                  {formatSaleorMoney(checkout.totalPrice)}
                </span>
              </div>
            </div>

            {/* Actions & Express Guarantee */}
            <div className="pt-4">
              <Link
                to="/checkout"
                onClick={closeCart}
                data-saleor-checkout-link
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] py-4 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,113,227,0.25)] transition-[transform,background-color,box-shadow] duration-160 ease-out hover:bg-[#0077ed] hover:shadow-[0_8px_24px_rgba(0,113,227,0.35)] [@media(hover:hover)]:hover:scale-[1.01] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
              >
                <Lock className="h-4 w-4" />
                Proceed to Secure Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-medium text-[#86868b]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Official Warranty
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={clearCartSession}
                  className="transition hover:text-red-500 hover:underline"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function QuantityButton({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full transition-[transform,background-color] duration-140 ease-out hover:bg-white [@media(hover:hover)]:hover:scale-[1.05] active:scale-[0.94] motion-reduce:transition-none motion-reduce:transform-none",
        disabled && "cursor-not-allowed opacity-30",
      )}
    >
      {icon}
    </button>
  );
}

function SummaryRow({
  discount = false,
  label,
  price,
}: {
  discount?: boolean;
  label: string;
  price: { amount: number; currency: string } | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={cn(
          "font-semibold",
          discount ? "text-emerald-600" : "text-[#1d1d1f]",
        )}
      >
        {price
          ? discount
            ? `-${formatSaleorMoney(price)}`
            : formatSaleorMoney(price)
          : "Free"}
      </span>
    </div>
  );
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}
