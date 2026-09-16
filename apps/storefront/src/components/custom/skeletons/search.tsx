import clsx from "clsx";
import { createSkeletonArray, SkeletonItem, skeletonSizes } from "./base";

interface SearchSkeletonProps {
  className?: string;
}

// Skeleton for facets/filters in horizontal layout
export function FacetsSkeleton({ className }: SearchSkeletonProps) {
  return (
    <div className={clsx("gap-4 hidden w-full py-4 lg:flex", className)}>
      <SkeletonItem className={skeletonSizes.facetItem} />
      <SkeletonItem className={skeletonSizes.facetItem} />
      <SkeletonItem className={skeletonSizes.facetItem} />
      <SkeletonItem className={skeletonSizes.facetItem} />
    </div>
  );
}

// Skeleton for collections/filter list in vertical layout
export function FilterListSkeleton({
  className,
  itemCount = 8,
}: SearchSkeletonProps & { itemCount?: number }) {
  return (
    <div
      className={clsx(
        "col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block",
        className,
      )}
    >
      {/* Title skeletons */}
      <SkeletonItem variant="active" className={skeletonSizes.filterItem} />
      <SkeletonItem variant="active" className={skeletonSizes.filterItem} />

      {/* Filter item skeletons */}
      {createSkeletonArray(itemCount, "filter-skeleton").map((key) => (
        <SkeletonItem key={key} className={skeletonSizes.filterItem} />
      ))}
    </div>
  );
}

// Combined search layout skeleton
export function SearchLayoutSkeleton({ className }: SearchSkeletonProps) {
  return (
    <div
      className={clsx(
        "mx-auto grid max-w-screen-2xl gap-5 px-4 py-5 text-foreground sm:py-7 lg:grid-cols-[minmax(224px,248px)_minmax(0,1fr)] lg:items-start lg:gap-7",
        className,
      )}
    >
      <div className="order-1 w-full">
        <FilterListSkeleton />
      </div>
      <div className="order-2 min-h-screen w-full min-w-0">
        <SkeletonItem className="h-20 w-full mb-4" />
      </div>
    </div>
  );
}
