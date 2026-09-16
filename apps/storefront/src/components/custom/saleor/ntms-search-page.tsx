import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { type SortFilterItem, sorting } from "@/lib/constants";
import type { NtmsSaleorSearchPage } from "@/lib/saleor/catalog";
import { SaleorProductCard } from "./ntms-catalog-page";

export function NtmsSaleorSearchPageView({
  page,
}: {
  page: NtmsSaleorSearchPage;
}) {
  const searchInputId = useId();
  const hasQuery = page.query.length > 0;
  const totalResultsLabel = page.totalProducts === 1 ? "item" : "items";
  const firstResult =
    page.totalProducts > 0 ? (page.page - 1) * page.pageSize + 1 : 0;
  const lastResult =
    page.totalProducts > 0 ? firstResult + page.products.length - 1 : 0;

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased">
      {/* 1. Header with Breadcrumb & Search Stage */}
      <header className="border-b border-black/[0.04] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 text-[11px] font-medium tracking-tight text-[#86868b]"
          >
            <Link to="/" className="shrink-0 transition hover:text-[#0071e3]">
              Store
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-[#86868b]" />
            <span className="min-w-0 truncate font-semibold text-[#1d1d1f]">
              Search
            </span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0071e3]">
                Studio Search
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-5xl">
                {hasQuery ? `"${page.query}"` : "Search Catalog"}
              </h1>
            </div>

            {/* Apple style large search bar */}
            <form action="/search" className="w-full md:max-w-md">
              <input name="sort" type="hidden" value={page.sort} />
              <label className="sr-only" htmlFor={searchInputId}>
                Search catalog
              </label>
              <div className="relative flex items-center">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]"
                />
                <input
                  className="h-12 w-full rounded-full bg-[#f5f5f7] pl-11 pr-5 text-sm font-medium text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:shadow-md"
                  defaultValue={page.query}
                  id={searchInputId}
                  name="q"
                  placeholder="Needles, cartridges, ink, power..."
                  type="search"
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* 2. Results Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Results Metadata & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-black/[0.04]">
          <p
            className="text-xs font-semibold uppercase tracking-wider text-[#86868b]"
            data-saleor-search-result-range
          >
            {page.totalProducts > 0
              ? `Found ${page.totalProducts.toLocaleString()} ${totalResultsLabel} (${firstResult.toLocaleString()}–${lastResult.toLocaleString()})`
              : "0 items found"}
          </p>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-[#86868b] mr-2">
              Sort:
            </span>
            {sorting.map((item) => (
              <SearchSortLink
                currentSort={page.sort}
                item={item}
                key={item.slug}
                query={page.query}
              />
            ))}
          </div>
        </div>

        {page.products.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {page.products.map((product, index) => (
                <SaleorProductCard
                  enableLinks
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
            <SearchPagination
              currentPage={page.page}
              hasNextPage={page.hasNextPage}
              hasPreviousPage={page.hasPreviousPage}
              nextPageCursor={page.nextPageCursor}
              query={page.query}
              sort={page.sort}
              totalPages={page.totalPages}
            />
          </>
        ) : (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
            <SearchX className="mx-auto h-12 w-12 text-[#86868b]" />
            <h3 className="mt-4 text-xl font-bold text-[#1d1d1f]">
              No Exact Matches
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6e6e73]">
              Try searching with broader terms such as "ink", "cartridge", or
              specific SKU numbers.
            </p>
            <Button
              asChild
              className="mt-6 rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]"
            >
              <Link to="/">Explore Full Catalog</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}

function SearchPagination({
  currentPage,
  hasNextPage,
  hasPreviousPage,
  nextPageCursor,
  query,
  sort,
  totalPages,
}: {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageCursor: string | null;
  query: string;
  sort: SortFilterItem["slug"];
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage =
    currentPage <= 2 ? undefined : (currentPage - 1).toString();
  const nextPage = (currentPage + 1).toString();

  return (
    <nav
      aria-label="Search results pagination"
      className="mt-12 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between"
      data-saleor-search-pagination
    >
      <p className="text-xs font-semibold tracking-tight text-[#6e6e73]">
        Page{" "}
        <span className="text-[#1d1d1f] font-bold">
          {currentPage.toLocaleString()}
        </span>{" "}
        of {totalPages.toLocaleString()}
      </p>
      <div className="flex items-center gap-3">
        {hasPreviousPage ? (
          <Button
            asChild
            variant="outline"
            className="rounded-full border-black/[0.08] px-4 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]"
          >
            <Link
              to="/search"
              preload="intent"
              rel="prev"
              search={{
                after: undefined,
                page: previousPage,
                q: query || undefined,
                sort,
              }}
            >
              <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            className="rounded-full border-black/[0.04] px-4 text-xs font-semibold text-[#86868b] opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>
        )}
        {hasNextPage ? (
          <Button
            asChild
            className="rounded-full bg-[#0071e3] px-4 text-xs font-semibold text-white hover:bg-[#0077ed]"
          >
            <Link
              to="/search"
              preload="intent"
              rel="next"
              search={{
                after: nextPageCursor || undefined,
                page: nextPage,
                q: query || undefined,
                sort,
              }}
            >
              Next
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            className="rounded-full bg-[#0071e3] px-4 text-xs font-semibold text-white opacity-40"
          >
            Next
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </nav>
  );
}

function SearchSortLink({
  currentSort,
  item,
  query,
}: {
  currentSort: SortFilterItem["slug"];
  item: SortFilterItem;
  query: string;
}) {
  const active = currentSort === item.slug;

  return (
    <Link
      to="/search"
      preload="intent"
      search={{
        after: undefined,
        page: undefined,
        q: query || undefined,
        sort: item.slug,
      }}
      className={[
        "inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] font-semibold tracking-tight transition-all duration-300",
        active
          ? "bg-[#0071e3] text-white shadow-sm"
          : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed] hover:text-[#1d1d1f]",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {item.name}
    </Link>
  );
}
