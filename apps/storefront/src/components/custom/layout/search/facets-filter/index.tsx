import type { ResultOf } from "gql.tada";
import { cn } from "@/lib/utils";
import type {
  facetFragment,
  facetValueFragment,
} from "@/lib/vendure/fragments/facet";
import FacetsFilterItem from "./item";

export default function FacetsFilter({
  id,
  list,
  collectionFacetValues,
  variant = "panel",
}: {
  id?: string;
  list: ResultOf<typeof facetFragment>[];
  collectionFacetValues: ResultOf<typeof facetValueFragment>[];
  variant?: "panel" | "inline";
}) {
  const availableFacets = list.filter(
    (facet) =>
      collectionFacetValues.findIndex(
        (facetValue) => facetValue.facetId === facet.id,
      ) > -1,
  );

  if (availableFacets.length === 0) {
    return null;
  }

  const items = availableFacets.map((facet) => (
    <FacetsFilterItem
      item={facet}
      key={facet.id}
      collectionFacetValues={collectionFacetValues}
    />
  ));

  if (variant === "inline") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items}</div>
    );
  }

  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-28 overflow-hidden rounded-lg border border-black/10/12 bg-card/90 p-3 shadow-[0_18px_48px_rgba(0,0,0,.09)] backdrop-blur-xl sm:p-4",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/50 to-transparent" />
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
            Filters
          </p>
          <p className="mt-1 text-sm text-foreground/55">
            Narrow collection results by facet.
          </p>
        </div>
        <div className="rounded-full border border-black/10/10 bg-background/62 px-3 py-1 text-xs text-foreground/55">
          {availableFacets.length} groups
        </div>
      </div>
      <div className="flex flex-wrap gap-3">{items}</div>
    </section>
  );
}
