import type { ResultOf } from "gql.tada";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useActiveOrder } from "@/hooks/use-active-order";
import type activeOrderFragment from "@/lib/vendure/fragments/active-order";

// import type productFragment from "@/lib/vendure/fragments/product";
// import type { variantFragment } from "@/lib/vendure/fragments/product";

// type UpdateType = "plus" | "minus" | "delete";

// type CartAction =
//   | {
//       type: "UPDATE_ITEM";
//       payload: { merchandiseId: string; updateType: UpdateType };
//     }
//   | {
//       type: "ADD_ITEM";
//       payload: {
//         variant: ResultOf<typeof variantFragment>;
//         product: ResultOf<typeof productFragment>;
//       };
//     };

type CartContextType = {
  cart?: ResultOf<typeof activeOrderFragment> | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

let cartOpenSnapshot = false;
const cartOpenListeners = new Set<(isOpen: boolean) => void>();

function setCartOpenSnapshot(isOpen: boolean) {
  cartOpenSnapshot = isOpen;
  cartOpenListeners.forEach((listener) => {
    listener(isOpen);
  });
}

export function CartProvider({
  children,
  initialCart,
  hasSession,
}: {
  children: React.ReactNode;
  initialCart: ResultOf<typeof activeOrderFragment> | null;
  hasSession: boolean;
}) {
  const [isCartOpen, setIsCartOpen] = useState(cartOpenSnapshot);
  const activeOrderQuery = useActiveOrder({ enabled: hasSession });
  const cart = activeOrderQuery.data ?? initialCart;

  useEffect(() => {
    cartOpenListeners.add(setIsCartOpen);
    setIsCartOpen(cartOpenSnapshot);

    return () => {
      cartOpenListeners.delete(setIsCartOpen);
    };
  }, []);

  const openCart = useCallback(() => setCartOpenSnapshot(true), []);
  const closeCart = useCallback(() => setCartOpenSnapshot(false), []);

  const value = useMemo(
    () => ({
      cart,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [cart, closeCart, isCartOpen, openCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
