import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { useMemo } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { readFragment } from "@/gql/graphql";
import { getFacetValue, setFacetValue } from "@/lib/search-schema";
import {
  type facetFragment,
  facetValueFragment,
} from "@/lib/vendure/fragments/facet";

export default function FacetsFilterItem({
  item,
  collectionFacetValues,
}: {
  item: ResultOf<typeof facetFragment>;
  collectionFacetValues: ResultOf<typeof facetValueFragment>[];
}) {
  const navigate = useNavigate();
  const routeApi = getRouteApi("/_default/_search/collections/$collection");
  const search = routeApi.useSearch();

  function onFilterChange(group: string, value: string[]) {
    const newSearch = setFacetValue(search, group, value);

    navigate({
      to: ".",
      search: newSearch,
    });
  }

  const defaultValue = useMemo(() => {
    return getFacetValue(search, item.code);
  }, [search, item.code]);

  const selectedCount = defaultValue.length;

  return (
    <div className="min-w-0 w-full rounded-lg border border-black/10/12 bg-background/52 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] transition hover:border-black/10/22">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
          {item.name}
        </h3>
        <span className="rounded-full border border-black/10/12 bg-card/70 px-2 py-0.5 text-[11px] text-foreground/55">
          {selectedCount > 0 ? `${selectedCount} selected` : "All"}
        </span>
      </div>
      <MultiSelect
        aria-label={`Filter by ${item.name}`}
        defaultValue={defaultValue}
        placeholder={`All ${item.name.toLowerCase()}`}
        options={item.values
          .map((valueFragment) =>
            readFragment(facetValueFragment, valueFragment),
          )
          .filter(
            (itemValue) =>
              collectionFacetValues.findIndex(
                (facetValue) => facetValue.id === itemValue.id,
              ) > -1,
          )
          .map((itemValue) => ({
            label: itemValue.name,
            value: itemValue.id,
          }))}
        onValueChange={(value) => onFilterChange(item.code, value)}
      />
    </div>
  );
}
