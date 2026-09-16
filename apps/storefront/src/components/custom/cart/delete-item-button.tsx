import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRemoveCartItemMutation } from "@/hooks/use-cart-mutations";

export function DeleteItemButton({
  icon,
  item,
}: {
  icon?: ReactNode;
  item: Pick<{ id: string }, "id">;
}) {
  const removeCartItemMutation = useRemoveCartItemMutation();
  const merchandiseId = item.id;

  const handleRemoveItem = async () => {
    await removeCartItemMutation.mutateAsync(merchandiseId);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleRemoveItem}
        disabled={removeCartItemMutation.isPending}
        aria-label="Remove cart item"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10/12 bg-background/70 text-foreground/52 transition hover:border-rose-500/30 hover:bg-rose-500/12 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {icon ?? <XIcon className="mx-px h-4 w-4" />}
      </button>
      <output aria-live="polite" className="sr-only">
        {removeCartItemMutation.error?.message}
      </output>
    </div>
  );
}
