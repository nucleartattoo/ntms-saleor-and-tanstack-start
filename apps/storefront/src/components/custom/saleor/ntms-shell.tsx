import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NtmsSaleorCategory } from "@/lib/saleor/catalog";
import { cn } from "@/lib/utils";
import { useSaleorCart } from "./ntms-cart-context";
import { useNtmsChannel } from "./ntms-channel-context";
import {
  NtmsChannelSwitcher,
  NtmsMobileChannelSelector,
} from "./ntms-channel-switcher";

type NtmsNavigationCategory = Pick<NtmsSaleorCategory, "name" | "slug">;

const ntmsNavigationFallback = [
  { label: "Needles", slug: "ntms-289-needles" },
  { label: "Inks", slug: "ntms-91-inks" },
  { label: "Machines", slug: "ntms-103-machines" },
  { label: "Tubes & Grips", slug: "ntms-107-tubes-and-grips" },
  {
    label: "Power Supplies & Cords",
    slug: "ntms-85-power-supplies-and-cords",
  },
  { label: "Medical", slug: "ntms-89-medical" },
  { label: "Shop Supply", slug: "ntms-113-shop-supply" },
  { label: "Papa", slug: "ntms-117-papa" },
  { label: "Sales", slug: "ntms-452-sales" },
] as const;

const ntmsFooterCategorySlugs = [
  "ntms-91-inks",
  "ntms-103-machines",
  "ntms-289-needles",
  "ntms-113-shop-supply",
] as const;

export function getNtmsSaleorNavigationCategories(
  categories: NtmsNavigationCategory[],
) {
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  return ntmsNavigationFallback.map((fallback) => {
    const category = categoriesBySlug.get(fallback.slug);
    return category
      ? { label: category.name, slug: category.slug }
      : { ...fallback };
  });
}

function getNtmsSaleorFooterCategories(
  navigationCategories: ReturnType<typeof getNtmsSaleorNavigationCategories>,
) {
  const categoriesBySlug = new Map(
    navigationCategories.map((category) => [category.slug, category]),
  );

  return ntmsFooterCategorySlugs.flatMap((slug) => {
    const category = categoriesBySlug.get(slug);
    return category ? [category] : [];
  });
}

export function NtmsSaleorShell({
  categories,
  children,
}: {
  categories: NtmsNavigationCategory[];
  children: React.ReactNode;
}) {
  const matchRoute = useMatchRoute();
  const navigationCategories = getNtmsSaleorNavigationCategories(categories);
  const isCheckout =
    Boolean(matchRoute({ to: "/checkout" })) ||
    Boolean(matchRoute({ to: "/checkout/$step" })) ||
    Boolean(matchRoute({ to: "/checkout/confirmation/$code" }));

  if (isCheckout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white">
      <NtmsSaleorHeader categories={navigationCategories} />
      {children}
      <NtmsSaleorFooter
        categories={getNtmsSaleorFooterCategories(navigationCategories)}
      />
    </div>
  );
}

function NtmsSaleorHeader({
  categories,
}: {
  categories: ReturnType<typeof getNtmsSaleorNavigationCategories>;
}) {
  const { currentChannel } = useNtmsChannel();

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl saturate-150 transition-[background-color,backdrop-filter] duration-200">
      {/* 1. Global Announcement / Studio Bar */}
      <div className="border-b border-black/[0.04] bg-[#f5f5f7] px-4 py-1.5 text-center text-[11px] font-medium tracking-tight text-[#6e6e73]">
        <span>{currentChannel.shippingAnnouncement}</span>
        <Link
          to="/search"
          className="ml-2 font-semibold text-[#0071e3] hover:underline"
        >
          Explore catalog &rarr;
        </Link>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <NtmsLogo />

          <div className="hidden flex-1 max-w-md mx-6 md:flex">
            <NtmsSearchForm />
          </div>

          <NtmsHeaderActions categories={categories} />
        </div>
      </div>

      {/* 3. Apple Store Category Sub-Navigation Bar */}
      <nav
        aria-label="Primary categories"
        className="hidden border-t border-black/[0.04] bg-white/60 backdrop-blur-md lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4 py-2.5">
          {categories.map((item) => (
            <Link
              key={item.slug}
              to="/collections/$collection"
              params={{ collection: item.slug }}
              preload="intent"
              className="shrink-0 text-[12px] font-medium tracking-tight text-[#1d1d1f]/75 transition-colors hover:text-[#0071e3]"
              activeProps={{
                "aria-current": "page",
                className: "text-[#0071e3] font-semibold",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function NtmsLogo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-85"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] text-xs font-black tracking-wider text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        N
      </span>
      <div className="flex flex-col">
        <span className="text-[13px] font-bold tracking-tight text-[#1d1d1f] leading-none">
          Nuclear Tattoo
        </span>
        <span className="mt-0.5 text-[10px] font-medium tracking-wider uppercase text-[#86868b] leading-tight">
          Pro Store
        </span>
      </div>
    </Link>
  );
}

const appleHeaderIconButtonClass =
  "relative flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition-[transform,background-color,color] duration-160 ease-out hover:bg-[#e8e8ed] [@media(hover:hover)]:hover:scale-[1.04] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none";

function NtmsHeaderActions({
  categories,
}: {
  categories: ReturnType<typeof getNtmsSaleorNavigationCategories>;
}) {
  const { checkout, isLoading, openCart } = useSaleorCart();
  const quantity = checkout?.quantity ?? 0;

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <NtmsChannelSwitcher className="hidden sm:inline-flex" />

      <NtmsMobileNavigation categories={categories} />

      <Link
        to="/account"
        aria-label="My account"
        title="My account"
        className={appleHeaderIconButtonClass}
      >
        <UserRound className="h-4 w-4 text-[#1d1d1f]/85" />
      </Link>

      <button
        type="button"
        aria-label={
          quantity > 0 ? `Open cart, ${quantity} item(s)` : "Open cart"
        }
        title="Shopping cart"
        data-saleor-cart-button
        onClick={openCart}
        className={appleHeaderIconButtonClass}
      >
        <ShoppingCart className="h-4 w-4 text-[#1d1d1f]/85" />
        {quantity > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0071e3] px-1 text-[10px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(0,113,227,0.4)]">
            {quantity}
          </span>
        ) : null}
        {isLoading ? (
          <span
            className={cn(
              "absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#0071e3]",
              "animate-pulse",
            )}
          />
        ) : null}
      </button>
    </div>
  );
}

function NtmsMobileNavigation({
  categories,
}: {
  categories: ReturnType<typeof getNtmsSaleorNavigationCategories>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Browse categories"
        title="Browse categories"
        onClick={() => setOpen(true)}
        className={`${appleHeaderIconButtonClass} lg:hidden`}
      >
        <Menu className="h-4 w-4 text-[#1d1d1f]/85" />
      </button>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex h-full w-[min(22rem,92vw)] flex-col gap-0 border-r border-black/[0.06] bg-white/85 backdrop-blur-3xl saturate-150 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.15)]"
      >
        <SheetTitle className="sr-only">Browse categories</SheetTitle>
        <SheetDescription className="sr-only">
          Shop Nuclear Tattoo Supply product categories.
        </SheetDescription>
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-6">
          <NtmsLogo />
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close categories"
              title="Close categories"
              className={appleHeaderIconButtonClass}
            >
              <X className="h-4 w-4" />
            </button>
          </SheetClose>
        </div>

        <div className="my-4">
          <NtmsSearchForm />
        </div>

        <nav
          aria-label="Mobile categories"
          className="flex flex-1 flex-col gap-1 overflow-y-auto pt-2"
        >
          {categories.map((item) => (
            <Link
              key={item.slug}
              to="/collections/$collection"
              params={{ collection: item.slug }}
              preload="intent"
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1d1d1f]/80 transition hover:bg-[#f5f5f7] hover:text-[#0071e3]"
              activeProps={{
                "aria-current": "page",
                className:
                  "group flex items-center justify-between rounded-xl bg-[#0071e3]/08 px-3 py-2.5 text-sm font-semibold text-[#0071e3] transition",
              }}
            >
              {item.label}
              <ArrowRight className="h-4 w-4 text-[#86868b] transition group-hover:translate-x-0.5 group-hover:text-[#0071e3]" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-black/[0.06] pt-4">
          <NtmsMobileChannelSelector />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NtmsSearchForm() {
  return (
    <search aria-label="Site search" className="w-full min-w-0">
      <form action="/search" className="w-full min-w-0">
        <div className="relative flex min-w-0 items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]"
          />
          <input
            aria-label="Search products"
            className="h-9 w-full rounded-full bg-[#f5f5f7] pl-9 pr-4 text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 focus:shadow-[0_2px_12px_rgba(0,113,227,0.12)]"
            name="q"
            placeholder="Search needles, inks, machines..."
            type="search"
          />
        </div>
      </form>
    </search>
  );
}

function NtmsSaleorFooter({
  categories,
}: {
  categories: ReturnType<typeof getNtmsSaleorNavigationCategories>;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/[0.06] bg-[#f5f5f7] text-[#86868b]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <NtmsLogo />
            <p className="mt-4 text-xs leading-relaxed text-[#6e6e73]">
              Precision tattoo machines, certified sterile cartridge needles,
              vibrant pigment formulations, and shop essentials engineered for
              artists worldwide.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d1d1f]">
              Catalog
            </p>
            <ul className="mt-4 space-y-2 text-xs font-medium">
              {categories.map((item) => (
                <li key={item.slug}>
                  <Link
                    to="/collections/$collection"
                    params={{ collection: item.slug }}
                    preload="intent"
                    className="text-[#6e6e73] transition-colors hover:text-[#0071e3]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/search"
                  className="text-[#0071e3] transition-colors hover:underline"
                >
                  Search all supplies &rarr;
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d1d1f]">
              Studio Service
            </p>
            <ul className="mt-4 space-y-2 text-xs font-medium text-[#6e6e73]">
              <li>Direct Medical Compliance</li>
              <li>Same-Day Dispatch &amp; Tracking</li>
              <li>Verified Artist Wholesale</li>
              <li>Sterility &amp; Lot Certifications</li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1d1d1f]">
              About NTMS
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[#6e6e73]">
              Nuclear Tattoo Supply delivers ultra-high-grade tattoo hardware
              and consumables with lightning delivery.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-black/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-[#86868b]">
          <p suppressHydrationWarning>
            &copy; {year} Nuclear Tattoo Supply Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Apple Build v1.0.45-PROD</span>
            </span>
            <span className="text-[10px] text-[#86868b] font-mono">
              Release 20260830-apple-1.0.45
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Sale</span>
            <span>Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
