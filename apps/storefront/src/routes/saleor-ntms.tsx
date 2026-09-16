import { createFileRoute, redirect } from "@tanstack/react-router";
import ErrorComponent from "@/components/custom/errors/error";
import { SaleorCartProvider } from "@/components/custom/saleor/ntms-cart-context";
import { NtmsSaleorCartDrawer } from "@/components/custom/saleor/ntms-cart-drawer";
import { getSaleorCatalogPreview } from "@/components/custom/saleor/ntms-catalog-actions";
import { NtmsSaleorCatalogPage } from "@/components/custom/saleor/ntms-catalog-page";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/saleor-ntms")({
  beforeLoad: () => {
    if (isSaleorStorefront) {
      throw redirect({ to: "/" });
    }
  },
  loader: () => getSaleorCatalogPreview(),
  head: () => ({
    meta: [
      {
        title: "Nuclear Tattoo Supply Catalog",
      },
      {
        name: "description",
        content: "Browse products from Nuclear Tattoo Supply.",
      },
    ],
  }),
  errorComponent: ErrorComponent,
  component: SaleorNtmsRoute,
});

function SaleorNtmsRoute() {
  const catalog = Route.useLoaderData();

  if (isSaleorStorefront) {
    return <NtmsSaleorCatalogPage catalog={catalog} />;
  }

  return (
    <SaleorCartProvider>
      <NtmsSaleorCatalogPage catalog={catalog} />
      <NtmsSaleorCartDrawer />
    </SaleorCartProvider>
  );
}
