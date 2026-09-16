import type { ResultOf } from "gql.tada";
import { ProductCard } from "@/components/custom/product-card";
import type activeChannelFragment from "@/lib/vendure/fragments/active-channel";
import type searchResultFragment from "@/lib/vendure/fragments/search-result";

interface ThreeItemGridItemProps {
  item: ResultOf<typeof searchResultFragment>;
  size: "full" | "half";
  priority?: boolean;
  activeChannel: ResultOf<typeof activeChannelFragment>;
}

function ThreeItemGridItem({
  item,
  size,
  priority,
  activeChannel,
}: ThreeItemGridItemProps) {
  return (
    <div
      className={
        size === "full"
          ? "min-w-0 md:col-span-4 md:row-span-2"
          : "min-w-0 md:col-span-2 md:row-span-1"
      }
    >
      <ProductCard
        className="h-full"
        currencyCode={activeChannel.defaultCurrencyCode}
        priority={priority}
        product={item}
        variant={size === "full" ? "featured" : "grid"}
      />
    </div>
  );
}

interface ThreeItemGridProps {
  homepageItems: ResultOf<typeof searchResultFragment>[];
  activeChannel: ResultOf<typeof activeChannelFragment>;
}

export function ThreeItemGrid({
  homepageItems,
  activeChannel,
}: ThreeItemGridProps) {
  // No data state
  if (
    !activeChannel ||
    !homepageItems[0] ||
    !homepageItems[1] ||
    !homepageItems[2]
  ) {
    return null;
  }

  const [firstProduct, secondProduct, thirdProduct] = homepageItems;

  return (
    <section className="mx-auto grid w-full max-w-screen-2xl grid-cols-[minmax(0,1fr)] gap-4 px-4 py-8 sm:gap-5 md:grid-cols-6 md:grid-rows-2">
      <ThreeItemGridItem
        size="full"
        item={firstProduct}
        priority={true}
        activeChannel={activeChannel}
      />
      <ThreeItemGridItem
        size="half"
        item={secondProduct}
        priority={true}
        activeChannel={activeChannel}
      />
      <ThreeItemGridItem
        size="half"
        item={thirdProduct}
        priority={true}
        activeChannel={activeChannel}
      />
    </section>
  );
}
