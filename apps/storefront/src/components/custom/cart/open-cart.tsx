import clsx from "clsx";
import { ShoppingCartIcon } from "lucide-react";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#f5f5f7] hover:text-[#0071e3]">
      <ShoppingCartIcon
        className={clsx(
          "h-4 transition-all ease-in-out hover:scale-110",
          className,
        )}
      />

      {quantity ? (
        <div className="absolute right-0 top-0 -mr-2 -mt-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/20 bg-[#0071e3] px-1 text-[11px] font-semibold leading-none text-white shadow-sm">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
