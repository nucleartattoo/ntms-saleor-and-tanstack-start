import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CheckoutSteps } from "@/components/custom/checkout/step";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/_checkout/checkout")({
  component: CheckoutNestedLayoutComponent,
});

function CheckoutNestedLayoutComponent() {
  if (isSaleorStorefront) {
    return <Outlet />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <CheckoutSteps />
      <Outlet />
    </div>
  );
}
