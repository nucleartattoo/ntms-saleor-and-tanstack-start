import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowDownAZ,
  ArrowRight,
  ChevronDown,
  Filter,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import ErrorComponent from "@/components/custom/errors/error";
import Grid from "@/components/custom/grid";
import ProductGridItems from "@/components/custom/layout/product-grid-items";
import { CollectionProvider } from "@/components/custom/layout/search/collection-context";
import Facets from "@/components/custom/layout/search/facets";
import FilterItemDropdown from "@/components/custom/layout/search/filter/dropdown";
import { MobileCatalogActions } from "@/components/custom/layout/search/mobile-catalog-actions";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { NtmsSaleorCatalogPending } from "@/components/custom/saleor/ntms-catalog-pending";
import { NtmsSaleorCategoryPageView } from "@/components/custom/saleor/ntms-category-page";
import ProductGridSkeleton from "@/components/custom/skeletons/grid";
import { Button } from "@/components/ui/button";
import {
  activeChannelQueryOptions,
  collectionFacetValuesQueryOptions,
  collectionProductsQueryOptions,
  collectionQueryOptions,
  createFacetValueFilters,
  facetsQueryOptions,
  useCollectionProducts,
} from "@/hooks/use-catalog-products";
import { sorting } from "@/lib/constants";
import {
  createEcommerceMeta,
  createStructuredData,
  getBaseUrl,
  getCanonicalUrl,
} from "@/lib/metadata";
import { saleorCategoryPageQueryOptions } from "@/lib/saleor/catalog-query";
import { searchSchema } from "@/lib/search-schema";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_default/_search/collections/$collection",
)({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, params: { collection }, deps: { search } }) => {
    if (isSaleorStorefront) {
      const categoryPage = await context.queryClient.ensureQueryData(
        saleorCategoryPageQueryOptions({
          collection,
          cursor: search.after,
          page: search.page,
          sort: search.sort,
        }),
      );

      if (!categoryPage) {
        throw notFound();
      }

      return {
        storefrontBackend: "saleor" as const,
        categoryPage,
      };
    }

    const collectionData = await context.queryClient.ensureQueryData(
      collectionQueryOptions(collection),
    );

    if (!collectionData) {
      throw notFound();
    }

    const facets = await context.queryClient.ensureQueryData(
      facetsQueryOptions(),
    );
    const facetValueFilters = createFacetValueFilters(
      search,
      facets.map((facet) => facet.code),
    );

    const [products, activeChannel] = await Promise.all([
      context.queryClient.ensureQueryData(
        collectionProductsQueryOptions({
          collection,
          facetValueFilters,
          sort: search.sort,
        }),
      ),
      context.queryClient.ensureQueryData(activeChannelQueryOptions()),
      context.queryClient.ensureQueryData(
        collectionFacetValuesQueryOptions(collection),
      ),
    ]);

    return {
      storefrontBackend: "vendure" as const,
      collection: collectionData,
      products,
      activeChannel,
      facets,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    if (loaderData.storefrontBackend === "saleor") {
      const { category } = loaderData.categoryPage;
      const canonicalUrl = getCanonicalUrl(`/collections/${category.slug}`);
      return {
        meta: createEcommerceMeta(
          category.name,
          `Browse ${category.name} products from the Nuclear Tattoo Supply catalog.`,
          category.imageUrl || undefined,
          [{ property: "og:url", content: canonicalUrl }],
        ),
        links: [
          {
            rel: "canonical",
            href: canonicalUrl,
          },
        ],
      };
    }

    const collection = loaderData.collection;
    const description =
      collection.description ||
      `Browse products in the ${collection.name} collection`;

    return {
      meta: createEcommerceMeta(collection.name, description),
      links: [
        {
          rel: "canonical",
          href: getCanonicalUrl(`/collections/${collection.slug}`),
        },
      ],
    };
  },
  scripts: ({ loaderData }) => {
    if (!loaderData) return [];

    const category =
      loaderData.storefrontBackend === "saleor"
        ? loaderData.categoryPage.category
        : loaderData.collection;
    const breadcrumbJsonLd = createStructuredData.breadcrumb([
      { name: "Home", url: getBaseUrl() },
      {
        name: category.name,
        url: getCanonicalUrl(`/collections/${category.slug}`),
      },
    ]);

    return [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd),
      },
    ];
  },
  pendingComponent: CollectionPending,
  errorComponent: ErrorComponent,
  component: RouteComponent,
});

function CollectionPending() {
  return isSaleorStorefront ? (
    <NtmsSaleorCatalogPending label="Loading collection" />
  ) : (
    <ProductGridSkeleton />
  );
}

function RouteComponent() {
  const loaderData = Route.useLoaderData();

  if (loaderData.storefrontBackend === "saleor") {
    return <NtmsSaleorCategoryPageView page={loaderData.categoryPage} />;
  }

  return <VendureCollectionPage loaderData={loaderData} />;
}

function VendureCollectionPage({
  loaderData,
}: {
  loaderData: VendureCollectionRouteData;
}) {
  const { collection: collectionParam } = Route.useParams();
  const search = Route.useSearch();
  const filtersId = useId().replace(/:/g, "");
  const { collection, activeChannel, facets } = loaderData;
  const facetValueFilters = createFacetValueFilters(
    search,
    facets.map((facet: { code: string }) => facet.code),
  );
  const activeFilterCount =
    facetValueFilters?.reduce(
      (count, facetFilter) => count + (facetFilter.or?.length ?? 0),
      0,
    ) ?? 0;
  const productsQuery = useCollectionProducts({
    collection: collectionParam,
    facetValueFilters,
    sort: search.sort,
  });
  const products = productsQuery.data ?? loaderData.products;
  const collectionDescription =
    collection.customFields?.navDescription ||
    collection.description ||
    `Browse the ${collection.name} collection with live filters and direct product cards.`;
  const subcategories = collection.children ?? [];

  return (
    <CollectionProvider collection={collection}>
      <section className="space-y-4 pb-24 lg:pb-0">
        <CollectionHero
          collection={collection}
          title={collection.name}
          description={collectionDescription}
          subcategories={subcategories}
          meta={
            <>
              <CollectionPill>{products.length} items</CollectionPill>
              <CollectionPill>
                {subcategories.length || facets.length}{" "}
                {subcategories.length ? "subcategories" : "filters"}
              </CollectionPill>
            </>
          }
        />
        <CollectionToolbar
          activeFilterCount={activeFilterCount}
          count={products.length}
          filterTargetId={filtersId}
          hasFilters={facets.length > 0}
        />
        <CollectionFilterPanel
          activeFilterCount={activeFilterCount}
          collection={collectionParam}
          facets={facets}
          id={filtersId}
        />
        {products.length === 0 ? (
          <StatusPanel
            icon={<SearchX className="h-5 w-5" />}
            title={`No products found in ${collection.name}`}
            description="Clear filters to restore the collection view or jump back to the full catalog."
            actions={
              <>
                <Button asChild variant="outline">
                  <Link
                    to="/collections/$collection"
                    params={{ collection: collectionParam }}
                    search={{ sort: search.sort }}
                  >
                    Reset filters
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/search" search={{ sort: search.sort }}>
                    Browse catalog
                  </Link>
                </Button>
              </>
            }
          />
        ) : (
          <Grid className="grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5 2xl:grid-cols-5">
            <ProductGridItems
              currencyCode={activeChannel.defaultCurrencyCode}
              products={products}
            />
          </Grid>
        )}
        <MobileCatalogActions
          activeFilterCount={activeFilterCount}
          count={products.length}
          filterTargetId={filtersId}
          hasFilters={facets.length > 0}
          sortItems={sorting}
        />
      </section>
    </CollectionProvider>
  );
}

type CollectionRouteData = NonNullable<ReturnType<typeof Route.useLoaderData>>;
type VendureCollectionRouteData = Extract<
  CollectionRouteData,
  { storefrontBackend: "vendure" }
>;
type CollectionData = VendureCollectionRouteData["collection"];
type SubcategoryData = NonNullable<CollectionData["children"]>[number];

function CollectionHero({
  collection,
  description,
  meta,
  subcategories,
  title,
}: {
  collection: CollectionData;
  description: string;
  meta?: ReactNode;
  subcategories: SubcategoryData[];
  title: string;
}) {
  const heroAsset = getCollectionImage(collection);
  const featuredSubcategories =
    subcategories.length > 0
      ? subcategories
      : [
          {
            ...collection,
            customFields: {
              ...collection.customFields,
              shortLabel: collection.customFields?.shortLabel || "View all",
            },
          } as SubcategoryData,
        ];

  return (
    <section className="relative overflow-hidden rounded-lg border border-black/10/14 bg-card/92 shadow-[0_22px_70px_rgba(0,0,0,.16)] backdrop-blur-xl lg:col-span-2 lg:-ml-[calc(200px+1.5rem)] xl:-ml-[calc(224px+1.5rem)]">
      {heroAsset ? (
        <img
          src={heroAsset}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.08]"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(247,200,31,.18),transparent_32%),linear-gradient(135deg,rgba(247,200,31,.08),transparent_42%),rgba(0,0,0,.22)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/70 to-transparent" />
      <div className="relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(260px,0.42fr)_minmax(0,1fr)] lg:gap-7 lg:p-6 xl:p-7">
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0071e3]">
              Collection
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/58 sm:text-base sm:leading-7">
              {description}
            </p>
          </div>
          {meta ? (
            <div className="flex shrink-0 flex-wrap gap-2">{meta}</div>
          ) : null}
        </div>
        <div className="min-w-0">
          <div
            className={cn(
              "grid w-full gap-3",
              featuredSubcategories.length <= 2
                ? "mx-auto max-w-[460px] grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5",
            )}
          >
            {featuredSubcategories.slice(0, 10).map((subcategory, index) => (
              <SubcategoryTile
                fallbackImage={heroAsset}
                index={index}
                key={subcategory.id}
                subcategory={subcategory}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10/14 bg-background/58 px-3 py-1 text-xs font-medium text-foreground/58">
      {children}
    </span>
  );
}

function SubcategoryTile({
  fallbackImage,
  index,
  subcategory,
}: {
  fallbackImage: string;
  index: number;
  subcategory: SubcategoryData;
}) {
  const image = getCollectionImage(subcategory) || fallbackImage;
  const label = subcategory.customFields?.shortLabel || subcategory.name;
  const description =
    subcategory.customFields?.navDescription || subcategory.description;

  return (
    <Link
      to="/collections/$collection"
      params={{ collection: subcategory.slug }}
      className="group relative block min-w-0 overflow-hidden rounded-lg border border-black/10/12 bg-background/52 shadow-[0_16px_38px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:border-black/10/34 hover:shadow-[0_22px_52px_rgba(0,0,0,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
    >
      <div className="relative aspect-square overflow-hidden bg-card/70">
        {image ? (
          <img
            alt={subcategory.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading={index < 4 ? "eager" : "lazy"}
            src={image}
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_70%_16%,rgba(247,200,31,.24),transparent_34%),linear-gradient(135deg,rgba(247,200,31,.12),rgba(0,0,0,.08)_42%,rgba(0,0,0,.22))]">
            <div className="absolute inset-4 rounded-md border border-black/10/10" />
            <div className="absolute left-4 top-4 h-9 w-9 rounded-full border border-black/10/16 bg-black/22" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
        <span className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-black/48 text-[#0071e3] backdrop-blur-xl transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-base sm:leading-5">
            {label}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/12 pt-2">
            <p className="text-xs font-semibold text-[#0071e3]">
              {subcategory.productVariantCount} items
            </p>
            {description ? (
              <p className="hidden max-w-[54%] truncate text-xs text-white/52 xl:block">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCollectionImage(collection: CollectionData | SubcategoryData) {
  return (
    collection.featuredAsset?.preview ||
    collection.featuredAsset?.source ||
    collection.assets?.[0]?.preview ||
    collection.assets?.[0]?.source ||
    ""
  );
}

function CollectionToolbar({
  activeFilterCount,
  count,
  filterTargetId,
  hasFilters,
}: {
  activeFilterCount: number;
  count: number;
  filterTargetId: string;
  hasFilters: boolean;
}) {
  return (
    <div className="hidden rounded-lg border border-black/10/10 bg-card/88 p-3 shadow-[0_14px_34px_rgba(0,0,0,.08)] backdrop-blur-xl lg:sticky lg:top-32 lg:z-20 lg:flex lg:items-center lg:justify-between lg:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10/14 bg-background/62 text-[#0071e3]">
          <Filter className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {count} {count === 1 ? "result" : "results"}
          </p>
          <p className="mt-0.5 text-xs text-foreground/48">Live catalog view</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
            <ArrowDownAZ className="h-3.5 w-3.5" />
            Sort
          </span>
          <div className="w-52">
            <FilterItemDropdown list={sorting} />
          </div>
        </div>
        {hasFilters ? (
          <a
            href={`#${filterTargetId}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-black/10/16 bg-background/62 px-3 text-sm font-semibold text-foreground/68 transition hover:border-black/10/34 hover:text-[#0071e3]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CollectionFilterPanel({
  activeFilterCount,
  collection,
  facets,
  id,
}: {
  activeFilterCount: number;
  collection: string;
  facets: NonNullable<ReturnType<typeof Route.useLoaderData>>["facets"];
  id: string;
}) {
  if (!facets.length) return null;

  return (
    <details
      id={id}
      open={activeFilterCount > 0}
      className="group scroll-mt-32 overflow-hidden rounded-lg border border-black/10/10 bg-card/88 shadow-[0_14px_34px_rgba(0,0,0,.08)] backdrop-blur-xl"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10/14 bg-background/62 text-[#0071e3]">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Filters</span>
            <span className="block text-xs text-foreground/48">
              {activeFilterCount > 0
                ? `${activeFilterCount} active`
                : "Optional facet controls"}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-foreground/45">
          {facets.length} groups
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-black/10/8 px-4 py-4">
        <Facets collection={collection} facets={facets} variant="inline" />
      </div>
    </details>
  );
}
