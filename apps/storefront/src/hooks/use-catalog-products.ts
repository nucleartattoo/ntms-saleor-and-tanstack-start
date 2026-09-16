import { queryOptions, useQuery } from "@tanstack/react-query";
import type { VariablesOf } from "gql.tada";
import { defaultSort, sorting } from "@/lib/constants";
import type { SearchParams } from "@/lib/search-schema";
import {
  getActiveChannel,
  getCollection,
  getCollectionFacetValues,
  getCollectionProducts,
  getCollections,
  getFacets,
  getMenu,
  getProduct,
  getProducts,
} from "@/lib/vendure";
import type { getCollectionProductsQuery } from "@/lib/vendure/queries/collection";

type SortDirection = "ASC" | "DESC";
type FacetValueFilters = VariablesOf<
  typeof getCollectionProductsQuery
>["facetValueFilters"];

export function activeChannelQueryOptions() {
  return queryOptions({
    queryKey: ["storefront", "active-channel"],
    queryFn: () => getActiveChannel(),
    staleTime: 5 * 60_000,
  });
}

export function menuQueryOptions() {
  return queryOptions({
    queryKey: ["storefront", "menu"],
    queryFn: () => getMenu(),
    staleTime: 5 * 60_000,
  });
}

export function collectionsQueryOptions({
  parentId,
  topLevelOnly = false,
}: {
  parentId?: string;
  topLevelOnly?: boolean;
} = {}) {
  return queryOptions({
    queryKey: ["catalog", "collections", { parentId, topLevelOnly }],
    queryFn: () => getCollections({ data: { parentId, topLevelOnly } }),
    staleTime: 5 * 60_000,
  });
}

export function collectionQueryOptions(collection: string) {
  return queryOptions({
    queryKey: ["catalog", "collection-detail", collection],
    queryFn: () => getCollection({ data: collection }),
    staleTime: 5 * 60_000,
  });
}

export function productQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ["catalog", "product", productId],
    queryFn: () => getProduct({ data: productId }),
    staleTime: 60_000,
  });
}

export function facetsQueryOptions() {
  return queryOptions({
    queryKey: ["catalog", "facets"],
    queryFn: () => getFacets(),
    staleTime: 5 * 60_000,
  });
}

export function useActiveChannel() {
  return useQuery(activeChannelQueryOptions());
}

export function useMenu() {
  return useQuery(menuQueryOptions());
}

export function useCollections({
  parentId,
  topLevelOnly = false,
}: {
  parentId?: string;
  topLevelOnly?: boolean;
} = {}) {
  return useQuery(collectionsQueryOptions({ parentId, topLevelOnly }));
}

export function useCollection(collection: string) {
  return useQuery(collectionQueryOptions(collection));
}

export function useProduct(productId: string) {
  return useQuery(productQueryOptions(productId));
}

export function useFacets() {
  return useQuery(facetsQueryOptions());
}

export function getSortInput(sort: string | undefined) {
  const sortItem = sorting.find((item) => item.slug === sort) || defaultSort;

  return {
    slug: sortItem.slug,
    sortKey: sortItem.sortKey,
    direction: sortItem.direction as SortDirection,
  };
}

export function createFacetValueFilters(
  search: SearchParams,
  facetCodes: string[],
): FacetValueFilters {
  return facetCodes
    .map((facetCode) => {
      const valueIdsAsString = search[facetCode];
      return {
        or: valueIdsAsString?.split(",").filter(Boolean).sort() ?? [],
      };
    })
    .filter((facetFilter) => facetFilter.or.length > 0);
}

export function useSearchProducts({
  query,
  sort,
}: {
  query?: string;
  sort?: string;
}) {
  return useQuery(searchProductsQueryOptions({ query, sort }));
}

export function searchProductsQueryOptions({
  query,
  sort,
}: {
  query?: string;
  sort?: string;
}) {
  const sortInput = getSortInput(sort);
  const normalizedQuery = query?.trim() || "";

  return queryOptions({
    queryKey: ["catalog", "search", normalizedQuery, sortInput.slug],
    queryFn: () =>
      getProducts({
        data: {
          query: normalizedQuery || undefined,
          direction: sortInput.direction,
          sortKey: sortInput.sortKey,
        },
      }),
    staleTime: 60_000,
  });
}

export function useCollectionProducts({
  collection,
  facetValueFilters = [],
  sort,
}: {
  collection: string;
  facetValueFilters?: FacetValueFilters;
  sort?: string;
}) {
  return useQuery(
    collectionProductsQueryOptions({ collection, facetValueFilters, sort }),
  );
}

export function collectionProductsQueryOptions({
  collection,
  facetValueFilters = [],
  sort,
}: {
  collection: string;
  facetValueFilters?: FacetValueFilters;
  sort?: string;
}) {
  const sortInput = getSortInput(sort);

  return queryOptions({
    queryKey: [
      "catalog",
      "collection",
      collection,
      sortInput.slug,
      facetValueFilters,
    ],
    queryFn: () =>
      getCollectionProducts({
        data: {
          collection,
          direction: sortInput.direction,
          facetValueFilters,
          sortKey: sortInput.sortKey,
        },
      }),
    staleTime: 60_000,
  });
}

export function useCollectionFacetValues(collection: string) {
  return useQuery(collectionFacetValuesQueryOptions(collection));
}

export function collectionFacetValuesQueryOptions(collection: string) {
  return queryOptions({
    queryKey: ["catalog", "collection-facet-values", collection],
    queryFn: () => getCollectionFacetValues({ data: { collection } }),
    staleTime: 60_000,
  });
}
