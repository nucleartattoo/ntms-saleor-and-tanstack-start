import { beforeEach, describe, expect, test, vi } from "vitest";
import { saleorFetch } from "@/lib/saleor";
import { getNtmsSaleorCategoryPage, getNtmsSaleorSearchPage } from "./catalog";

vi.mock("@/lib/saleor", () => ({
  getSaleorChannel: () => "default-channel",
  getSaleorRootCategorySlug: () => "ntms-81-products",
  saleorFetch: vi.fn(),
}));

const mockedSaleorFetch = vi.mocked(saleorFetch);

describe("Saleor category catalog", () => {
  beforeEach(() => {
    mockedSaleorFetch.mockReset();
  });

  test("walks collection cursors to expose products beyond the first page", async () => {
    mockedSaleorFetch
      .mockResolvedValueOnce(
        categoryResponse({
          categoryCursor: "category-page-2",
          categoryHasNextPage: true,
          collectionCursor: "collection-page-2",
          collectionHasNextPage: true,
          productSlug: "first-page-product",
        }),
      )
      .mockResolvedValueOnce(
        categoryResponse({
          categoryCursor: null,
          categoryHasNextPage: false,
          collectionCursor: "collection-page-3",
          collectionHasNextPage: true,
          productSlug: "second-page-product",
        }),
      );

    const page = await getNtmsSaleorCategoryPage("ntms-103-machines", {
      page: "2",
      sort: "name-a-z",
    });

    expect(mockedSaleorFetch).toHaveBeenCalledTimes(2);
    expect(mockedSaleorFetch.mock.calls[1]?.[0].variables).toMatchObject({
      after: "collection-page-2",
      first: 24,
      includeCategory: false,
      includeCollection: true,
    });
    expect(page).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
      nextPageCursor: "collection-page-3",
      page: 2,
      pageSize: 24,
      totalPages: 3,
      totalProducts: 50,
    });
    expect(page?.products.map((product) => product.slug)).toEqual([
      "second-page-product",
    ]);
  });

  test("uses a link cursor to reach a deep page with one page query", async () => {
    mockedSaleorFetch
      .mockResolvedValueOnce(
        categoryResponse({
          categoryCursor: "category-page-2",
          categoryHasNextPage: true,
          collectionCursor: "collection-page-2",
          collectionHasNextPage: true,
          collectionTotal: 140,
          productSlug: "first-page-product",
        }),
      )
      .mockResolvedValueOnce(
        categoryResponse({
          categoryCursor: null,
          categoryHasNextPage: false,
          collectionCursor: null,
          collectionHasNextPage: false,
          collectionTotal: 140,
          productSlug: "sixth-page-product",
        }),
      );

    const page = await getNtmsSaleorCategoryPage("ntms-103-machines", {
      cursor: "collection-page-5",
      page: "6",
      sort: "name-a-z",
    });

    expect(mockedSaleorFetch).toHaveBeenCalledTimes(2);
    expect(mockedSaleorFetch.mock.calls[1]?.[0].variables).toMatchObject({
      after: "collection-page-5",
      includeCategory: false,
      includeCollection: true,
    });
    expect(page).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
      nextPageCursor: null,
      page: 6,
      totalPages: 6,
    });
    expect(page?.products[0]?.slug).toBe("sixth-page-product");
  });

  test("uses a link cursor to reach a deep search page directly", async () => {
    mockedSaleorFetch.mockResolvedValueOnce({
      products: {
        totalCount: 140,
        pageInfo: { endCursor: null, hasNextPage: false },
        edges: [
          {
            cursor: "result-cursor",
            node: productNode("sixth-search-page-product"),
          },
        ],
      },
    });

    const page = await getNtmsSaleorSearchPage({
      cursor: "search-page-5",
      page: "6",
      query: "ink",
      sort: "name-a-z",
    });

    expect(mockedSaleorFetch).toHaveBeenCalledTimes(1);
    expect(mockedSaleorFetch.mock.calls[0]?.[0].variables).toMatchObject({
      after: "search-page-5",
      first: 24,
      search: "ink",
    });
    expect(page).toMatchObject({
      nextPageCursor: null,
      page: 6,
      totalPages: 6,
      totalProducts: 140,
    });
    expect(page.products[0]?.slug).toBe("sixth-search-page-product");
  });
});

function categoryResponse({
  categoryCursor,
  categoryHasNextPage,
  collectionCursor,
  collectionHasNextPage,
  collectionTotal = 50,
  productSlug,
}: {
  categoryCursor: string | null;
  categoryHasNextPage: boolean;
  collectionCursor: string | null;
  collectionHasNextPage: boolean;
  collectionTotal?: number;
  productSlug: string;
}) {
  return {
    category: {
      id: "category-machines",
      name: "Machines",
      slug: "ntms-103-machines",
      children: { edges: [] },
      products: {
        totalCount: 3,
        pageInfo: {
          endCursor: categoryCursor,
          hasNextPage: categoryHasNextPage,
        },
        edges: [{ node: productNode(`category-${productSlug}`) }],
      },
    },
    collection: {
      id: "collection-machines",
      name: "Machines",
      slug: "ntms-103-machines",
      products: {
        totalCount: collectionTotal,
        pageInfo: {
          endCursor: collectionCursor,
          hasNextPage: collectionHasNextPage,
        },
        edges: [{ node: productNode(productSlug) }],
      },
    },
  };
}

function productNode(slug: string) {
  return {
    id: `product-${slug}`,
    name: slug,
    slug,
    variants: [
      {
        id: `variant-${slug}`,
        quantityAvailable: 10,
        sku: `SKU-${slug}`,
      },
    ],
  };
}
