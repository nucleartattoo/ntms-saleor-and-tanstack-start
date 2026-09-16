import { Link } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { ArrowRight, BadgeCheck, Menu, X } from "lucide-react";
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import LogoSquare from "@/components/custom/logo-square";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWindowResize } from "@/hooks";
import type { collectionFragment } from "@/lib/vendure/queries/collection";
import { SearchSkeleton } from "./search-skeleton";

const Search = lazy(() => import("./search"));

const mobileQuickLinks = [
  { label: "Machines", slug: "machines" },
  { label: "Needles", slug: "cartridge-needles" },
  { label: "Power", slug: "power-supply" },
];

export default function MobileMenu({
  menu,
}: {
  menu: ResultOf<typeof collectionFragment>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  const { width } = useWindowResize();

  useLayoutEffect(() => {
    if (width > 768) {
      setIsOpen(false);
    }
  }, [width]);

  useEffect(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#f5f5f7] hover:text-[#0071e3] md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Sheet open={isOpen} onOpenChange={(open) => !open && closeMobileMenu()}>
        <SheetContent
          side="left"
          showCloseButton={false}
          overlayClassName="fixed inset-0 bg-black/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          className="fixed inset-y-0 left-0 z-50 flex h-full w-full flex-col gap-0 border-r border-black/5 bg-white/95 pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-sm"
        >
          {/* Hidden title for accessibility */}
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Browse collections and search products from the mobile navigation.
          </SheetDescription>

          <div className="flex h-full flex-col overflow-hidden p-4">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-black/5 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <LogoSquare />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                    NTMS
                  </p>
                  <p className="truncate text-xs text-foreground/48">
                    Tattoo supply catalog
                  </p>
                </div>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-[#f5f5f7] text-[#1d1d1f] transition-all hover:bg-black/5 hover:text-[#0071e3]"
                  aria-label="Close mobile menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </SheetClose>
            </div>

            <div className="mb-6 w-full">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>

            <div className="mb-5 rounded-3xl border border-black/5 bg-[#f5f5f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                Quick shop
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {mobileQuickLinks.map((item) => (
                  <Link
                    key={item.slug}
                    to="/collections/$collection"
                    params={{ collection: item.slug }}
                    onClick={closeMobileMenu}
                    className="min-w-0 rounded-2xl border border-black/5 bg-white px-2 py-2.5 text-center text-xs font-medium text-[#1d1d1f] shadow-sm transition hover:bg-[#f5f5f7] hover:text-[#0071e3]"
                  >
                    <span className="block truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {menu.length ? (
              <ul className="flex w-full flex-1 flex-col space-y-1 overflow-auto pr-1">
                {menu.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={"/collections/$collection"}
                      params={{ collection: item.slug }}
                      preload="intent"
                      onClick={closeMobileMenu}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-base text-foreground transition-colors hover:border-black/10/16 hover:bg-black/5 hover:text-[#0071e3] dark:text-white"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-[#0071e3]/80" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-foreground/35 transition group-hover:translate-x-0.5 group-hover:text-[#0071e3]" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
