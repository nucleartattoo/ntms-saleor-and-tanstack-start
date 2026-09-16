import { Check, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNtmsChannel } from "./ntms-channel-context";

export function NtmsChannelSwitcher({ className }: { className?: string }) {
  const { currentChannel, channels, switchChannel, isSwitching } =
    useNtmsChannel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isSwitching}
          aria-label={`Region and currency: ${currentChannel.name} (${currentChannel.currency})`}
          className={cn(
            "relative inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 text-xs font-semibold text-[#1d1d1f] transition-[transform,background-color,color] duration-160 ease-out hover:bg-[#e8e8ed] [@media(hover:hover)]:hover:scale-[1.02] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30",
            isSwitching && "opacity-60 pointer-events-none",
            className,
          )}
        >
          <span className="text-sm leading-none" role="img" aria-hidden="true">
            {currentChannel.flag}
          </span>
          <span className="tracking-tight">{currentChannel.currency}</span>
          <ChevronDown className="h-3 w-3 text-[#86868b] transition-transform duration-200" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-2xl border border-black/[0.06] bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
          Select Store Region
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-black/[0.04]" />
        {channels.map((ch) => {
          const isSelected = ch.slug === currentChannel.slug;
          return (
            <DropdownMenuItem
              key={ch.slug}
              onClick={() => switchChannel(ch.slug)}
              className={cn(
                "group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors duration-150 outline-none",
                isSelected
                  ? "bg-[#f5f5f7] font-semibold text-[#1d1d1f]"
                  : "text-[#1d1d1f]/80 hover:bg-[#f5f5f7]/70 hover:text-[#1d1d1f]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="text-base leading-none"
                  role="img"
                  aria-hidden="true"
                >
                  {ch.flag}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold">{ch.name}</span>
                  <span className="text-[10px] text-[#86868b]">
                    {ch.currency} ({ch.currencySymbol}) · {ch.shortName}
                  </span>
                </div>
              </div>
              {isSelected ? <Check className="h-4 w-4 text-[#0071e3]" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NtmsMobileChannelSelector({
  className,
}: {
  className?: string;
}) {
  const { currentChannel, channels, switchChannel, isSwitching } =
    useNtmsChannel();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
        <Globe className="h-3.5 w-3.5 text-[#0071e3]" />
        <span>Store Region & Currency</span>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-black/[0.04] bg-[#f5f5f7] p-1 shadow-inner">
        {channels.map((ch) => {
          const isSelected = ch.slug === currentChannel.slug;
          return (
            <button
              key={ch.slug}
              type="button"
              disabled={isSwitching}
              onClick={() => switchChannel(ch.slug)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all duration-200",
                isSelected
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#86868b] hover:text-[#1d1d1f]",
                isSwitching && "opacity-50 pointer-events-none",
              )}
            >
              <span
                className="text-sm leading-none"
                role="img"
                aria-hidden="true"
              >
                {ch.flag}
              </span>
              <span>
                {ch.shortName} ({ch.currency})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
