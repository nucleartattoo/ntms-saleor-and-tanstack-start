import clsx from "clsx";
import type { ResultOf } from "gql.tada";
import { AlertCircle, ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/custom/cart/cart-context";
import { useSelectedVariant } from "@/components/custom/product/product-context";
import { readFragment } from "@/gql/graphql";
import { useAddCartItemMutation } from "@/hooks/use-cart-mutations";
import type productFragment from "@/lib/vendure/fragments/product";
import { variantFragment } from "@/lib/vendure/fragments/product";

function SubmitButton({
  availableForSale,
  selectedVariantId,
  isHydrated,
  isLoading,
  isOutOfStock,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  isHydrated: boolean;
  isLoading: boolean;
  isOutOfStock: boolean;
}) {
  const buttonClasses =
    "group relative flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#0071e3] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black shadow-[0_18px_42px_rgba(247,200,31,.2)] transition";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!availableForSale || isOutOfStock) {
    return (
      <button
        type="submit"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        Out of stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        type="submit"
        aria-label="Please select all required options"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <ShoppingCart className="h-4 w-4" />
        Select options
      </button>
    );
  }

  return (
    <button
      type="submit"
      aria-label="Add to cart"
      disabled={isLoading || !isHydrated}
      className={clsx(buttonClasses, {
        "hover:-translate-y-px hover:bg-[color:var(--apple-blue)] hover:shadow-[0_24px_52px_rgba(247,200,31,.25)]":
          !isLoading && isHydrated,
        "opacity-60 cursor-not-allowed": isLoading || !isHydrated,
      })}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {isLoading ? "Adding" : "Add to cart"}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}

export function AddToCart({
  product,
}: {
  product: ResultOf<typeof productFragment>;
}) {
  const { variantList, enabled: availableForSale } = product;
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { openCart } = useCart();
  const addCartItemMutation = useAddCartItemMutation();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const variants =
    variantList?.items.map((data) => readFragment(variantFragment, data)) || [];

  const selectedVariant = useSelectedVariant(variants);

  // For products with only one variant and no options, use that variant
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;

  const selectedVariantId = selectedVariant?.id || defaultVariantId;

  // Check if selected variant is out of stock
  const isOutOfStock = selectedVariant
    ? selectedVariant.stockLevel === "OUT_OF_STOCK"
    : variants.length === 1 && variants[0]
      ? variants[0].stockLevel === "OUT_OF_STOCK"
      : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariantId) {
      setMessage("Please select all required options");
      return;
    }

    setMessage(null);

    try {
      await addCartItemMutation.mutateAsync(selectedVariantId);
      openCart();
      toast.success("Item added to cart");
    } catch (_error) {
      const errorMessage =
        _error instanceof Error ? _error.message : "Error adding item to cart";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
        isHydrated={isHydrated}
        isLoading={addCartItemMutation.isPending}
        isOutOfStock={isOutOfStock}
      />
      {message ? (
        <p className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-100">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {message}
        </p>
      ) : null}
      <div className="grid gap-2 text-xs text-foreground/45 sm:grid-cols-2">
        <p className="rounded-lg border border-black/10/10 bg-background/42 px-3 py-2">
          Opens cart after adding.
        </p>
        <p className="rounded-lg border border-black/10/10 bg-background/42 px-3 py-2">
          Live price and stock checked.
        </p>
      </div>
      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </form>
  );
}
