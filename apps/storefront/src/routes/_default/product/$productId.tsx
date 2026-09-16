import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { ChevronRight } from "lucide-react";
import { Suspense, useId } from "react";
import { z } from "zod";
import ErrorComponent from "@/components/custom/errors/error";
import Footer from "@/components/custom/layout/footer";
import { Gallery } from "@/components/custom/product/gallery";
import { ProductProvider } from "@/components/custom/product/product-context";
import {
  ProductDescription,
  ProductDetails,
} from "@/components/custom/product/product-description";
import { ProductCard } from "@/components/custom/product-card";
import { NtmsSaleorProductPageView } from "@/components/custom/saleor/ntms-product-page";
import { readFragment } from "@/gql/graphql";
import {
  activeChannelQueryOptions,
  collectionProductsQueryOptions,
  menuQueryOptions,
  productQueryOptions,
} from "@/hooks/use-catalog-products";
import {
  createEcommerceMeta,
  createStructuredData,
  getBaseUrl,
  getCanonicalUrl,
  getPublicRobotsDirective,
} from "@/lib/metadata";
import { saleorProductPageQueryOptions } from "@/lib/saleor/catalog-query";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import assetFragment from "@/lib/vendure/fragments/image";
import type searchResultFragment from "@/lib/vendure/fragments/search-result";
import { collectionFragment } from "@/lib/vendure/queries/collection";

const productSearchSchema = z.object({
  variant: z.string().trim().min(1).max(200).optional().catch(undefined),
});

export const Route = createFileRoute("/_default/product/$productId")({
  validateSearch: productSearchSchema,
  loader: async ({ context, params }) => {
    if (isSaleorStorefront) {
      const productPage = await context.queryClient.ensureQueryData(
        saleorProductPageQueryOptions(params.productId),
      );

      if (!productPage) {
        throw notFound();
      }

      return {
        storefrontBackend: "saleor" as const,
        productPage,
      };
    }

    const productPromise = context.queryClient.ensureQueryData(
      productQueryOptions(params.productId),
    );
    const activeChannelPromise = context.queryClient.ensureQueryData(
      activeChannelQueryOptions(),
    );
    const menuPromise = context.queryClient.ensureQueryData(menuQueryOptions());
    const product = await productPromise;

    if (!product) {
      throw notFound();
    }

    const collections = product.collections
      .map((data) => readFragment(collectionFragment, data))
      .filter(
        (collection, index, list) =>
          list.findIndex((entry) => entry.slug === collection.slug) === index,
      );
    const relatedCollection =
      collections.find((collection) => collection.parentId) ?? collections[0];
    const relatedProducts = relatedCollection
      ? (
          await context.queryClient.ensureQueryData(
            collectionProductsQueryOptions({
              collection: relatedCollection.slug,
            }),
          )
        )
          .filter((item) => item.slug !== product.slug)
          .slice(0, 8)
      : [];
    const [activeChannel, menu] = await Promise.all([
      activeChannelPromise,
      menuPromise,
    ]);

    return {
      storefrontBackend: "vendure" as const,
      product,
      activeChannel,
      menu,
      relatedCollection,
      relatedProducts,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    if (loaderData.storefrontBackend === "saleor") {
      const { product } = loaderData.productPage;
      const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);

      return {
        meta: createEcommerceMeta(
          product.name,
          product.description ||
            `${product.name} from the Nuclear Tattoo Supply catalog.`,
          product.imageUrl,
          [
            {
              property: "og:type",
              content: "product",
            },
            {
              property: "product:availability",
              content:
                product.quantityAvailable === null ||
                product.quantityAvailable > 0
                  ? "in stock"
                  : "out of stock",
            },
            {
              property: "og:url",
              content: canonicalUrl,
            },
          ],
        ),
        links: [
          {
            rel: "canonical",
            href: canonicalUrl,
          },
        ],
      };
    }

    const product = loaderData.product;
    const featuredAsset = readFragment(assetFragment, product.featuredAsset);
    const description =
      product.description ||
      `${product.name} - Premium quality product available for purchase.`;

    // Additional product-specific meta tags
    const additionalMeta = [
      {
        name: "robots",
        content: product.enabled
          ? getPublicRobotsDirective()
          : "noindex, nofollow",
      },
      {
        property: "og:type",
        content: "product",
      },
      {
        property: "product:availability",
        content: product.enabled ? "in stock" : "out of stock",
      },
    ];

    return {
      meta: createEcommerceMeta(
        product.name,
        description,
        featuredAsset?.source,
        additionalMeta,
      ),
      links: [
        {
          rel: "canonical",
          href: getCanonicalUrl(`/product/${product.slug}`),
        },
      ],
    };
  },
  scripts: ({ loaderData }) => {
    if (!loaderData) return [];

    if (loaderData.storefrontBackend === "saleor") {
      const { product } = loaderData.productPage;
      const productJsonLd = createStructuredData.saleorProduct({
        ...product,
        variants: product.variants,
      });
      const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);
      const breadcrumbJsonLd = createStructuredData.breadcrumb([
        { name: "Home", url: getBaseUrl() },
        ...(product.category
          ? [
              {
                name: product.category.name,
                url: getCanonicalUrl(`/collections/${product.category.slug}`),
              },
            ]
          : []),
        { name: product.name, url: canonicalUrl },
      ]);

      return [
        {
          type: "application/ld+json",
          children: JSON.stringify(productJsonLd),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd),
        },
      ];
    }

    const product = loaderData.product;
    const activeChannel = loaderData.activeChannel;
    const baseUrl = getBaseUrl();
    const collections = product.collections.map((data) =>
      readFragment(collectionFragment, data),
    );
    const primaryCollection =
      collections.find((collection) => !collection.parentId) ?? collections[0];

    const productJsonLd = createStructuredData.product(
      product,
      activeChannel,
      baseUrl,
    );
    const breadcrumbJsonLd = createStructuredData.breadcrumb([
      { name: "Home", url: baseUrl },
      { name: "Catalog", url: `${baseUrl}/search` },
      ...(primaryCollection
        ? [
            {
              name: primaryCollection.name,
              url: `${baseUrl}/collections/${primaryCollection.slug}`,
            },
          ]
        : []),
      { name: product.name, url: `${baseUrl}/product/${product.slug}` },
    ]);

    return [
      {
        type: "application/ld+json",
        children: JSON.stringify(productJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd),
      },
    ];
  },
  errorComponent: ErrorComponent,
  component: ProductPage,
});

function ProductPage() {
  const loaderData = Route.useLoaderData();
  const { variant } = Route.useSearch();
  const navigate = useNavigate();

  if (loaderData.storefrontBackend === "saleor") {
    return (
      <NtmsSaleorProductPageView
        initialVariantSku={variant}
        onVariantSkuChange={(sku) => {
          navigate({
            to: ".",
            search: (previous) => ({ ...previous, variant: sku }),
            replace: true,
            resetScroll: false,
          });
        }}
        page={loaderData.productPage}
      />
    );
  }

  const { product, menu, activeChannel, relatedCollection, relatedProducts } =
    loaderData;
  const collections = product.collections
    .map((data) => readFragment(collectionFragment, data))
    .filter(
      (collection, index, list) =>
        list.findIndex((entry) => entry.slug === collection.slug) === index,
    );
  const primaryCollection =
    collections.find((collection) => !collection.parentId) ?? collections[0];
  const pairedProducts = relatedProducts.slice(0, 3);
  const moreProducts = relatedProducts.slice(3);

  return (
    <ProductProvider>
      <div className="mx-auto max-w-screen-2xl px-4 pt-5 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex min-w-0 items-center gap-2 overflow-hidden border-b border-black/10/10 pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45"
        >
          <Link
            to="/"
            className="shrink-0 whitespace-nowrap transition hover:text-[#0071e3]"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            to="/search"
            className="shrink-0 whitespace-nowrap transition hover:text-[#0071e3]"
          >
            Catalog
          </Link>
          {primaryCollection ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                to="/collections/$collection"
                params={{ collection: primaryCollection.slug }}
                className="hidden shrink-0 whitespace-nowrap transition hover:text-[#0071e3] sm:inline"
              >
                {primaryCollection.name}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate text-foreground/70">
            {product.name}
          </span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.42fr)_minmax(380px,0.78fr)] lg:items-start xl:gap-8">
          <div className="min-w-0">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[650px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={product.assets
                  .slice(0, 5)
                  .map((data) => readFragment(assetFragment, data))
                  .map((asset) => ({
                    src: asset.source,
                    altText: product.name,
                  }))}
              />
            </Suspense>
          </div>

          <div className="min-w-0">
            <Suspense fallback={null}>
              <ProductDescription
                activeChannel={activeChannel}
                product={product}
              />
            </Suspense>
          </div>
        </div>
        <ProductDetails product={product} />
        <ProductPairingSection
          activeChannelCurrencyCode={activeChannel.defaultCurrencyCode}
          products={pairedProducts}
        />
        <RelatedProductsRail
          activeChannelCurrencyCode={activeChannel.defaultCurrencyCode}
          collectionName={relatedCollection?.name}
          products={moreProducts}
        />
      </div>
      <Footer menu={menu} />
    </ProductProvider>
  );
}

function ProductPairingSection({
  activeChannelCurrencyCode,
  products,
}: {
  activeChannelCurrencyCode: string;
  products: ResultOf<typeof searchResultFragment>[];
}) {
  const headingId = useId();

  if (!products.length) {
    return null;
  }

  return (
    <section
      className="border-t border-black/10/10 py-10 sm:py-12"
      aria-labelledby={headingId}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
            Frequently paired
          </p>
          <h2
            id={headingId}
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground"
          >
            Studio-ready add-ons
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-foreground/55">
          Add compatible gear from the same catalog lane without leaving this
          product page.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.slug}
            currencyCode={activeChannelCurrencyCode}
            product={product}
            variant="rail"
          />
        ))}
      </div>
    </section>
  );
}

function RelatedProductsRail({
  activeChannelCurrencyCode,
  collectionName,
  products,
}: {
  activeChannelCurrencyCode: string;
  collectionName?: string;
  products: ResultOf<typeof searchResultFragment>[];
}) {
  const headingId = useId();

  if (!products.length) {
    return null;
  }

  return (
    <section
      className="border-t border-black/10/10 py-10 sm:py-12"
      aria-labelledby={headingId}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
            Complete the setup
          </p>
          <h2
            id={headingId}
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground"
          >
            {collectionName ? `More from ${collectionName}` : "Related gear"}
          </h2>
        </div>
      </div>
      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [scroll-padding-left:1rem] [scroll-padding-right:1rem] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li
            key={product.slug}
            className="w-[214px] flex-none snap-start sm:w-[244px] lg:w-[268px]"
          >
            <ProductCard
              currencyCode={activeChannelCurrencyCode}
              product={product}
              variant="rail"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
