import type { ResultOf } from "gql.tada";
import { FacetsSkeleton } from "@/components/custom/skeletons/search";
import { useCollectionFacetValues } from "@/hooks/use-catalog-products";
import type { facetFragment } from "@/lib/vendure/fragments/facet";
import FacetsFilter from "./facets-filter";

type FacetsVariant = "panel" | "inline";

function FacetsList({
  collection,
  facets,
  id,
  variant = "panel",
}: {
  collection: string;
  facets: ResultOf<typeof facetFragment>[];
  id?: string;
  variant?: FacetsVariant;
}) {
  const collectionFacetValuesQuery = useCollectionFacetValues(collection);

  if (collectionFacetValuesQuery.isLoading) {
    return <FacetsSkeleton />;
  }

  return (
    <FacetsFilter
      id={id}
      list={facets}
      collectionFacetValues={collectionFacetValuesQuery.data ?? []}
      variant={variant}
    />
  );
}

export default function Facets({
  collection,
  facets,
  id,
  variant = "panel",
}: {
  collection: string;
  facets: ResultOf<typeof facetFragment>[];
  id?: string;
  variant?: FacetsVariant;
}) {
  return (
    <FacetsList
      facets={facets}
      collection={collection}
      id={id}
      variant={variant}
    />
  );
}
