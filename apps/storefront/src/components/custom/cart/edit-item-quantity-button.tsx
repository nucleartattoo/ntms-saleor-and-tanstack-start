import clsx from "clsx";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useUpdateCartItemQuantityMutation } from "@/hooks/use-cart-mutations";

function SubmitButton({
  type,
  isLoading,
  onClick,
}: {
  type: "plus" | "minus";
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={
        type === "plus" ? "Increase item quantity" : "Reduce item quantity"
      }
      className={clsx(
        "ease flex h-8 min-w-8 max-w-8 flex-none items-center justify-center rounded-lg border border-black/10/14 bg-background/70 px-2 transition-all duration-200 hover:border-black/10/42 hover:bg-[#0071e3]/9 disabled:cursor-not-allowed disabled:opacity-60",
        {
          "ml-auto": type === "minus",
        },
      )}
    >
      {type === "plus" ? (
        <PlusIcon className="h-4 w-4 text-foreground/70" />
      ) : (
        <MinusIcon className="h-4 w-4 text-foreground/70" />
      )}
    </button>
  );
}

export function EditItemQuantityButton({
  item,
  type,
}: {
  item: { id: string; quantity: number };
  type: "plus" | "minus";
}) {
  const updateCartItemQuantityMutation = useUpdateCartItemQuantityMutation();

  const newQuantity = type === "plus" ? item.quantity + 1 : item.quantity - 1;

  const handleUpdateQuantity = async () => {
    await updateCartItemQuantityMutation.mutateAsync({
      merchandiseId: item.id,
      quantity: newQuantity,
    });
  };

  return (
    <div>
      <SubmitButton
        type={type}
        isLoading={updateCartItemQuantityMutation.isPending}
        onClick={handleUpdateQuantity}
      />
      <output aria-live="polite" className="sr-only">
        {updateCartItemQuantityMutation.error?.message}
      </output>
    </div>
  );
}
