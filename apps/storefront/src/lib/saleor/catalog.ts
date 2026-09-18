export function normalizeSaleorImageUrl(url?: string | null): string {
  if (!url) return "";
  let canonical = url;
  if (canonical.includes("/thumbnails/products/")) {
    canonical = canonical.replace("/thumbnails/products/", "/products/");
  } else if (canonical.includes("/thumbnails/")) {
    canonical = canonical.replace("/thumbnails/", "/");
  }
  return canonical
    .replace(/_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i, ".$1")
    .replace(/_thu_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i, ".$1")
    .replace(/_thum_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i, ".$1");
}

import { defaultSort, type SortFilterItem, sorting } from "@/lib/constants";
import {
  getSaleorChannel,
  getSaleorRootCategorySlug,
  saleorFetch,
} from "@/lib/saleor";

type SaleorMoney = {
  amount: number;
  currency: string;
};

type SaleorVariantAttributeNode = {
  attribute?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  values?:
    | {
        id: string;
        name: string;
      }[]
    | null;
};

type SaleorVariantMediaNode = {
  alt?: string | null;
  type?: string | null;
  url: string;
};

type SaleorCategoryNode = {
  id: string;
  name: string;
  slug: string;
  products?: {
    totalCount?: number | null;
    edges?: {
      node: {
        name: string;
        thumbnail?: {
          url: string;
          alt?: string | null;
        } | null;
        media?: {
          url: string;
          alt?: string | null;
          type?: string | null;
        }[];
      };
    }[];
  } | null;
};

type SaleorProductNode = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail?: {
    url: string;
    alt?: string | null;
  } | null;
  media?: {
    url: string;
    alt?: string | null;
    type?: string | null;
  }[];
  category?: {
    id: string;
    name: string;
    slug: string;
    products?: {
      totalCount?: number | null;
    } | null;
  } | null;
  relatedCategory?: {
    products?: {
      edges: {
        node: SaleorProductNode;
      }[];
    } | null;
  } | null;
  pricing?: {
    priceRange?: {
      start?: {
        gross?: SaleorMoney | null;
      } | null;
    } | null;
    priceRangePrior?: {
      start?: {
        gross?: SaleorMoney | null;
      } | null;
    } | null;
  } | null;
  variants?: {
    id: string;
    name?: string | null;
    sku?: string | null;
    quantityAvailable?: number | null;
    pricing?: {
      price?: {
        gross?: SaleorMoney | null;
      } | null;
      pricePrior?: {
        gross?: SaleorMoney | null;
      } | null;
    } | null;
    attributes?: SaleorVariantAttributeNode[] | null;
    selectionAttributes?: SaleorVariantAttributeNode[] | null;
    nonSelectionAttributes?: SaleorVariantAttributeNode[] | null;
    media?: SaleorVariantMediaNode[] | null;
  }[];
};

type NtmsSaleorCatalogResponse = {
  shop: {
    name: string;
    useLegacyShippingZoneStockAvailability?: boolean | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    products?: {
      totalCount?: number | null;
    } | null;
    children?: {
      edges: {
        node: SaleorCategoryNode;
      }[];
    } | null;
  } | null;
  categories?: {
    edges: {
      node: SaleorCategoryNode;
    }[];
  } | null;
  products?: {
    totalCount?: number | null;
    edges: {
      node: SaleorProductNode;
    }[];
  } | null;
  collections?: {
    edges: {
      node: SaleorCategoryNode;
    }[];
  } | null;
  curatedCollections?: {
    edges: {
      node: SaleorCategoryNode;
    }[];
  } | null;
};

type NtmsSaleorCategoryPageResponse = {
  category?: {
    id: string;
    name: string;
    slug: string;
    products?: {
      totalCount?: number | null;
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
      edges: {
        node: SaleorProductNode;
      }[];
    } | null;
    children?: {
      edges: {
        node: SaleorCategoryNode;
      }[];
    } | null;
  } | null;
  collection?: {
    id: string;
    name: string;
    slug: string;
    products?: {
      totalCount?: number | null;
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
      edges: {
        node: SaleorProductNode;
      }[];
    } | null;
  } | null;
};

type NtmsSaleorCategoryProductsConnection = NonNullable<
  NonNullable<NtmsSaleorCategoryPageResponse["category"]>["products"]
>;

type NtmsSaleorCategoryProductsPageResponse = {
  category?: {
    products?: NtmsSaleorCategoryProductsConnection | null;
  } | null;
  collection?: {
    products?: NtmsSaleorCategoryProductsConnection | null;
  } | null;
};

type NtmsSaleorCategoryCollectionOverridesResponse = {
  collections?: {
    edges: {
      node: SaleorCategoryNode;
    }[];
  } | null;
};

type NtmsSaleorProductPageResponse = {
  product?: SaleorProductNode | null;
};

type NtmsSaleorNavigationCategoriesResponse = {
  categories?: {
    edges: {
      node: SaleorCategoryNode;
    }[];
  } | null;
};

type NtmsSaleorProductsConnectionResponse = {
  products?: {
    totalCount?: number | null;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
    edges: {
      cursor: string;
      node: SaleorProductNode;
    }[];
  } | null;
};

type NtmsSaleorSitemapProductsResponse = {
  products?: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
    edges: {
      node: {
        slug: string;
        category?: {
          slug: string;
        } | null;
      };
    }[];
  } | null;
};

type NtmsSaleorSortSlug = SortFilterItem["slug"];

type NtmsSaleorPageInput = number | string | null | undefined;

type NtmsSaleorSearchOptions = {
  cursor?: string;
  page?: NtmsSaleorPageInput;
  query?: string;
  sort?: string;
};

type NtmsSaleorCategoryPageOptions = {
  cursor?: string;
  page?: NtmsSaleorPageInput;
  sort?: string;
};

type SaleorProductOrder = {
  channel: string;
  direction: "ASC" | "DESC";
  field: "NAME" | "PRICE";
};

export type NtmsSaleorCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  imageUrl: string;
  imageAlt: string;
};

export type NtmsSaleorProduct = {
  id: string;
  name: string;
  slug: string;
  variantId: string;
  variantCount: number;
  imageUrl: string;
  imageAlt: string;
  categoryName: string;
  price: SaleorMoney | null;
  priorPrice: SaleorMoney | null;
  sku: string;
  quantityAvailable: number | null;
};

export type NtmsSaleorProductMedia = {
  url: string;
  alt: string;
};

export type NtmsSaleorVariantAttributeValue = {
  id: string;
  name: string;
};

export type NtmsSaleorVariantAttribute = {
  id: string;
  name: string;
  slug: string;
  values: NtmsSaleorVariantAttributeValue[];
};

export type NtmsSaleorProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: SaleorMoney | null;
  priorPrice: SaleorMoney | null;
  quantityAvailable: number | null;
  attributes: NtmsSaleorVariantAttribute[];
  selectionAttributes?: NtmsSaleorVariantAttribute[];
  nonSelectionAttributes?: NtmsSaleorVariantAttribute[];
  media?: NtmsSaleorProductMedia[];
};

export type NtmsSaleorCatalogPreview = {
  shopName: string;
  channel: string;
  rootCategory: NtmsSaleorCategory | null;
  categories: NtmsSaleorCategory[];
  curatedCollections: NtmsSaleorCategory[];
  products: NtmsSaleorProduct[];
  totalProducts: number;
  stockAvailabilityMode?: "legacy" | "direct";
  useLegacyShippingZoneStockAvailability?: boolean;
};

export type NtmsSaleorCategoryPage = {
  channel: string;
  category: NtmsSaleorCategory;
  children: NtmsSaleorCategory[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isCollectionOnly: boolean;
  nextPageCursor: string | null;
  page: number;
  pageSize: number;
  products: NtmsSaleorProduct[];
  sort: NtmsSaleorSortSlug;
  totalPages: number;
  totalProducts: number;
};

export type NtmsSaleorProductPage = {
  channel: string;
  product: NtmsSaleorProduct & {
    description: string;
    media: NtmsSaleorProductMedia[];
    variants: NtmsSaleorProductVariant[];
    category: NtmsSaleorCategory | null;
  };
  relatedProducts: NtmsSaleorProduct[];
};

export type NtmsSaleorSearchPage = {
  channel: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageCursor: string | null;
  page: number;
  pageSize: number;
  query: string;
  products: NtmsSaleorProduct[];
  sort: NtmsSaleorSortSlug;
  totalPages: number;
  totalProducts: number;
  searchedProducts: number;
};

export type NtmsSaleorSitemapEntry = {
  path: string;
};

const saleorProductsPageSize = 24;
const saleorMaxPage = 100;

const saleorProductOrderBySlug: Record<
  NtmsSaleorSortSlug,
  Omit<SaleorProductOrder, "channel">
> = {
  "name-a-z": { direction: "ASC", field: "NAME" },
  "name-z-a": { direction: "DESC", field: "NAME" },
  "price-asc": { direction: "ASC", field: "PRICE" },
  "price-desc": { direction: "DESC", field: "PRICE" },
};

const ntmsSaleorCatalogQuery = `
  query NtmsSaleorCatalogPreview($channel: String!, $rootSlug: String!) {
    shop {
      name
      useLegacyShippingZoneStockAvailability
    }
    categories(first: 48, level: 0) {
      edges {
        node {
          id
          name
          slug
          products(first: 1, channel: $channel) {
            totalCount
            edges {
              node {
                name
                thumbnail(size: 384) { url alt }
                media { url alt type }
              }
            }
          }
        }
      }
    }
    category(slug: $rootSlug) {
      id
      name
      slug
      products(first: 0, channel: $channel) { totalCount }
      children(first: 24) {
        edges {
          node {
            id
            name
            slug
            products(first: 1, channel: $channel) {
              totalCount
              edges {
                node {
                  name
                  thumbnail(size: 384) { url alt }
                media { url alt type }
                }
              }
            }
          }
        }
      }
    }
    products(first: 12, channel: $channel) {
      totalCount
      edges {
        node {
          id
          name
          slug
          thumbnail(size: 512) { url alt }
          media { url alt type }
          category { name slug }
          pricing {
            priceRange { start { gross { amount currency } } }
            priceRangePrior { start { gross { amount currency } } }
          }
          variants { id sku quantityAvailable }
        }
      }
    }
    collections(first: 48, channel: $channel) {
      edges {
        node {
          id
          name
          slug
          products(first: 1) {
            totalCount
            edges {
              node {
                name
                thumbnail(size: 384) { url alt }
                media { url alt type }
              }
            }
          }
        }
      }
    }
    curatedCollections: collections(
      first: 12
      channel: $channel
      filter: { slugs: ["ntms-brand-eternal-ink", "ntms-brand-dermaglo-ink", "ntms-brand-fk-irons"] }
    ) {
      edges {
        node {
          id
          name
          slug
          products(first: 1) {
            totalCount
            edges {
              node {
                name
                thumbnail(size: 384) { url alt }
                media { url alt type }
              }
            }
          }
        }
      }
    }
  }
`;

const ntmsSaleorNavigationCategoriesQuery = `
  query NtmsSaleorNavigationCategories($channel: String!) {
    categories(first: 48, level: 0) {
      edges {
        node {
          id
          name
          slug
          products(first: 0, channel: $channel) { totalCount }
        }
      }
    }
  }
`;

const saleorProductBaseFields = `
  id
  name
  slug
  thumbnail(size: 512) { url alt }
          media { url alt type }
  category {
    id
    name
    slug
    products(first: 0, channel: $channel) { totalCount }
  }
  pricing {
    priceRange { start { gross { amount currency } } }
    priceRangePrior { start { gross { amount currency } } }
  }
`;

const saleorProductVariantFields = `
  id
  name
  sku
  quantityAvailable
  pricing {
    price { gross { amount currency } }
    pricePrior { gross { amount currency } }
  }
`;

const saleorProductCardFields = `
  ${saleorProductBaseFields}
  variants { ${saleorProductVariantFields} }
`;

const saleorProductDetailFields = `
  ${saleorProductBaseFields}
  variants {
    ${saleorProductVariantFields}
    media { url alt type }
    attributes(variantSelection: ALL) {
      attribute { id name slug }
      values { id name }
    }
    selectionAttributes: attributes(variantSelection: VARIANT_SELECTION) {
      attribute { id name slug }
      values { id name }
    }
    nonSelectionAttributes: attributes(variantSelection: NOT_VARIANT_SELECTION) {
      attribute { id name slug }
      values { id name }
    }
  }
`;

const ntmsSaleorCategoryPageQuery = `
  query NtmsSaleorCategoryPage(
    $categoryAfter: String
    $channel: String!
    $collectionAfter: String
    $first: Int!
    $slug: String!
    $sortBy: ProductOrder
  ) {
    category(slug: $slug) {
      id
      name
      slug
      products(first: $first, after: $categoryAfter, channel: $channel, sortBy: $sortBy) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            ${saleorProductCardFields}
          }
        }
      }
      children(first: 32) {
        edges {
          node {
            id
            name
            slug
            products(first: 1, channel: $channel) {
              totalCount
              edges {
                node {
                  name
                  thumbnail(size: 384) { url alt }
                media { url alt type }
                }
              }
            }
          }
        }
      }
    }
    collection(slug: $slug, channel: $channel) {
      id
      name
      slug
      products(first: $first, after: $collectionAfter, sortBy: $sortBy) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            ${saleorProductCardFields}
          }
        }
      }
    }
  }
`;

const ntmsSaleorCategoryProductsPageQuery = `
  query NtmsSaleorCategoryProductsPage(
    $after: String!
    $channel: String!
    $first: Int!
    $includeCategory: Boolean!
    $includeCollection: Boolean!
    $slug: String!
    $sortBy: ProductOrder
  ) {
    category(slug: $slug) @include(if: $includeCategory) {
      products(first: $first, after: $after, channel: $channel, sortBy: $sortBy) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            ${saleorProductCardFields}
          }
        }
      }
    }
    collection(slug: $slug, channel: $channel) @include(if: $includeCollection) {
      products(first: $first, after: $after, sortBy: $sortBy) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            ${saleorProductCardFields}
          }
        }
      }
    }
  }
`;

const ntmsSaleorCategoryCollectionOverridesQuery = `
  query NtmsSaleorCategoryCollectionOverrides($channel: String!, $slugs: [String!]!) {
    collections(
      first: 100
      channel: $channel
      filter: { slugs: $slugs }
    ) {
      edges {
        node {
          id
          name
          slug
          products(first: 1) {
            totalCount
            edges {
              node {
                name
                thumbnail(size: 384) { url alt }
                media { url alt type }
              }
            }
          }
        }
      }
    }
  }
`;

const ntmsSaleorProductPageQuery = `
  query NtmsSaleorProductPage($channel: String!, $slug: String!) {
    product(slug: $slug, channel: $channel) {
      ${saleorProductDetailFields}
      description
      media { url alt type }
      relatedCategory: category {
        products(first: 9, channel: $channel) {
          edges {
            node {
              ${saleorProductCardFields}
            }
          }
        }
      }
    }
  }
`;

const ntmsSaleorProductsConnectionQuery = `
  query NtmsSaleorProductsConnection(
    $after: String
    $channel: String!
    $first: Int!
    $search: String
    $sortBy: ProductOrder
  ) {
    products(
      first: $first
      after: $after
      channel: $channel
      search: $search
      sortBy: $sortBy
    ) {
      totalCount
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          ${saleorProductCardFields}
        }
      }
    }
  }
`;

const ntmsSaleorSitemapProductsQuery = `
  query NtmsSaleorSitemapProducts(
    $after: String
    $channel: String!
    $first: Int!
  ) {
    products(first: $first, after: $after, channel: $channel) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          slug
          category { slug }
        }
      }
    }
  }
`;

export async function getNtmsSaleorCatalogPreview(): Promise<NtmsSaleorCatalogPreview> {
  const channel = getSaleorChannel();
  const rootSlug = getSaleorRootCategorySlug();
  const data = await saleorFetch<
    NtmsSaleorCatalogResponse,
    { channel: string; rootSlug: string }
  >({
    query: ntmsSaleorCatalogQuery,
    variables: { channel, rootSlug },
  });

  const rootCategory = data.category ? mapCategory(data.category) : null;
  const collectionOverrides = new Map(
    (data.collections?.edges ?? []).map((edge) => [
      edge.node.slug,
      mapCategory(edge.node),
    ]),
  );
  const rootChildCategories = (data.category?.children?.edges ?? [])
    .map((edge) => mapCategory(edge.node))
    .map((category) =>
      applyCollectionOverride(category, collectionOverrides.get(category.slug)),
    )
    .filter((category) => category.productCount > 0)
    .sort((left, right) => right.productCount - left.productCount);
  const topLevelCategories = (data.categories?.edges ?? [])
    .map((edge) => mapCategory(edge.node))
    .map((category) =>
      applyCollectionOverride(category, collectionOverrides.get(category.slug)),
    )
    .filter(
      (category) =>
        category.productCount > 0 &&
        category.slug !== rootSlug &&
        category.slug !== "default-category",
    )
    .sort((left, right) => right.productCount - left.productCount);
  const categories =
    topLevelCategories.length > 0 ? topLevelCategories : rootChildCategories;

  const useLegacy = data.shop.useLegacyShippingZoneStockAvailability ?? true;

  return {
    shopName: data.shop.name,
    channel,
    rootCategory,
    categories,
    curatedCollections: (data.curatedCollections?.edges ?? [])
      .map((edge) => mapCategory(edge.node))
      .filter((collection) => collection.productCount > 0),
    products: (data.products?.edges ?? []).map((edge) => mapProduct(edge.node)),
    totalProducts: data.products?.totalCount ?? 0,
    stockAvailabilityMode: useLegacy ? "legacy" : "direct",
    useLegacyShippingZoneStockAvailability: useLegacy,
  };
}

const saleorStockAvailabilityModeQuery = `
  query SaleorStockAvailabilityMode {
    shop {
      name
      useLegacyShippingZoneStockAvailability
    }
  }
`;

type SaleorStockAvailabilityModeResponse = {
  shop: {
    name: string;
    useLegacyShippingZoneStockAvailability?: boolean | null;
  };
};

export async function getSaleorStockAvailabilityMode(): Promise<{
  mode: "legacy" | "direct";
  useLegacyShippingZoneStockAvailability: boolean;
}> {
  const data = await saleorFetch<
    SaleorStockAvailabilityModeResponse,
    Record<string, never>
  >({
    query: saleorStockAvailabilityModeQuery,
    variables: {},
  });
  const useLegacy = data.shop.useLegacyShippingZoneStockAvailability ?? true;
  return {
    mode: useLegacy ? "legacy" : "direct",
    useLegacyShippingZoneStockAvailability: useLegacy,
  };
}

export async function getNtmsSaleorNavigationCategories(): Promise<
  NtmsSaleorCategory[]
> {
  const channel = getSaleorChannel();
  const data = await saleorFetch<
    NtmsSaleorNavigationCategoriesResponse,
    { channel: string }
  >({
    query: ntmsSaleorNavigationCategoriesQuery,
    variables: { channel },
  });

  return (data.categories?.edges ?? [])
    .map((edge) => mapCategory(edge.node))
    .filter(
      (category) =>
        category.slug !== "default-category" &&
        !category.slug.startsWith("ntca-") &&
        category.productCount > 0,
    );
}

export async function getNtmsSaleorCategoryPage(
  slug: string,
  options: NtmsSaleorCategoryPageOptions = {},
): Promise<NtmsSaleorCategoryPage | null> {
  const channel = getSaleorChannel();
  const requestedCursor = normalizeSaleorCursor(options.cursor);
  const requestedPage = normalizePage(options.page);
  const sort = getSaleorSortSlug(options.sort);
  const sortBy = getSaleorProductOrder(sort, channel);
  let currentPage = 1;
  const data = await saleorFetch<
    NtmsSaleorCategoryPageResponse,
    {
      categoryAfter: null;
      channel: string;
      collectionAfter: null;
      first: number;
      slug: string;
      sortBy: SaleorProductOrder;
    }
  >({
    query: ntmsSaleorCategoryPageQuery,
    variables: {
      categoryAfter: null,
      channel,
      collectionAfter: null,
      first: saleorProductsPageSize,
      slug,
      sortBy,
    },
  });

  if (!data.category && !data.collection) {
    return null;
  }

  const initialCategoryConnection = data.category?.products ?? null;
  const initialCollectionConnection = data.collection?.products ?? null;
  const useCollection =
    (initialCollectionConnection?.totalCount ?? 0) >
    (initialCategoryConnection?.totalCount ?? 0);
  let selectedConnection = useCollection
    ? initialCollectionConnection
    : initialCategoryConnection;

  if (requestedPage > 1 && requestedCursor) {
    try {
      selectedConnection = await getNtmsSaleorCategoryProductsPage({
        after: requestedCursor,
        channel,
        slug,
        sortBy,
        useCollection,
      });
      if (selectedConnection) {
        currentPage = requestedPage;
      }
    } catch (error) {
      console.warn(
        "Unable to use the supplied Saleor category cursor; falling back to page traversal.",
        error instanceof Error ? error.message : error,
      );
      selectedConnection = useCollection
        ? initialCollectionConnection
        : initialCategoryConnection;
    }
  }

  while (
    currentPage < requestedPage &&
    selectedConnection?.pageInfo.hasNextPage
  ) {
    const after = selectedConnection.pageInfo.endCursor;
    if (!after) {
      break;
    }

    const nextConnection = await getNtmsSaleorCategoryProductsPage({
      after,
      channel,
      slug,
      sortBy,
      useCollection,
    });
    if (!nextConnection) {
      break;
    }

    selectedConnection = nextConnection;
    currentPage += 1;
  }

  const collectionOverride = data.collection
    ? mapCategory(data.collection)
    : null;
  const categoryBase = data.category
    ? mapCategory(data.category)
    : collectionOverride;
  if (!categoryBase) {
    return null;
  }

  const category = data.category
    ? applyCollectionOverride(categoryBase, collectionOverride)
    : categoryBase;
  const childSlugs =
    data.category?.children?.edges.map((edge) => edge.node.slug) ?? [];
  const collectionOverrideData = childSlugs.length
    ? await saleorFetch<
        NtmsSaleorCategoryCollectionOverridesResponse,
        { channel: string; slugs: string[] }
      >({
        query: ntmsSaleorCategoryCollectionOverridesQuery,
        variables: { channel, slugs: childSlugs },
      })
    : null;
  const collectionOverrides = new Map(
    (collectionOverrideData?.collections?.edges ?? []).map((edge) => [
      edge.node.slug,
      mapCategory(edge.node),
    ]),
  );
  const children = (data.category?.children?.edges ?? [])
    .map((edge) =>
      applyCollectionOverride(
        mapCategory(edge.node),
        collectionOverrides.get(edge.node.slug),
      ),
    )
    .filter((child) => child.productCount > 0)
    .sort((left, right) => right.productCount - left.productCount);
  const categoryDirectTotal = data.category?.products?.totalCount ?? 0;
  const collectionTotal = collectionOverride?.productCount ?? 0;
  const products = (selectedConnection?.edges ?? []).map((edge) =>
    mapProduct(edge.node),
  );
  const totalProducts = Math.max(collectionTotal, categoryDirectTotal);
  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / saleorProductsPageSize),
  );
  const page = totalProducts === 0 ? 1 : Math.min(currentPage, totalPages);

  return {
    channel,
    category,
    children,
    hasNextPage: selectedConnection?.pageInfo.hasNextPage ?? false,
    hasPreviousPage: page > 1,
    isCollectionOnly: !data.category,
    nextPageCursor: selectedConnection?.pageInfo.hasNextPage
      ? (selectedConnection.pageInfo.endCursor ?? null)
      : null,
    page,
    pageSize: saleorProductsPageSize,
    products,
    sort,
    totalPages,
    totalProducts,
  };
}

async function getNtmsSaleorCategoryProductsPage({
  after,
  channel,
  slug,
  sortBy,
  useCollection,
}: {
  after: string;
  channel: string;
  slug: string;
  sortBy: SaleorProductOrder;
  useCollection: boolean;
}) {
  const data = await saleorFetch<
    NtmsSaleorCategoryProductsPageResponse,
    {
      after: string;
      channel: string;
      first: number;
      includeCategory: boolean;
      includeCollection: boolean;
      slug: string;
      sortBy: SaleorProductOrder;
    }
  >({
    query: ntmsSaleorCategoryProductsPageQuery,
    variables: {
      after,
      channel,
      first: saleorProductsPageSize,
      includeCategory: !useCollection,
      includeCollection: useCollection,
      slug,
      sortBy,
    },
  });

  return useCollection
    ? (data.collection?.products ?? null)
    : (data.category?.products ?? null);
}

export async function getNtmsSaleorProductPage(
  slug: string,
): Promise<NtmsSaleorProductPage | null> {
  const channel = getSaleorChannel();
  let activeChannel = channel;
  let data = await saleorFetch<
    NtmsSaleorProductPageResponse,
    { channel: string; slug: string }
  >({
    query: ntmsSaleorProductPageQuery,
    variables: { channel: activeChannel, slug },
  });

  // 跨渠道智能防 404 兜底机制：
  // 若当前渠道未上架该商品（如区域特供商品），自动探测备用渠道，避免直访或切站时直接报 404
  if (!data.product) {
    const alternateChannel =
      channel === "default-channel" ? "canada" : "default-channel";
    const fallbackData = await saleorFetch<
      NtmsSaleorProductPageResponse,
      { channel: string; slug: string }
    >({
      query: ntmsSaleorProductPageQuery,
      variables: { channel: alternateChannel, slug },
    });
    if (fallbackData.product) {
      data = fallbackData;
      activeChannel = alternateChannel;
    }
  }

  if (!data.product) {
    return null;
  }

  const product = data.product;
  const relatedProducts = (product.relatedCategory?.products?.edges ?? [])
    .map((edge) => mapProduct(edge.node))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 8);

  return {
    channel: activeChannel,
    product: {
      ...mapProduct(product),
      description: parseSaleorDescription(product.description),
      media: mapProductMedia(product),
      variants: mapProductVariants(product),
      category: product.category ? mapCategory(product.category) : null,
    },
    relatedProducts,
  };
}

export async function getNtmsSaleorSearchPage(
  options: NtmsSaleorSearchOptions | string | undefined,
): Promise<NtmsSaleorSearchPage> {
  const channel = getSaleorChannel();
  const searchOptions =
    typeof options === "string" ? { query: options } : (options ?? {});
  const requestedCursor = normalizeSaleorCursor(searchOptions.cursor);
  const searchQuery = normalizeSearchQuery(searchOptions.query);
  const requestedPage = normalizePage(searchOptions.page);
  const sort = getSaleorSortSlug(searchOptions.sort);
  const sortBy = getSaleorProductOrder(sort, channel);
  let connection: NtmsSaleorProductsConnectionResponse["products"] = null;
  let currentPage = 1;
  let totalProducts = 0;
  let after: string | null = null;

  const fetchConnection = async (cursor: string | null) => {
    const data = await saleorFetch<
      NtmsSaleorProductsConnectionResponse,
      {
        after: string | null;
        channel: string;
        first: number;
        search: string | null;
        sortBy: SaleorProductOrder;
      }
    >({
      query: ntmsSaleorProductsConnectionQuery,
      variables: {
        after: cursor,
        channel,
        first: saleorProductsPageSize,
        search: searchQuery || null,
        sortBy,
      },
    });

    return data.products ?? null;
  };

  if (requestedPage > 1 && requestedCursor) {
    try {
      connection = await fetchConnection(requestedCursor);
      if (connection) {
        currentPage = requestedPage;
        totalProducts = connection.totalCount ?? 0;
      }
    } catch (error) {
      console.warn(
        "Unable to use the supplied Saleor search cursor; falling back to page traversal.",
        error instanceof Error ? error.message : error,
      );
      connection = null;
    }
  }

  if (!connection) {
    while (true) {
      connection = await fetchConnection(after);
      if (!connection) {
        break;
      }

      totalProducts = connection.totalCount ?? totalProducts;
      if (currentPage >= requestedPage || !connection.pageInfo.hasNextPage) {
        break;
      }

      after = connection.pageInfo.endCursor ?? null;
      if (!after) {
        break;
      }

      currentPage += 1;
    }
  }

  const products = (connection?.edges ?? []).map((edge) =>
    mapProduct(edge.node),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / saleorProductsPageSize),
  );
  const page = totalProducts === 0 ? 1 : Math.min(currentPage, totalPages);

  return {
    channel,
    hasNextPage: connection?.pageInfo.hasNextPage ?? false,
    hasPreviousPage: page > 1,
    nextPageCursor: connection?.pageInfo.hasNextPage
      ? (connection.pageInfo.endCursor ?? null)
      : null,
    page,
    pageSize: saleorProductsPageSize,
    query: searchQuery,
    products,
    sort,
    totalPages,
    totalProducts,
    searchedProducts: totalProducts,
  };
}

export async function getNtmsSaleorSitemapEntries(): Promise<
  NtmsSaleorSitemapEntry[]
> {
  const channel = getSaleorChannel();
  const paths = new Set<string>(["/"]);
  const curatedCollections = await saleorFetch<
    {
      collections?: {
        edges: {
          node: {
            slug: string;
            products?: { totalCount?: number | null } | null;
          };
        }[];
      } | null;
    },
    { channel: string }
  >({
    query: `query NtmsSaleorCuratedCollectionSitemap($channel: String!) {
      collections(
        first: 100
        channel: $channel
        filter: { slugs: ["ntms-brand-eternal-ink", "ntms-brand-dermaglo-ink", "ntms-brand-fk-irons"] }
      ) {
        edges { node { slug products(first: 0) { totalCount } } }
      }
    }`,
    variables: { channel },
  });
  for (const edge of curatedCollections.collections?.edges ?? []) {
    if ((edge.node.products?.totalCount ?? 0) > 0) {
      paths.add(`/collections/${edge.node.slug}`);
    }
  }
  let after: string | null = null;

  for (let page = 0; page < 250; page += 1) {
    const data: NtmsSaleorSitemapProductsResponse = await saleorFetch<
      NtmsSaleorSitemapProductsResponse,
      { after: string | null; channel: string; first: number }
    >({
      query: ntmsSaleorSitemapProductsQuery,
      variables: {
        after,
        channel,
        first: 100,
      },
    });
    const connection: NtmsSaleorSitemapProductsResponse["products"] =
      data.products;

    if (!connection) {
      break;
    }

    for (const edge of connection.edges) {
      const productSlug = edge.node.slug.trim();
      const categorySlug = edge.node.category?.slug?.trim();

      if (categorySlug) {
        paths.add(`/collections/${categorySlug}`);
      }
      if (productSlug) {
        paths.add(`/product/${productSlug}`);
      }
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    after = connection.pageInfo.endCursor ?? null;
    if (!after) {
      break;
    }
  }

  return [...paths]
    .sort((left, right) => left.localeCompare(right))
    .map((path) => ({ path }));
}

function mapCategory(category: SaleorCategoryNode): NtmsSaleorCategory {
  const leadProduct = category.products?.edges?.[0]?.node;
  const rawUrl =
    leadProduct?.thumbnail?.url || leadProduct?.media?.[0]?.url || "";
  const imageUrl = normalizeSaleorImageUrl(rawUrl);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category.products?.totalCount ?? 0,
    imageUrl,
    imageAlt:
      leadProduct?.thumbnail?.alt ||
      leadProduct?.media?.[0]?.alt ||
      leadProduct?.name ||
      category.name,
  };
}

function applyCollectionOverride(
  category: NtmsSaleorCategory,
  collection: NtmsSaleorCategory | null | undefined,
): NtmsSaleorCategory {
  if (!collection || collection.productCount <= category.productCount) {
    return category;
  }

  return {
    ...category,
    productCount: collection.productCount,
    imageUrl: collection.imageUrl || category.imageUrl,
    imageAlt: collection.imageAlt || category.imageAlt,
  };
}

function mapProduct(product: SaleorProductNode): NtmsSaleorProduct {
  const firstVariant = product.variants?.[0];
  const resolvedUrl = normalizeSaleorImageUrl(
    product.thumbnail?.url || product.media?.[0]?.url || "",
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    variantId: firstVariant?.id ?? "",
    variantCount: product.variants?.length ?? 0,
    imageUrl: resolvedUrl,
    imageAlt: product.thumbnail?.alt || product.media?.[0]?.alt || product.name,
    categoryName: product.category?.name ?? "Tattoo supply",
    price: product.pricing?.priceRange?.start?.gross ?? null,
    priorPrice: product.pricing?.priceRangePrior?.start?.gross ?? null,
    sku: firstVariant?.sku ?? "",
    quantityAvailable: firstVariant?.quantityAvailable ?? null,
  };
}

function mapProductMedia(product: SaleorProductNode): NtmsSaleorProductMedia[] {
  const media = (product.media ?? [])
    .filter((item) => item.type === "IMAGE" && item.url)
    .map((item) => ({
      url: normalizeSaleorImageUrl(item.url),
      alt: item.alt || product.name,
    }));

  if (media.length > 0) {
    return media;
  }

  return product.thumbnail?.url
    ? [
        {
          url: normalizeSaleorImageUrl(product.thumbnail.url),
          alt: product.thumbnail.alt || product.name,
        },
      ]
    : [];
}

function mapVariantAttributes(
  assignments?: SaleorVariantAttributeNode[] | null,
): NtmsSaleorVariantAttribute[] {
  return (assignments ?? []).flatMap((assignment) => {
    const attribute = assignment.attribute;
    const values = assignment.values ?? [];
    if (!attribute || values.length === 0) {
      return [];
    }
    return [
      {
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        values: values.map((value) => ({ id: value.id, name: value.name })),
      },
    ];
  });
}

function mapProductVariants(
  product: SaleorProductNode,
): NtmsSaleorProductVariant[] {
  return (product.variants ?? []).map((variant) => {
    const defaultAttrs = mapVariantAttributes(variant.attributes);
    const selectionAttrs = mapVariantAttributes(variant.selectionAttributes);
    const nonSelectionAttrs = mapVariantAttributes(
      variant.nonSelectionAttributes,
    );

    return {
      id: variant.id,
      name: variant.name || product.name,
      sku: variant.sku ?? "",
      price: variant.pricing?.price?.gross ?? null,
      priorPrice: variant.pricing?.pricePrior?.gross ?? null,
      quantityAvailable: variant.quantityAvailable ?? null,
      media: (variant.media ?? [])
        .filter((media) => media.type === "IMAGE" && media.url)
        .map((media) => ({
          url: media.url,
          alt: media.alt || variant.name || product.name,
        })),
      attributes:
        defaultAttrs.length > 0
          ? defaultAttrs
          : [...selectionAttrs, ...nonSelectionAttrs],
      selectionAttributes: selectionAttrs,
      nonSelectionAttributes: nonSelectionAttrs,
    };
  });
}

function parseSaleorDescription(description: string | null | undefined) {
  if (!description) {
    return "";
  }

  try {
    const parsed = JSON.parse(description) as {
      blocks?: {
        data?: {
          text?: string;
        };
      }[];
    };

    const text = parsed.blocks
      ?.map((block) => block.data?.text ?? "")
      .filter(Boolean)
      .join("\n\n");

    return stripHtml(text || description);
  } catch {
    return stripHtml(description);
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchQuery(query: string | undefined) {
  return (query ?? "").trim().slice(0, 200);
}

function normalizePage(page: NtmsSaleorPageInput) {
  const pageNumber =
    typeof page === "number" ? page : Number((page ?? "").toString().trim());

  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    return 1;
  }

  return Math.min(Math.floor(pageNumber), saleorMaxPage);
}

function normalizeSaleorCursor(cursor: string | undefined) {
  const normalized = cursor?.trim();
  if (
    !normalized ||
    normalized.length > 1024 ||
    !/^[A-Za-z0-9+/=_-]+$/.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function getSaleorSortSlug(sort: string | undefined): NtmsSaleorSortSlug {
  return (sorting.find((item) => item.slug === sort) ?? defaultSort).slug;
}

function getSaleorProductOrder(
  sort: NtmsSaleorSortSlug,
  channel: string,
): SaleorProductOrder {
  return {
    ...saleorProductOrderBySlug[sort],
    channel,
  };
}
