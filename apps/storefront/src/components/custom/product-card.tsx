import { Link } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { ArrowRight, CircleAlert, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/custom/cart/cart-context";
import { GridTileImage } from "@/components/custom/grid/tile";
import { useAddCartItemMutation } from "@/hooks/use-cart-mutations";
import { cn, formatCurrency } from "@/lib/utils";
import type searchResultFragment from "@/lib/vendure/fragments/search-result";

type ProductCardVariant = "grid" | "featured" | "rail";

export function ProductCard({
  product,
  currencyCode,
  priority = false,
  variant = "grid",
  className,
}: {
  product: ResultOf<typeof searchResultFragment>;
  currencyCode: string;
  priority?: boolean;
  variant?: ProductCardVariant;
  className?: string;
}) {
  const effectiveCurrencyCode = product.currencyCode || currencyCode;
  const price = getPriceSummary(product, effectiveCurrencyCode);
  const isFeatured = variant === "featured";
  const isRail = variant === "rail";
  const description = isFeatured
    ? getPlainProductDescription(product.description)
    : "";
  const asset =
    product.productVariantAsset?.preview || product.productAsset?.preview || "";
  const variantName = getVariantName(
    product.productName,
    product.productVariantName,
  );
  const canQuickAdd =
    product.inStock &&
    Boolean(product.productVariantId) &&
    product.priceWithTax.__typename === "SinglePrice" &&
    !variantName;
  const { openCart } = useCart();
  const addCartItemMutation = useAddCartItemMutation();

  const handleQuickAdd = async () => {
    if (!canQuickAdd) return;

    try {
      await addCartItemMutation.mutateAsync(product.productVariantId);
      openCart();
      toast.success("Added to Studio Bag");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error adding item to bag",
      );
    }
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white border border-black/[0.04] p-3 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:border-black/[0.08]",
        isFeatured && "min-h-full p-5 sm:p-6",
        isRail && "min-h-[270px] sm:min-h-[310px]",
        className,
      )}
    >
      <Link
        aria-label={`${product.productName} - ${price.label}`}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#fbfbfd] transition-colors group-hover:bg-[#f5f5f7]",
          isFeatured ? "aspect-[1.15]" : "aspect-square",
        )}
        to="/product/$productId"
        params={{ productId: product.slug }}
      >
        {asset ? (
          <GridTileImage
            alt={product.productName}
            className="object-contain p-4 sm:p-6 mix-blend-multiply drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-transform duration-700 ease-out group-hover:scale-105"
            frame={false}
            priority={priority}
            src={asset}
            sizes={
              isFeatured
                ? "(min-width: 1024px) 44vw, 100vw"
                : isRail
                  ? "(min-width: 1024px) 22vw, 72vw"
                  : "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            }
            layout="fullWidth"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-[#86868b]">
            NTMS Studio
          </div>
        )}
        {!product.inStock ? (
          <span className="absolute left-3 top-3 inline-flex h-6 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 shadow-sm backdrop-blur-md border border-amber-200/50">
            <CircleAlert className="h-3 w-3" />
            <span>Low Stock</span>
          </span>
        ) : (
          <span className="absolute left-3 top-3 inline-flex h-6 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#0071e3] opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-sm backdrop-blur-md border border-black/[0.04]">
            <Sparkles className="h-3 w-3" />
            <span>Pro Gear</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3.5 sm:pt-4">
        <div>
          <Link
            to="/product/$productId"
            params={{ productId: product.slug }}
            className="block"
          >
            <h3
              className={cn(
                "line-clamp-2 font-bold tracking-tight text-[#1d1d1f] transition-colors group-hover:text-[#0071e3]",
                isFeatured
                  ? "text-lg sm:text-xl leading-tight"
                  : "min-h-10 text-xs sm:text-sm leading-snug",
              )}
            >
              {product.productName}
            </h3>
          </Link>
          {variantName ? (
            <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#86868b]">
              {variantName}
            </p>
          ) : null}
          {description ? (
            <p
              className={cn(
                "mt-1.5 hidden text-xs leading-relaxed text-[#6e6e73]",
                isFeatured ? "sm:line-clamp-2 sm:block" : "lg:line-clamp-1",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/[0.04] pt-3">
          <div className="min-w-0">
            <p
              className={cn(
                "font-extrabold tracking-tight text-[#1d1d1f]",
                isFeatured ? "text-xl sm:text-2xl" : "text-sm sm:text-base",
              )}
            >
              {price.label}
            </p>
          </div>

          {canQuickAdd ? (
            <button
              type="button"
              aria-label={`Add ${product.productName} to bag`}
              disabled={addCartItemMutation.isPending}
              onClick={handleQuickAdd}
              className="inline-flex h-8 sm:h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0077ed] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addCartItemMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              <span>{addCartItemMutation.isPending ? "Adding" : "Add"}</span>
            </button>
          ) : (
            <Link
              to="/product/$productId"
              params={{ productId: product.slug }}
              aria-label={
                product.inStock
                  ? `Select options for ${product.productName}`
                  : `View details for ${product.productName}`
              }
              className="inline-flex h-8 sm:h-9 shrink-0 items-center justify-center gap-1 rounded-full bg-[#f5f5f7] px-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-[#1d1d1f] transition-all hover:bg-[#e8e8ed] hover:scale-105 active:scale-95"
            >
              <span>{product.inStock ? "Select" : "Details"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function getPriceSummary(
  product: ResultOf<typeof searchResultFragment>,
  currencyCode: string,
) {
  const price = product.priceWithTax;

  if (price.__typename === "PriceRange") {
    const min = formatCurrency(price.min, currencyCode);

    return {
      caption: price.min === price.max ? "Standard price" : "Price range",
      label: price.min === price.max ? min : `From ${min}`,
    };
  }

  if (price.__typename === "SinglePrice") {
    return {
      caption: "Standard price",
      label: formatCurrency(price.value, currencyCode),
    };
  }

  return {
    caption: "Standard price",
    label: formatCurrency(0, currencyCode),
  };
}

function getVariantName(
  productName: string,
  productVariantName?: string | null,
) {
  const variantName = productVariantName?.trim();

  if (!variantName || variantName === productName) {
    return "";
  }

  return variantName.replace(productName, "").trim() || variantName;
}

function getPlainProductDescription(description?: string | null) {
  return (
    description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}
