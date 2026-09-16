import { createFileRoute } from "@tanstack/react-router";
import { Confirmation } from "@/components/custom/checkout/confirmation";
import { getSaleorOrder } from "@/components/custom/saleor/ntms-cart-actions";
import { NtmsSaleorOrderConfirmationPage } from "@/components/custom/saleor/ntms-order-confirmation-page";
import {
  useVendureOrderByCode,
  vendureOrderByCodeQueryOptions,
} from "@/hooks/use-orders";
import { createBasicMeta } from "@/lib/metadata";
import { decodeNtmsSaleorOrderRouteId } from "@/lib/saleor/route-ids";
import { isSaleorStorefront } from "@/lib/storefront-mode";

export const Route = createFileRoute("/_checkout/checkout/confirmation/$code")({
  loader: async ({ context, params }) => {
    if (isSaleorStorefront) {
      const result = await getSaleorOrder({
        data: {
          orderId: decodeNtmsSaleorOrderRouteId(params.code),
        },
      });

      return { order: null, saleorOrder: result.success ? result.order : null };
    }

    const order = await context.queryClient.ensureQueryData(
      vendureOrderByCodeQueryOptions(params.code),
    );

    return { order, saleorOrder: null };
  },
  head: ({ loaderData }) => {
    if (loaderData?.saleorOrder) {
      return {
        meta: createBasicMeta(
          "Order Confirmation",
          `Your order ${loaderData.saleorOrder.number} has been confirmed.`,
          true,
        ),
      };
    }

    const title = "Order Confirmation";
    const description = loaderData?.order?.code
      ? `Your order ${loaderData.order.code} has been confirmed!`
      : "Thank you for your order!";

    return {
      meta: createBasicMeta(title, description, true),
    };
  },
  component: ConfirmationComponent,
});

function ConfirmationComponent() {
  if (isSaleorStorefront) {
    return <SaleorConfirmationComponent />;
  }

  return <VendureConfirmationComponent />;
}

function SaleorConfirmationComponent() {
  const { saleorOrder } = Route.useLoaderData();

  return <NtmsSaleorOrderConfirmationPage order={saleorOrder} />;
}

function VendureConfirmationComponent() {
  const { code } = Route.useParams();
  const { order: loaderOrder } = Route.useLoaderData();
  const orderQuery = useVendureOrderByCode(code);
  const order = orderQuery.data === undefined ? loaderOrder : orderQuery.data;

  return (
    <div className="mx-auto">
      <Confirmation order={order} />
    </div>
  );
}
