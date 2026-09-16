import type { ResultOf } from "gql.tada";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ProductCard } from "@/components/custom/product-card";
import { readFragment } from "@/gql/graphql";
import type activeChannelFragment from "@/lib/vendure/fragments/active-channel";
import searchResultFragment from "@/lib/vendure/fragments/search-result";

interface CarouselProps {
  products: ResultOf<typeof searchResultFragment>[];
  activeChannel: ResultOf<typeof activeChannelFragment>;
}

export function Carousel({ products, activeChannel }: CarouselProps) {
  const railRef = useRef<HTMLUListElement>(null);

  if (!products?.length) return null;

  const scrollRail = (direction: "previous" | "next") => {
    const rail = railRef.current;
    if (!rail) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    rail.scrollBy({
      left: direction === "next" ? 320 : -320,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className="w-full overflow-hidden py-8">
      <div className="mx-auto mb-5 flex max-w-screen-2xl items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
            Fast-moving cartridge picks
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Studio restock rail
          </h2>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => scrollRail("previous")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10/16 bg-card/82 text-foreground/70 shadow-[0_10px_24px_rgba(0,0,0,.1)] transition hover:border-black/10/34 hover:text-[#0071e3]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollRail("next")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10/16 bg-card/82 text-foreground/70 shadow-[0_10px_24px_rgba(0,0,0,.1)] transition hover:border-black/10/34 hover:text-[#0071e3]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <ul
          ref={railRef}
          aria-label="Studio restock products"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [scroll-padding-left:1rem] [scroll-padding-right:1rem] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((data) => {
            const product = readFragment(searchResultFragment, data);
            return (
              <li
                key={`${product.slug}-${product.productVariantId}`}
                className="w-[214px] flex-none snap-start sm:w-[244px] lg:w-[268px]"
              >
                <ProductCard
                  currencyCode={activeChannel?.defaultCurrencyCode || "USD"}
                  product={product}
                  variant="rail"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
