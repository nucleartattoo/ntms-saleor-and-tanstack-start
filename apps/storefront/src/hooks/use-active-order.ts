import type { QueryClient } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { useRouter } from "@tanstack/react-router";
import {
  checkoutPaymentReadinessQueryKey,
  eligiblePaymentMethodsQueryKey,
  eligibleShippingMethodsQueryKey,
} from "@/hooks/use-checkout-options";
import { orderHistoryQueryKey } from "@/hooks/use-orders";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import { getActiveOrder } from "@/lib/vendure";

export const activeOrderQueryKey = ["cart", "active-order"] as const;
type RouterInstance = ReturnType<typeof useRouter>;

export function activeOrderQueryOptions() {
  return queryOptions({
    queryKey: activeOrderQueryKey,
    queryFn: () => getActiveOrder(),
    staleTime: 0,
  });
}

export function useActiveOrder({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    ...activeOrderQueryOptions(),
    enabled,
  });
}

export async function refreshStorefrontState({
  queryClient,
  router,
  invalidateRouter = true,
}: {
  queryClient: QueryClient;
  router: RouterInstance;
  invalidateRouter?: boolean;
}) {
  if (isSaleorStorefront) {
    queryClient.invalidateQueries({ queryKey: ["account"] });
    if (invalidateRouter) {
      await router.invalidate();
    }
    return;
  }

  await queryClient.fetchQuery(activeOrderQueryOptions());
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: eligibleShippingMethodsQueryKey,
    }),
    queryClient.invalidateQueries({ queryKey: eligiblePaymentMethodsQueryKey }),
    queryClient.invalidateQueries({
      queryKey: checkoutPaymentReadinessQueryKey,
    }),
    queryClient.invalidateQueries({ queryKey: orderHistoryQueryKey }),
  ]);
  if (invalidateRouter) {
    await router.invalidate();
  }
}

export const refreshActiveOrder = refreshStorefrontState;

export async function clearPrivateStorefrontState({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  queryClient.removeQueries({ queryKey: ["account"] });
  queryClient.removeQueries({ queryKey: ["cart"] });
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: eligibleShippingMethodsQueryKey,
    }),
    queryClient.invalidateQueries({ queryKey: eligiblePaymentMethodsQueryKey }),
    queryClient.invalidateQueries({
      queryKey: checkoutPaymentReadinessQueryKey,
    }),
  ]);
}
