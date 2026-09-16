import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Clock3,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { lazy, type ReactNode, Suspense } from "react";
import ErrorComponent from "@/components/custom/errors/error";
import { ThreeItemGrid } from "@/components/custom/grid/three-items";
import { SearchDiscoveryBar } from "@/components/custom/layout/search/discovery-bar";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { ProductCard } from "@/components/custom/product-card";
import { NtmsSaleorCatalogPage } from "@/components/custom/saleor/ntms-catalog-page";
import { NtmsSaleorCatalogPending } from "@/components/custom/saleor/ntms-catalog-pending";
import { clientEnv } from "@/env/client";
import {
  activeChannelQueryOptions,
  collectionProductsQueryOptions,
  collectionsQueryOptions,
} from "@/hooks/use-catalog-products";
import { getBaseUrl, getCanonicalUrl } from "@/lib/metadata";
import { saleorCatalogPreviewQueryOptions } from "@/lib/saleor/catalog-query";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { Route as DefaultRoute } from "@/routes/_default/route";

const Carousel = lazy(async () => {
  const module = await import("@/components/custom/carousel");
  return { default: module.Carousel };
});

const Footer = lazy(() => import("@/components/custom/layout/footer"));

export const Route = createFileRoute("/_default/")({
  loader: async ({ context }) => {
    if (isSaleorStorefront) {
      return {
        storefrontBackend: "saleor" as const,
        catalog: await context.queryClient.ensureQueryData(
          saleorCatalogPreviewQueryOptions(),
        ),
      };
    }

    const [activeChannel, collections, homepageItems, carouselProducts] =
      await Promise.all([
        context.queryClient.ensureQueryData(activeChannelQueryOptions()),
        context.queryClient.ensureQueryData(
          collectionsQueryOptions({ topLevelOnly: true }),
        ),
        context.queryClient.ensureQueryData(
          collectionProductsQueryOptions({ collection: "machines" }),
        ),
        context.queryClient.ensureQueryData(
          collectionProductsQueryOptions({ collection: "cartridge-needles" }),
        ),
      ]);

    return {
      storefrontBackend: "vendure" as const,
      activeChannel,
      collections,
      homepageItems,
      carouselProducts,
    };
  },
  head: () => ({
    links: [
      {
        rel: "canonical",
        href: getCanonicalUrl(),
      },
    ],
  }),
  scripts: () => {
    const baseUrl = getBaseUrl();

    // Simple breadcrumb for homepage
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
      ],
    };

    return [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd),
      },
    ];
  },
  pendingComponent: HomePending,
  errorComponent: ErrorComponent,
  component: App,
});

function HomePending() {
  return isSaleorStorefront ? (
    <NtmsSaleorCatalogPending label="Loading storefront" />
  ) : (
    <SectionSkeleton label="Loading storefront" />
  );
}

function App() {
  const loaderData = Route.useLoaderData();
  const defaultLoaderData = DefaultRoute.useLoaderData();

  if (loaderData.storefrontBackend === "saleor") {
    return (
      <NtmsSaleorCatalogPage
        backLabel="Nuclear Tattoo Supply"
        catalog={loaderData.catalog}
        enableLinks
      />
    );
  }

  const { activeChannel, collections, homepageItems, carouselProducts } =
    loaderData;
  const menu = defaultLoaderData.menu ?? [];
  const heroProduct = homepageItems[0];
  const topCollections = collections.slice(0, 8);

  return (
    <>
      <section className="relative overflow-hidden border-b border-black/10/10">
        <div className="mx-auto grid max-w-screen-2xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch lg:py-10 xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="flex min-h-[560px] min-w-0 flex-col justify-between py-4 lg:py-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10/18 bg-background/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Golden supply grid
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--apple-blue)]/18 bg-background/65 px-3 py-1 text-xs text-foreground/60">
                  <Layers3 className="h-3.5 w-3.5" />
                  Live studio catalog
                </span>
              </div>
              <h1 className="mt-7 max-w-5xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                {clientEnv.VITE_SITE_NAME}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-foreground/62 sm:text-lg sm:leading-8">
                Machines, cartridge needles, power supplies, grips, and studio
                essentials organized for fast repeat ordering.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/collections/$collection"
                  params={{ collection: "machines" }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0071e3] px-5 py-3 text-sm font-semibold text-black shadow-[0_14px_32px_rgba(247,200,31,.18)] transition hover:bg-[color:var(--apple-blue)]"
                >
                  Shop machines
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/search"
                  search={{ q: undefined }}
                  className="inline-flex items-center rounded-lg border border-black/10/16 bg-background/72 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-black/10/36 hover:bg-[#0071e3]/7"
                >
                  Browse catalog
                </Link>
              </div>
              <div className="mt-8 min-w-0">
                <SearchDiscoveryBar compact />
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <HeroMetric
                icon={<Boxes className="h-4 w-4" />}
                label="Top categories"
                value={collections.length}
              />
              <HeroMetric
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Live inventory"
                value="Synced"
              />
              <HeroMetric
                icon={<Clock3 className="h-4 w-4" />}
                label="Featured picks"
                value={`${homepageItems.length} ready`}
              />
            </div>
          </div>

          {heroProduct ? (
            <div className="min-h-full min-w-0 overflow-hidden rounded-2xl border border-black/10/12 bg-card/86 shadow-[0_24px_72px_rgba(0,0,0,.12)] backdrop-blur-xl">
              <ProductCard
                className="min-h-full border-0 bg-transparent shadow-none hover:translate-y-0 hover:shadow-none"
                currencyCode={activeChannel.defaultCurrencyCode}
                priority={true}
                product={heroProduct}
                variant="featured"
              />
            </div>
          ) : null}
        </div>

        {topCollections.length ? (
          <div className="mx-auto max-w-screen-2xl px-4 pb-8">
            <nav
              aria-label="Featured collections"
              className="flex gap-2 overflow-x-auto border-y border-black/10/10 py-2"
            >
              {topCollections.map((collection) => (
                <Link
                  key={collection.slug}
                  to="/collections/$collection"
                  params={{ collection: collection.slug }}
                  className="whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/62 transition hover:bg-black/5 hover:text-foreground"
                >
                  {collection.name}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </section>
      <section className="mx-auto max-w-screen-2xl px-4 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
                Featured machines
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Machine picks for studio builds
            </h2>
          </div>
          <Link
            to="/collections/$collection"
            params={{ collection: "machines" }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/62 transition hover:text-[#0071e3]"
          >
            View all machines
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <ThreeItemGrid
        homepageItems={homepageItems}
        activeChannel={activeChannel}
      />
      <Suspense
        fallback={<SectionSkeleton label="Loading featured products" />}
      >
        <Carousel products={carouselProducts} activeChannel={activeChannel} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton label="Loading footer" />}>
        <Footer menu={menu} />
      </Suspense>
    </>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10/10 bg-background/52 p-4">
      <div className="flex items-center gap-2 text-[#0071e3]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <StatusPanel
        size="compact"
        title={label}
        description="Preparing the next section."
      />
    </div>
  );
}
