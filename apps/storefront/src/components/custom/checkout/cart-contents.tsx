import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import type { ResultOf } from "gql.tada";
import { BadgeCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import Price from "@/components/custom/price";
import { Button } from "@/components/ui/button";
import { readFragment } from "@/gql/graphql";
import {
  useRemoveCartItemMutation,
  useUpdateCartItemQuantityMutation,
} from "@/hooks/use-cart-mutations";
import type activeOrderFragment from "@/lib/vendure/fragments/active-order";
import assetFragment from "@/lib/vendure/fragments/image";
import productFragment from "@/lib/vendure/fragments/product";

interface CartContentsProps {
  order?: ResultOf<typeof activeOrderFragment> | null;
  editable?: boolean;
  onUpdate?: () => void;
}

export function CartContents({
  order,
  editable = false,
  onUpdate,
}: CartContentsProps) {
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);
  const removeCartItemMutation = useRemoveCartItemMutation();
  const updateCartItemQuantityMutation = useUpdateCartItemQuantityMutation();
  const lines = order?.lines || [];
  const currencyCode = order?.currencyCode || "USD";

  const handleQuantityChange = async (lineId: string, quantity: number) => {
    if (!editable) return;

    setUpdatingLineId(lineId);
    try {
      await updateCartItemQuantityMutation.mutateAsync({
        merchandiseId: lineId,
        quantity,
      });
      onUpdate?.();
    } catch {
      // Error handled silently
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleRemove = async (lineId: string) => {
    if (!editable) return;

    setUpdatingLineId(lineId);
    try {
      await removeCartItemMutation.mutateAsync(lineId);
      onUpdate?.();
    } catch {
      // Error handled silently
    } finally {
      setUpdatingLineId(null);
    }
  };

  if (lines.length === 0) {
    return (
      <StatusPanel
        icon={<ShoppingCart className="h-5 w-5" />}
        title="Your cart is empty"
        description="Add products before returning here to review items and totals."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/">Browse catalog</Link>
            </Button>
            <Button asChild>
              <Link to="/search">Search products</Link>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {lines.map((line) => {
          const { linePriceWithTax } = line;
          const isUpdating = updatingLineId === line.id;
          const product = readFragment(
            productFragment,
            line.productVariant.product,
          );
          const featuredAsset = product.featuredAsset
            ? readFragment(assetFragment, product.featuredAsset)
            : null;
          const selectedOptions = line.productVariant.options
            .map((option) => option.name)
            .join(", ");

          return (
            <li
              key={line.id}
              className="overflow-hidden rounded-xl border border-black/10/10 bg-background/52 p-3 shadow-[0_12px_28px_rgba(0,0,0,.07)]"
            >
              <div className="flex gap-3">
                <Link
                  to="/product/$productId"
                  params={{ productId: product.slug }}
                  className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-lg border border-black/10/12 bg-card/75"
                  aria-label={`Open ${product.name}`}
                >
                  {featuredAsset ? (
                    <>
                      <Image
                        layout="fixed"
                        width={100}
                        height={100}
                        className="h-full w-full object-contain p-2"
                        src={`${featuredAsset.preview}?preset=thumb`}
                        alt={`Image of: ${line.productVariant.name}`}
                      />
                      <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-500/12 text-emerald-100 backdrop-blur-xl">
                        <BadgeCheck className="h-3 w-3" />
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-foreground/35">
                      NTMS
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                        <Link
                          to="/product/$productId"
                          params={{ productId: product.slug }}
                          className="transition hover:text-[#0071e3]"
                        >
                          {product.name}
                        </Link>
                      </h3>
                      {selectedOptions ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[#0071e3]">
                          {selectedOptions}
                        </p>
                      ) : null}
                      <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/38">
                        SKU {line.productVariant.sku}
                      </p>
                    </div>
                    <Price
                      amount={linePriceWithTax}
                      currencyCode={currencyCode}
                      className="shrink-0 text-right text-sm font-semibold text-[#0071e3]"
                      currencyCodeClassName="text-[10px] text-foreground/38"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    {editable ? (
                      <label
                        htmlFor={`quantity-${line.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-black/10/12 bg-card/70 px-2 py-1 text-xs text-foreground/55"
                      >
                        <span>Qty</span>
                        <select
                          disabled={!editable || isUpdating}
                          id={`quantity-${line.id}`}
                          name={`quantity-${line.id}`}
                          value={line.quantity}
                          onChange={(e) => {
                            handleQuantityChange(
                              line.id,
                              Number(e.target.value),
                            );
                          }}
                          className="rounded-md border border-black/10/14 bg-background/70 px-2 py-1 text-left text-sm font-semibold leading-5 text-foreground focus:border-black/10/60 focus:outline-none focus:ring-1 focus:ring-[color:var(--apple-blue)]/35 disabled:opacity-50"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              {num.toString()}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className="rounded-lg border border-black/10/12 bg-card/70 px-2.5 py-1 text-xs text-foreground/55">
                        Qty{" "}
                        <span className="font-semibold text-foreground">
                          {line.quantity}
                        </span>
                      </div>
                    )}
                    {editable ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/10/12 bg-background/70 px-2.5 py-1.5 text-xs font-medium text-foreground/55 transition hover:border-rose-500/30 hover:bg-rose-500/12 hover:text-rose-200 disabled:opacity-50"
                        onClick={() => handleRemove(line.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isUpdating ? "Removing..." : "Remove"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
