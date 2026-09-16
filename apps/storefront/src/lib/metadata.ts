import { clientEnv } from "@/env/client";

/**
 * Creates a consistent page title with site name
 */
export const createPageTitle = (pageTitle: string) => {
  return `${pageTitle} | ${clientEnv.VITE_SITE_NAME}`;
};

/**
 * Gets the base URL for the application
 */
export const getBaseUrl = () => {
  const websiteUrl = clientEnv.VITE_WEBSITE_URL;

  if (!websiteUrl) {
    return "http://localhost:3000";
  }

  const baseUrl = /^https?:\/\//i.test(websiteUrl)
    ? websiteUrl
    : `https://${websiteUrl}`;

  return baseUrl.replace(/\/$/, "");
};

export const getCanonicalUrl = (pathname = "/") => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const cleanPath = normalizedPath.split(/[?#]/, 1)[0].replace(/\/{2,}/g, "/");

  return cleanPath === "/" ? getBaseUrl() : `${getBaseUrl()}${cleanPath}`;
};

export const isSearchIndexingEnabled = () =>
  clientEnv.VITE_SEARCH_INDEXING === "enabled";

export const getPublicRobotsDirective = (
  indexingEnabled = isSearchIndexingEnabled(),
) => (indexingEnabled ? "index, follow" : "noindex, nofollow");

export const getSearchRobotsDirective = (
  indexingEnabled = isSearchIndexingEnabled(),
) => (indexingEnabled ? "noindex, follow" : "noindex, nofollow");

export const normalizeMetaDescription = (
  description: string,
  maxLength = 160,
) => {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, Math.max(0, maxLength - 3));
  const lastSpace = truncated.lastIndexOf(" ");
  const readableCut =
    lastSpace >= maxLength * 0.65 ? lastSpace : truncated.length;

  return `${truncated.slice(0, readableCut).trimEnd()}...`;
};

/**
 * Common metadata patterns for different page types
 */
export const getMetaDefaults = () => {
  return {
    // For pages that should not be indexed (account, checkout, etc.)
    private: [
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],

    // Public indexability is explicitly enabled only for the production domain.
    public: [
      {
        name: "robots",
        content: getPublicRobotsDirective(),
      },
    ],

    // Basic Open Graph type override for non-website pages
    webpage: [
      {
        property: "og:type",
        content: "article",
      },
    ],
  };
};

/**
 * Creates a simple meta array with just title and description
 * Everything else inherits from root layout
 */
export const createBasicMeta = (
  title: string,
  description: string,
  isPrivate = false,
  robotsDirective?: string,
) => {
  const defaults = getMetaDefaults();
  const metaDescription = normalizeMetaDescription(description);

  return [
    {
      title: createPageTitle(title),
    },
    {
      name: "description",
      content: metaDescription,
    },
    ...(robotsDirective
      ? [
          {
            name: "robots",
            content: robotsDirective,
          },
        ]
      : isPrivate
        ? defaults.private
        : defaults.public),
  ];
};

/**
 * Enhanced meta for e-commerce pages (products, collections)
 */
export const createEcommerceMeta = (
  title: string,
  description: string,
  imageUrl?: string,
  additionalMeta: Array<{
    name?: string;
    property?: string;
    content: string;
  }> = [],
) => {
  const pageTitle = createPageTitle(title);
  const metaDescription = normalizeMetaDescription(description);
  const hasRobotsOverride = additionalMeta.some(
    (item) => item.name === "robots",
  );

  return [
    {
      title: pageTitle,
    },
    {
      name: "description",
      content: metaDescription,
    },
    ...(hasRobotsOverride ? [] : getMetaDefaults().public),
    // Override Open Graph title and description (inherits the rest)
    {
      property: "og:title",
      content: pageTitle,
    },
    {
      property: "og:description",
      content: metaDescription,
    },
    {
      name: "twitter:title",
      content: pageTitle,
    },
    {
      name: "twitter:description",
      content: metaDescription,
    },
    // Add image if provided
    ...(imageUrl
      ? [
          {
            property: "og:image",
            content: imageUrl,
          },
          {
            name: "twitter:image",
            content: imageUrl,
          },
        ]
      : []),
    // Add any additional meta tags
    ...additionalMeta,
  ];
};

/**
 * Creates structured data for different content types
 */
export const createStructuredData = {
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),

  product: (
    product: {
      id: string;
      slug: string;
      name: string;
      description?: string | null;
      enabled?: boolean | null;
    },
    activeChannel: {
      defaultCurrencyCode: string;
    },
    baseUrl: string,
  ) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `${product.name} - Available at ${clientEnv.VITE_SITE_NAME}`,
    url: `${baseUrl}/product/${product.slug}`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: clientEnv.VITE_SITE_NAME,
    },
    offers: {
      "@type": "AggregateOffer",
      availability: product.enabled
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: activeChannel.defaultCurrencyCode,
    },
  }),

  saleorProduct: (product: {
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    sku: string;
    price: SaleorStructuredDataMoney | null;
    quantityAvailable: number | null;
    variants: Array<{
      sku: string;
      price: SaleorStructuredDataMoney | null;
      quantityAvailable: number | null;
    }>;
  }) => {
    const pricedVariants = product.variants.filter(
      (
        variant,
      ): variant is typeof variant & { price: SaleorStructuredDataMoney } =>
        Boolean(variant.price),
    );
    const prices = pricedVariants.map((variant) => variant.price.amount);
    const fallbackPrice = product.price?.amount;
    const lowestPrice = prices.length ? Math.min(...prices) : fallbackPrice;
    const highestPrice = prices.length ? Math.max(...prices) : fallbackPrice;
    const currency =
      pricedVariants[0]?.price.currency ?? product.price?.currency;
    const hasStock = product.variants.some(
      (variant) =>
        variant.quantityAvailable === null || variant.quantityAvailable > 0,
    );
    const availability = hasStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
    const url = getCanonicalUrl(`/product/${product.slug}`);
    const offers =
      typeof lowestPrice === "number" &&
      typeof highestPrice === "number" &&
      currency
        ? pricedVariants.length <= 1
          ? {
              "@type": "Offer",
              availability,
              price: lowestPrice,
              priceCurrency: currency,
              url,
            }
          : {
              "@type": "AggregateOffer",
              availability,
              highPrice: highestPrice,
              lowPrice: lowestPrice,
              offerCount: pricedVariants.length,
              priceCurrency: currency,
              url,
            }
        : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.description ||
        `${product.name} - Available at ${clientEnv.VITE_SITE_NAME}`,
      ...(product.imageUrl ? { image: product.imageUrl } : {}),
      ...(product.sku ? { sku: product.sku } : {}),
      url,
      brand: {
        "@type": "Brand",
        name: clientEnv.VITE_SITE_NAME,
      },
      ...(offers ? { offers } : {}),
    };
  },
};

type SaleorStructuredDataMoney = {
  amount: number;
  currency: string;
};
