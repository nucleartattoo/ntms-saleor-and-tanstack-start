import { createServerFn } from "@tanstack/react-start";
import {
  getNtmsSaleorCatalogPreview,
  getNtmsSaleorCategoryPage,
  getNtmsSaleorNavigationCategories,
  getNtmsSaleorProductPage,
  getNtmsSaleorSearchPage,
  type NtmsSaleorCatalogPreview,
  type NtmsSaleorCategoryPage,
  type NtmsSaleorProductPage,
  type NtmsSaleorSearchPage,
} from "@/lib/saleor/catalog";
import { readThroughCatalogCache } from "@/lib/saleor/catalog-server-cache";

const catalogCacheTtl = {
  category: 60_000,
  navigation: 5 * 60_000,
  preview: 2 * 60_000,
  product: 2 * 60_000,
  search: 60_000,
} as const;

const catalogCacheKey = (scope: string, input?: unknown) =>
  input === undefined
    ? `ntms:${scope}`
    : `ntms:${scope}:${JSON.stringify(input)}`;

export const getSaleorCatalogPreview = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(
    async (): Promise<NtmsSaleorCatalogPreview> =>
      readThroughCatalogCache({
        key: catalogCacheKey("preview"),
        load: getNtmsSaleorCatalogPreview,
        ttlMs: catalogCacheTtl.preview,
      }),
  );

export const getSaleorNavigationCategories = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () =>
    readThroughCatalogCache({
      key: catalogCacheKey("navigation"),
      load: getNtmsSaleorNavigationCategories,
      ttlMs: catalogCacheTtl.navigation,
    }),
  );

export const getSaleorSearchPage = createServerFn({ method: "POST" })
  .validator(
    (data: {
      cursor?: string;
      page?: number | string;
      query?: string;
      sort?: string;
    }) => data,
  )
  .handler(
    async ({ data }): Promise<NtmsSaleorSearchPage> =>
      readThroughCatalogCache({
        key: catalogCacheKey("search", data),
        load: () => getNtmsSaleorSearchPage(data),
        ttlMs: catalogCacheTtl.search,
      }),
  );

export const getSaleorCategoryPage = createServerFn({ method: "POST" })
  .validator(
    (data: {
      collection?: string;
      cursor?: string;
      page?: number | string;
      sort?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<NtmsSaleorCategoryPage | null> => {
    if (!data.collection) {
      return null;
    }

    return readThroughCatalogCache({
      key: catalogCacheKey("category", data),
      load: () =>
        getNtmsSaleorCategoryPage(data.collection as string, {
          cursor: data.cursor,
          page: data.page,
          sort: data.sort,
        }),
      ttlMs: catalogCacheTtl.category,
    });
  });

export const getSaleorProductPage = createServerFn({ method: "POST" })
  .validator((data: { productId?: string }) => data)
  .handler(async ({ data }): Promise<NtmsSaleorProductPage | null> => {
    if (!data.productId) {
      return null;
    }

    return readThroughCatalogCache({
      key: catalogCacheKey("product", data.productId),
      load: () => getNtmsSaleorProductPage(data.productId as string),
      ttlMs: catalogCacheTtl.product,
    });
  });
