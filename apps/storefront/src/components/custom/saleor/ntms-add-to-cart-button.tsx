import { ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSaleorCart } from "./ntms-cart-context";

export function NtmsSaleorAddToCartButton({
  className,
  disabled = false,
  label = "Add",
  quantity = 1,
  size = "compact",
  variantId,
}: {
  className?: string;
  disabled?: boolean;
  label?: string;
  quantity?: number;
  size?: "compact" | "full";
  variantId?: string;
}) {
  const { addLine, isMutating, openCart } = useSaleorCart();
  const canAdd = Boolean(variantId) && !disabled;
  const safeQuantity = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;

  const handleAdd = async () => {
    if (!variantId || !canAdd) return;

    try {
      await addLine({ quantity: safeQuantity, variantId });
      openCart();
      toast.success("Item added to cart");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add item",
      );
    }
  };

  if (size === "full") {
    return (
      <Button
        className={cn(
          "h-12 w-full gap-2 font-semibold transition-[transform,background-color,box-shadow] duration-160 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:scale-[1.01] motion-reduce:transition-none motion-reduce:transform-none",
          className,
        )}
        data-saleor-add-to-cart-button
        data-saleor-quantity={safeQuantity}
        data-saleor-variant-id={variantId}
        disabled={!canAdd || isMutating}
        onClick={handleAdd}
        type="button"
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {isMutating ? "Adding" : label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      data-saleor-add-to-cart-button
      data-saleor-quantity={safeQuantity}
      data-saleor-variant-id={variantId}
      disabled={!canAdd || isMutating}
      onClick={handleAdd}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 text-xs font-semibold text-[#1d1d1f] shadow-none transition-[transform,background-color,color,border-color] duration-160 ease-out hover:border-black/20 hover:bg-[#1d1d1f] hover:text-white [@media(hover:hover)]:hover:scale-[1.04] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {isMutating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" />
      )}
      <span>{isMutating ? "Adding" : label}</span>
    </button>
  );
}
