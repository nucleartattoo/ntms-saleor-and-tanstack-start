import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { NtmsSaleorCheckout } from "@/lib/saleor/checkout";
import {
  addSaleorCartLine,
  addSaleorCheckoutPromoCode,
  getSaleorCart,
  removeSaleorCartLine,
  removeSaleorCheckoutPromoCode,
  updateSaleorCartLine,
} from "./ntms-cart-actions";

const saleorCheckoutStorageKey = "ntms-saleor-checkout-id";
const saleorCartQueryKey = ["saleor", "cart"] as const;

type SaleorCartContextType = {
  addPromoCode: (promoCode: string) => Promise<void>;
  addLine: (input: { quantity?: number; variantId: string }) => Promise<void>;
  checkout: NtmsSaleorCheckout | null;
  clearCartSession: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
  isLoading: boolean;
  isMutating: boolean;
  openCart: () => void;
  removeLine: (lineId: string) => Promise<void>;
  removePromoCode: () => Promise<void>;
  syncCheckout: (checkout: NtmsSaleorCheckout | null) => void;
  updateLine: (input: { lineId: string; quantity: number }) => Promise<void>;
};

const SaleorCartContext = createContext<SaleorCartContextType | undefined>(
  undefined,
);

export function SaleorCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const checkoutQuery = useQuery({
    queryKey: [...saleorCartQueryKey, checkoutId],
    queryFn: async () => {
      const result = await getSaleorCart({ data: { checkoutId } });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.checkout;
    },
    enabled: isHydrated && Boolean(checkoutId),
    staleTime: 20_000,
  });
  const checkout = checkoutQuery.data ?? null;

  useEffect(() => {
    setCheckoutId(window.localStorage.getItem(saleorCheckoutStorageKey));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && checkoutId && checkoutQuery.isError) {
      window.localStorage.removeItem(saleorCheckoutStorageKey);
      setCheckoutId(null);
    }
  }, [checkoutId, checkoutQuery.isError, isHydrated]);

  const syncCheckout = useCallback(
    (nextCheckout: NtmsSaleorCheckout | null) => {
      if (!nextCheckout) {
        return;
      }

      if (nextCheckout.lines.length === 0) {
        window.localStorage.removeItem(saleorCheckoutStorageKey);
        setCheckoutId(null);
        queryClient.removeQueries({
          queryKey: [...saleorCartQueryKey, nextCheckout.id],
        });
        return;
      }

      window.localStorage.setItem(saleorCheckoutStorageKey, nextCheckout.id);
      setCheckoutId(nextCheckout.id);
      queryClient.setQueryData(
        [...saleorCartQueryKey, nextCheckout.id],
        nextCheckout,
      );
    },
    [queryClient],
  );

  const addLineMutation = useMutation({
    mutationFn: async ({
      quantity = 1,
      variantId,
    }: {
      quantity?: number;
      variantId: string;
    }) => {
      const result = await addSaleorCartLine({
        data: { checkoutId, quantity, variantId },
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.checkout;
    },
    onSuccess: syncCheckout,
  });

  const updateLineMutation = useMutation({
    mutationFn: async ({
      lineId,
      quantity,
    }: {
      lineId: string;
      quantity: number;
    }) => {
      const result = await updateSaleorCartLine({
        data: { checkoutId, lineId, quantity },
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.checkout;
    },
    onSuccess: syncCheckout,
  });

  const removeLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const result = await removeSaleorCartLine({
        data: { checkoutId, lineId },
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.checkout;
    },
    onSuccess: syncCheckout,
  });

  const addPromoCodeMutation = useMutation({
    mutationFn: async (promoCode: string) => {
      const result = await addSaleorCheckoutPromoCode({
        data: { checkoutId, promoCode },
      });
      if (!result.success) throw new Error(result.error);
      return result.checkout;
    },
    onSuccess: syncCheckout,
  });

  const removePromoCodeMutation = useMutation({
    mutationFn: async () => {
      const result = await removeSaleorCheckoutPromoCode({
        data: { checkoutId, promoCode: checkout?.voucherCode },
      });
      if (!result.success) throw new Error(result.error);
      return result.checkout;
    },
    onSuccess: syncCheckout,
  });

  const clearCartSession = useCallback(() => {
    window.localStorage.removeItem(saleorCheckoutStorageKey);
    setCheckoutId(null);
    queryClient.removeQueries({ queryKey: saleorCartQueryKey });
  }, [queryClient]);

  const value = useMemo<SaleorCartContextType>(
    () => ({
      addPromoCode: async (promoCode) => {
        await addPromoCodeMutation.mutateAsync(promoCode);
      },
      addLine: async (input) => {
        await addLineMutation.mutateAsync(input);
      },
      checkout,
      clearCartSession,
      closeCart: () => setIsCartOpen(false),
      isCartOpen,
      isLoading: checkoutQuery.isFetching,
      isMutating:
        addLineMutation.isPending ||
        addPromoCodeMutation.isPending ||
        removePromoCodeMutation.isPending ||
        updateLineMutation.isPending ||
        removeLineMutation.isPending,
      openCart: () => setIsCartOpen(true),
      removeLine: async (lineId) => {
        await removeLineMutation.mutateAsync(lineId);
      },
      removePromoCode: async () => {
        await removePromoCodeMutation.mutateAsync();
      },
      syncCheckout,
      updateLine: async (input) => {
        await updateLineMutation.mutateAsync(input);
      },
    }),
    [
      addLineMutation,
      addPromoCodeMutation,
      checkout,
      checkoutQuery.isFetching,
      clearCartSession,
      isCartOpen,
      removeLineMutation,
      removePromoCodeMutation,
      syncCheckout,
      updateLineMutation,
    ],
  );

  return (
    <SaleorCartContext.Provider value={value}>
      {children}
    </SaleorCartContext.Provider>
  );
}

export function useSaleorCart() {
  const context = useContext(SaleorCartContext);
  if (!context) {
    throw new Error("useSaleorCart must be used within SaleorCartProvider");
  }
  return context;
}
