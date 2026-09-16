import { queryOptions } from "@tanstack/react-query";
import {
  getSaleorCatalogPreview,
  getSaleorCategoryPage,
  getSaleorNavigationCategories,
  getSaleorProductPage,
  getSaleorSearchPage,
} from "@/components/custom/saleor/ntms-catalog-actions";

type SaleorCategoryPageInput = {
  collection: string;
  cursor?: string;
  page?: number | string;
  sort?: string;
};

type SaleorSearchPageInput = {
  cursor?: string;
  page?: number | string;
  query?: string;
  sort?: string;
};

const catalogGcTime = 15 * 60_000;

export const saleorCatalogKeys = {
  all: ["saleor", "catalog"] as const,
  category: (input: SaleorCategoryPageInput) =>
    [
      ...saleorCatalogKeys.all,
      "category",
      normalizeCategoryInput(input),
    ] as const,
  navigation: () => [...saleorCatalogKeys.all, "navigation"] as const,
  preview: () => [...saleorCatalogKeys.all, "preview"] as const,
  product: (slug: string) =>
    [...saleorCatalogKeys.all, "product", slug.trim()] as const,
  search: (input: SaleorSearchPageInput) =>
    [...saleorCatalogKeys.all, "search", normalizeSearchInput(input)] as const,
};

export function saleorCatalogPreviewQueryOptions() {
  return queryOptions({
    gcTime: catalogGcTime,
    queryFn: () => getSaleorCatalogPreview(),
    queryKey: saleorCatalogKeys.preview(),
    staleTime: 2 * 60_000,
  });
}

export function saleorNavigationQueryOptions() {
  return queryOptions({
    gcTime: catalogGcTime,
    queryFn: () => getSaleorNavigationCategories(),
    queryKey: saleorCatalogKeys.navigation(),
    staleTime: 5 * 60_000,
  });
}

export function saleorCategoryPageQueryOptions(input: SaleorCategoryPageInput) {
  const normalizedInput = normalizeCategoryInput(input);

  return queryOptions({
    gcTime: catalogGcTime,
    queryFn: () =>
      getSaleorCategoryPage({
        data: normalizedInput,
      }),
    queryKey: saleorCatalogKeys.category(normalizedInput),
    staleTime: 60_000,
  });
}

export function saleorProductPageQueryOptions(productId: string) {
  const normalizedProductId = productId.trim();

  return queryOptions({
    gcTime: catalogGcTime,
    queryFn: () =>
      getSaleorProductPage({
        data: { productId: normalizedProductId },
      }),
    queryKey: saleorCatalogKeys.product(normalizedProductId),
    staleTime: 2 * 60_000,
  });
}

export function saleorSearchPageQueryOptions(input: SaleorSearchPageInput) {
  const normalizedInput = normalizeSearchInput(input);

  return queryOptions({
    gcTime: catalogGcTime,
    queryFn: () =>
      getSaleorSearchPage({
        data: normalizedInput,
      }),
    queryKey: saleorCatalogKeys.search(normalizedInput),
    staleTime: 60_000,
  });
}

function normalizeCategoryInput(input: SaleorCategoryPageInput) {
  return {
    collection: input.collection.trim(),
    cursor: input.cursor?.trim() || undefined,
    page: input.page,
    sort: input.sort,
  };
}

function normalizeSearchInput(input: SaleorSearchPageInput) {
  return {
    cursor: input.cursor?.trim() || undefined,
    page: input.page,
    query: input.query?.trim() || "",
    sort: input.sort,
  };
}
