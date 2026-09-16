import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AccountNavigation } from "@/components/custom/account/navigation";
import { Navbar } from "@/components/custom/layout/navbar";
import { menuQueryOptions } from "@/hooks/use-catalog-products";
import { validateAndFetchUser } from "@/lib/session";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/_account")({
  beforeLoad: async () => {
    const user = await validateAndFetchUser();
    if (!user) {
      throw redirect({
        to: "/sign-in",
      });
    }
    return { user };
  },
  loader: async ({ context }) => {
    if (isSaleorStorefront) {
      return {
        menu: [],
      };
    }

    const menu = await context.queryClient.ensureQueryData(menuQueryOptions());

    return {
      menu,
    };
  },
  component: AccountLayoutComponent,
});

function AccountLayoutComponent() {
  const { menu } = Route.useLoaderData();
  const accountContent = (
    <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0071e3]">
            Account Management
          </p>
          <p className="mt-1 text-xs text-[#86868b]">
            Manage profile, studio shipping addresses, orders, and account
            security.
          </p>
        </div>
        <span className="rounded-full border border-black/5 bg-white px-3.5 py-1 text-xs font-semibold text-[#86868b] shadow-sm">
          Studio Portal
        </span>
      </div>
      <div className="gap-7 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="mb-5 lg:sticky lg:top-28 lg:mb-0">
          <AccountNavigation />
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );

  if (isSaleorStorefront) {
    return accountContent;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar menu={menu} />
      {accountContent}
    </div>
  );
}
