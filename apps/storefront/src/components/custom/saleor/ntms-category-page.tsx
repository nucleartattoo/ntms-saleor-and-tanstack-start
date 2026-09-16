import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SortFilterItem, sorting } from "@/lib/constants";
import type { NtmsSaleorCategoryPage } from "@/lib/saleor/catalog";
import { SaleorProductCard } from "./ntms-catalog-page";

export function NtmsSaleorCategoryPageView({
  page,
}: {
  page: NtmsSaleorCategoryPage;
}) {
  const {
    category,
    children,
    hasNextPage,
    hasPreviousPage,
    isCollectionOnly,
    nextPageCursor,
    page: currentPage,
    pageSize,
    products,
    sort,
    totalPages,
    totalProducts,
  } = page;
  const firstResult = totalProducts > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = totalProducts > 0 ? firstResult + products.length - 1 : 0;

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased">
      {/* 1. Header & Breadcrumbs in Apple Light Style */}
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
            <span className="min-w-0 truncate text-[#1d1d1f] font-semibold">
              {category.name}
            </span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0071e3]">
                {isCollectionOnly ? "Curated Series" : "Hardware & Consumables"}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-6xl">
                {category.name}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#6e6e73] sm:text-lg">
                Engineered for master tattooists, clinical PMU technicians, and
                high-volume piercing studios.
              </p>
            </div>

            <div className="inline-flex items-center gap-6 rounded-2xl bg-[#f5f5f7] px-6 py-3.5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                  Available Items
                </span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">
                  {totalProducts.toLocaleString()}
                </span>
              </div>
              <div className="h-7 w-[1px] bg-black/[0.08]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                  Subcategories
                </span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">
                  {children.length.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Subcategories Pill Bar */}
          {children.length > 0 ? (
            <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
              <CollectionNavLink
                active
                collection={category.slug}
                label="All"
                sort={sort}
              />
              {children.map((child) => (
                <CollectionNavLink
                  collection={child.slug}
                  key={child.id}
                  label={child.name}
                  sort={sort}
                />
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {/* 2. Products Gallery Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Sort and Count Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-black/[0.04]">
          <p
            className="text-xs font-semibold uppercase tracking-wider text-[#86868b]"
            data-saleor-category-result-range
          >
            {totalProducts > 0
              ? `Displaying ${firstResult.toLocaleString()}–${lastResult.toLocaleString()} of ${totalProducts.toLocaleString()} items`
              : "0 items"}
          </p>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-[#86868b] mr-2">
              Sort:
            </span>
            {sorting.map((item) => (
              <CategorySortLink
                collection={category.slug}
                currentSort={sort}
                item={item}
                key={item.slug}
              />
            ))}
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <SaleorProductCard
                  enableLinks
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
            <CategoryPagination
              collection={category.slug}
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              label={category.name}
              nextPageCursor={nextPageCursor}
              sort={sort}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
            <SearchX className="mx-auto h-12 w-12 text-[#86868b]" />
            <h3 className="mt-4 text-xl font-bold text-[#1d1d1f]">
              No Products in this Category
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6e6e73]">
              We are constantly stocking new inventory. Check back shortly or
              explore other categories.
            </p>
            <Button
              asChild
              className="mt-6 rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]"
            >
              <Link to="/">Explore Store Home</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}

function CollectionNavLink({
  active = false,
  collection,
  label,
  sort,
}: {
  active?: boolean;
  collection: string;
  label: string;
  sort: SortFilterItem["slug"];
}) {
  return (
    <Link
      to="/collections/$collection"
      params={{ collection }}
      search={{ sort }}
      preload="intent"
      className={[
        "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-all duration-300",
        active
          ? "bg-[#1d1d1f] text-white shadow-sm"
          : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function CategoryPagination({
  collection,
  currentPage,
  hasNextPage,
  hasPreviousPage,
  label,
  nextPageCursor,
  sort,
  totalPages,
}: {
  collection: string;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  label: string;
  nextPageCursor: string | null;
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
      aria-label={`${label} pagination`}
      className="mt-12 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between"
      data-saleor-category-pagination
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
              to="/collections/$collection"
              params={{ collection }}
              preload="intent"
              rel="prev"
              search={{ after: undefined, page: previousPage, sort }}
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
              to="/collections/$collection"
              params={{ collection }}
              preload="intent"
              rel="next"
              search={{
                after: nextPageCursor || undefined,
                page: nextPage,
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

function CategorySortLink({
  collection,
  currentSort,
  item,
}: {
  collection: string;
  currentSort: SortFilterItem["slug"];
  item: SortFilterItem;
}) {
  const active = currentSort === item.slug;

  return (
    <Link
      to="/collections/$collection"
      params={{ collection }}
      preload="intent"
      search={{ after: undefined, page: undefined, sort: item.slug }}
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
