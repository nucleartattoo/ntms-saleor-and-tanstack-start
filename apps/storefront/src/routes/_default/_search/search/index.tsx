import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useEffect } from "react";
import ErrorComponent from "@/components/custom/errors/error";
import Grid from "@/components/custom/grid";
import { CatalogHeader } from "@/components/custom/layout/catalog-header";
import { CommerceSignal } from "@/components/custom/layout/commerce-surface";
import ProductGridItems from "@/components/custom/layout/product-grid-items";
import { SearchDiscoveryBar } from "@/components/custom/layout/search/discovery-bar";
import FilterList from "@/components/custom/layout/search/filter";
import { MobileCatalogActions } from "@/components/custom/layout/search/mobile-catalog-actions";
import { ResultStatus } from "@/components/custom/layout/search/result-status";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { NtmsSaleorCatalogPending } from "@/components/custom/saleor/ntms-catalog-pending";
import { NtmsSaleorSearchPageView } from "@/components/custom/saleor/ntms-search-page";
import ProductGridSkeleton from "@/components/custom/skeletons/grid";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/env/client";
import {
  activeChannelQueryOptions,
  searchProductsQueryOptions,
  useSearchProducts,
} from "@/hooks/use-catalog-products";
import { sorting } from "@/lib/constants";
import { createBasicMeta, getSearchRobotsDirective } from "@/lib/metadata";
import { recordRecentSearch } from "@/lib/recent-searches";
import { saleorSearchPageQueryOptions } from "@/lib/saleor/catalog-query";
import { searchSchema } from "@/lib/search-schema";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/_default/_search/search/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { after, page, q, sort } }) => ({
    after,
    page,
    q,
    sort,
  }),
  loader: async ({ context, deps: { after, page, q, sort } }) => {
    if (isSaleorStorefront) {
      return {
        storefrontBackend: "saleor" as const,
        searchPage: await context.queryClient.ensureQueryData(
          saleorSearchPageQueryOptions({ cursor: after, page, query: q, sort }),
        ),
      };
    }

    const [products, activeChannel] = await Promise.all([
      context.queryClient.ensureQueryData(
        searchProductsQueryOptions({ query: q, sort }),
      ),
      context.queryClient.ensureQueryData(activeChannelQueryOptions()),
    ]);

    return {
      storefrontBackend: "vendure" as const,
      products,
      activeChannel,
      searchValue: q,
    };
  },
  head: ({ loaderData }) => {
    if (loaderData?.storefrontBackend === "saleor") {
      const { query, totalProducts } = loaderData.searchPage;
      const title = query ? `Search "${query}"` : "Search";
      const description = query
        ? `Found ${totalProducts} ${totalProducts === 1 ? "product" : "products"} matching "${query}" in the Nuclear Tattoo Supply catalog.`
        : "Search the Nuclear Tattoo Supply catalog for tattoo supplies, studio equipment, inks, and accessories.";

      return {
        meta: createBasicMeta(
          title,
          description,
          false,
          getSearchRobotsDirective(),
        ),
      };
    }

    const searchValue = loaderData?.searchValue;
    const resultsCount = loaderData?.products?.length || 0;

    const title = searchValue
      ? `Search results for "${searchValue}"`
      : "Search";

    const description = searchValue
      ? `Found ${resultsCount} ${resultsCount === 1 ? "product" : "products"} matching "${searchValue}". Browse our search results and find exactly what you're looking for.`
      : `Search the ${clientEnv.VITE_SITE_NAME} catalog for machines, needles, power supplies, kits, grips, and shop essentials.`;

    return {
      meta: createBasicMeta(
        title,
        description,
        false,
        getSearchRobotsDirective(),
      ),
    };
  },
  pendingComponent: SearchPending,
  errorComponent: ErrorComponent,
  component: RouteComponent,
});

function SearchPending() {
  return isSaleorStorefront ? (
    <NtmsSaleorCatalogPending label="Loading search results" />
  ) : (
    <ProductGridSkeleton />
  );
}

function RouteComponent() {
  const loaderData = Route.useLoaderData();

  if (loaderData.storefrontBackend === "saleor") {
    return <NtmsSaleorSearchPageView page={loaderData.searchPage} />;
  }

  return <VendureSearchPage loaderData={loaderData} />;
}

function VendureSearchPage({
  loaderData,
}: {
  loaderData: VendureSearchRouteData;
}) {
  const search = Route.useSearch();

  const { activeChannel, searchValue } = loaderData;
  const productsQuery = useSearchProducts({
    query: search.q,
    sort: search.sort,
  });
  const products = productsQuery.data ?? loaderData.products;
  const resultsText = products.length > 1 ? "results" : "result";

  useEffect(() => {
    if (search.q) {
      recordRecentSearch(search.q);
    }
  }, [search.q]);

  return (
    <section className="space-y-4 pb-24 sm:space-y-5 lg:pb-0">
      <CatalogHeader
        eyebrow="Search"
        title={searchValue ? `Results for "${searchValue}"` : "Search catalog"}
        description={
          searchValue
            ? `Showing ${products.length} ${resultsText} across the ${clientEnv.VITE_SITE_NAME} catalog.`
            : "Search by name, SKU, or product family."
        }
        meta={
          searchValue ? (
            <CommerceSignal>
              {products.length} {resultsText}
            </CommerceSignal>
          ) : null
        }
      />
      <div className="space-y-4">
        <SearchDiscoveryBar />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <ResultStatus
            count={products.length}
            description={
              searchValue
                ? `Showing ${products.length} ${resultsText} for "${searchValue}".`
                : "Search by name, SKU, or product family."
            }
            kind="search"
            sort={search.sort}
          />
          <FilterList
            list={sorting}
            title="Sort"
            description="Order current results."
            variant="toolbar"
            className="lg:self-start"
          />
        </div>
      </div>
      {products.length > 0 ? (
        <Grid className="grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <ProductGridItems
            currencyCode={activeChannel.defaultCurrencyCode}
            products={products}
          />
        </Grid>
      ) : (
        <StatusPanel
          icon={<SearchX className="h-5 w-5" />}
          title="No products matched your search"
          description={
            searchValue
              ? "Try a broader keyword or clear the query to browse the full catalog."
              : "Use search by name, SKU, or product family to locate products faster."
          }
          actions={
            <>
              {searchValue ? (
                <Button asChild variant="outline">
                  <Link to="/search" search={{ sort: search.sort }}>
                    Clear search
                  </Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link to="/">Browse catalog</Link>
              </Button>
            </>
          }
        />
      )}
      <MobileCatalogActions count={products.length} sortItems={sorting} />
    </section>
  );
}

type SearchRouteData = NonNullable<ReturnType<typeof Route.useLoaderData>>;
type VendureSearchRouteData = Extract<
  SearchRouteData,
  { storefrontBackend: "vendure" }
>;
