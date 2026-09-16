import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  addItem,
  removeItem,
  updateItemQuantity,
} from "@/components/custom/cart/actions";
import { refreshActiveOrder } from "@/hooks/use-active-order";

async function assertCartMutationSuccess(
  result: Awaited<ReturnType<typeof addItem>>,
) {
  if (!result.success) {
    throw new Error(result.error || "Cart update failed");
  }

  return result;
}

export function useAddCartItemMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (selectedVariantId: string) => {
      const result = await addItem({ data: { selectedVariantId } });
      return assertCartMutationSuccess(result);
    },
    onSuccess: async () => {
      await refreshActiveOrder({ queryClient, router });
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (merchandiseId: string) => {
      const result = await removeItem({ data: { merchandiseId } });
      return assertCartMutationSuccess(result);
    },
    onSuccess: async () => {
      await refreshActiveOrder({ queryClient, router });
    },
  });
}

export function useUpdateCartItemQuantityMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      merchandiseId,
      quantity,
    }: {
      merchandiseId: string;
      quantity: number;
    }) => {
      const result = await updateItemQuantity({
        data: { merchandiseId, quantity },
      });
      return assertCartMutationSuccess(result);
    },
    onSuccess: async () => {
      await refreshActiveOrder({ queryClient, router });
    },
  });
}
