import { Loader2, TicketPercent, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaleorCart } from "./ntms-cart-context";

export function NtmsSaleorPromoCode() {
  const { addPromoCode, checkout, isMutating, removePromoCode } =
    useSaleorCart();
  const [code, setCode] = useState("");
  const activeCode = checkout?.voucherCode.trim() ?? "";

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const promoCode = code.trim();
    if (!promoCode) return;
    try {
      await addPromoCode(promoCode);
      setCode("");
      toast.success("Promo code applied");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to apply promo code",
      );
    }
  };

  const handleRemove = async () => {
    try {
      await removePromoCode();
      toast.success("Promo code removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove promo code",
      );
    }
  };

  if (activeCode) {
    return (
      <div
        className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/70 px-4 py-2.5"
        data-saleor-promo-code-active
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <TicketPercent className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Promo applied
            </p>
            <p className="truncate text-xs font-semibold text-emerald-950">
              {activeCode}
            </p>
          </div>
        </div>
        <button
          aria-label="Remove promo code"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-700/60 transition hover:bg-emerald-100 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
          data-saleor-remove-promo-code
          disabled={isMutating}
          onClick={handleRemove}
          title="Remove promo code"
          type="button"
        >
          {isMutating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex min-w-0 gap-2"
      data-saleor-promo-code-form
      onSubmit={handleApply}
    >
      <div className="relative min-w-0 flex-1">
        <TicketPercent className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
        <Input
          aria-label="Promo code"
          autoCapitalize="characters"
          autoComplete="off"
          className="h-10 rounded-full border border-black/[0.08] bg-[#f5f5f7] pl-10 text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
          data-saleor-promo-code-input
          disabled={isMutating}
          onChange={(event) => setCode(event.currentTarget.value)}
          placeholder="Discount or promo code"
          spellCheck={false}
          value={code}
        />
      </div>
      <Button
        className="h-10 shrink-0 rounded-full bg-[#1d1d1f] px-5 text-xs font-semibold text-white transition-[transform,background-color] duration-160 ease-out hover:bg-black [@media(hover:hover)]:hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
        data-saleor-apply-promo-code
        disabled={isMutating || !code.trim()}
        type="submit"
      >
        {isMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Apply
      </Button>
    </form>
  );
}
