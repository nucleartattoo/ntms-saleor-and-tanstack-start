import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { refreshActiveOrder } from "@/hooks/use-active-order";
import {
  type CreateAddressInput,
  type CreateCustomerInput,
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderShippingMethod,
} from "@/lib/vendure";

export function useSaveCheckoutAddressMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      address,
      customer,
      shouldSetCustomer,
    }: {
      address: CreateAddressInput;
      customer: CreateCustomerInput;
      shouldSetCustomer: boolean;
    }) => {
      if (shouldSetCustomer) {
        await setCustomerForOrder({ data: customer });
      }

      await setOrderShippingAddress({ data: address });
    },
    onSuccess: async () => {
      await refreshActiveOrder({ queryClient, router });
    },
  });
}

export function useSetCheckoutShippingMethodMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (shippingMethodId: string) => {
      await setOrderShippingMethod({
        data: { shippingMethodId: [shippingMethodId] },
      });
    },
    onSuccess: async () => {
      await refreshActiveOrder({ queryClient, router });
    },
  });
}
