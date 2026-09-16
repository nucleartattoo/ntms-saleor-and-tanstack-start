import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/custom/layout/navbar";
import { menuQueryOptions } from "@/hooks/use-catalog-products";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/_default")({
  loader: async ({ context }) => {
    if (isSaleorStorefront) {
      return {
        menu: null,
      };
    }

    const menu = await context.queryClient.ensureQueryData(menuQueryOptions());

    return {
      menu,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { menu } = Route.useLoaderData();

  if (isSaleorStorefront) {
    return <Outlet />;
  }

  return (
    <div>
      <Navbar menu={menu ?? []} />
      <Outlet />
    </div>
  );
}
