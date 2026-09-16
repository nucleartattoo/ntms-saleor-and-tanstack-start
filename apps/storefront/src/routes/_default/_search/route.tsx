import { createFileRoute, Outlet } from "@tanstack/react-router";
import ErrorComponent from "@/components/custom/errors/error";
import Footer from "@/components/custom/layout/footer";
import Collections from "@/components/custom/layout/search/collections";
import { SearchLayoutSkeleton } from "@/components/custom/skeletons/search";
import {
  collectionsQueryOptions,
  menuQueryOptions,
} from "@/hooks/use-catalog-products";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { sortCollectionsByHierarchy } from "@/lib/utils";

export const Route = createFileRoute("/_default/_search")({
  loader: async ({ context }) => {
    if (isSaleorStorefront) {
      return {
        storefrontBackend: "saleor" as const,
        collections: [],
        menu: [],
      };
    }

    const [collections, menu] = await Promise.all([
      context.queryClient.ensureQueryData(collectionsQueryOptions()),
      context.queryClient.ensureQueryData(menuQueryOptions()),
    ]);

    const sortedCollections = sortCollectionsByHierarchy(collections);

    return {
      storefrontBackend: "vendure" as const,
      collections: sortedCollections,
      menu,
    };
  },
  pendingComponent: SearchLayoutSkeleton,
  errorComponent: ErrorComponent,
  component: SearchLayout,
});

function SearchLayout() {
  const loaderData = Route.useLoaderData();

  if (loaderData.storefrontBackend === "saleor") {
    return <Outlet />;
  }

  const { collections, menu } = loaderData;

  return (
    <>
      <div className="mx-auto grid max-w-screen-2xl gap-5 px-4 py-4 text-foreground sm:px-6 sm:py-6 lg:grid-cols-[minmax(200px,224px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-8">
        <div className="hidden w-full lg:sticky lg:top-28 lg:block">
          <Collections collections={collections} />
        </div>
        <div className="min-w-0 w-full lg:col-start-2">
          <Outlet />
        </div>
      </div>
      <Footer menu={menu} />
    </>
  );
}
