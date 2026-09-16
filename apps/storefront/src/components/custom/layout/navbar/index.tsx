import { Link } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import { lazy, Suspense } from "react";
import OpenSignIn from "@/components/custom/account/open-sign-in";
import { UserDropdown } from "@/components/custom/account/user-dropdown";
import CartModal from "@/components/custom/cart/modal";
import LogoSquare from "@/components/custom/logo-square";
import { ThemeToggle } from "@/components/custom/theme/theme-toggle";
import { clientEnv } from "@/env/client";
import { readFragment } from "@/gql/graphql";
import { useAuth } from "@/hooks/use-auth";
import { collectionFragment } from "@/lib/vendure/queries/collection";
import { SearchSkeleton } from "./search-skeleton";

const MobileMenu = lazy(() => import("./mobile-menu"));
const Search = lazy(() => import("./search"));

interface NavbarProps {
  menu: ResultOf<typeof collectionFragment>[];
}

export function Navbar({ menu }: NavbarProps) {
  const { activeCustomer } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-2xl">
      <nav className="mx-auto max-w-screen-2xl px-3 py-3 sm:px-4 lg:px-6">
        <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3">
            <div className="block flex-none md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>

            <Link to="/" className="flex min-w-0 items-center gap-3">
              <LogoSquare />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                  <span className="sm:hidden">NTMS</span>
                  <span className="hidden sm:inline">
                    {clientEnv.VITE_SITE_NAME}
                  </span>
                </p>
                <p className="hidden text-[11px] uppercase tracking-[0.18em] text-foreground/45 sm:block">
                  Tattoo supply catalog
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden min-w-0 md:flex md:justify-center">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            {activeCustomer ? (
              <UserDropdown customer={activeCustomer} />
            ) : (
              <OpenSignIn />
            )}
            <CartModal />
          </div>
        </div>
      </nav>

      {menu.length ? (
        <nav
          aria-label="Product collections"
          className="hidden border-t border-black/5 bg-white/60 backdrop-blur-xl md:block"
        >
          <div className="mx-auto flex max-w-screen-2xl justify-center px-4 py-2.5 lg:px-6">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-base font-semibold">
              {menu.map((data) => {
                const item = readFragment(collectionFragment, data);
                return (
                  <li key={item.slug}>
                    <Link
                      to={"/collections/$collection"}
                      params={{ collection: item.slug }}
                      className="whitespace-nowrap rounded-full border border-transparent px-3.5 py-2 text-[#1d1d1f]/75 transition hover:bg-black/5 hover:text-[#1d1d1f]"
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
