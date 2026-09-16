import { useMatchRoute, useSearch } from "@tanstack/react-router";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ListItem } from ".";
import { FilterItem } from "./item";

export default function FilterItemDropdown({
  buttonLabel,
  compact = false,
  icon: Icon,
  list,
  placement = "bottom",
}: {
  buttonLabel?: string;
  compact?: boolean;
  icon?: LucideIcon;
  list: readonly ListItem[];
  placement?: "bottom" | "top";
}) {
  const matchRoute = useMatchRoute();
  const { sort } = useSearch({ strict: false });
  const active = useMemo(() => {
    for (const listItem of list) {
      if (
        "slug" in listItem &&
        (sort === listItem.slug ||
          !!matchRoute({
            to: "/collections/$collection",
            params: { collection: listItem.slug },
          }))
      ) {
        return listItem.name;
      }
    }
    return "";
  }, [list, sort, matchRoute]);
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpenSelect(!openSelect);
        }}
        aria-haspopup="menu"
        aria-expanded={openSelect}
        data-state={openSelect ? "open" : "closed"}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-black/10/18 bg-background/65 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/50",
          compact ? "gap-1.5 px-2.5" : "gap-2 px-3",
        )}
      >
        <span
          className={cn(
            "inline-flex min-w-0 items-center",
            compact ? "gap-1.5" : "gap-2",
          )}
        >
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="truncate">
            {buttonLabel || active || "Select a filter"}
          </span>
        </span>
        <ChevronDown className="h-4 shrink-0" aria-hidden="true" />
      </button>
      {openSelect && (
        <div
          role="menu"
          onClick={() => {
            setOpenSelect(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              setOpenSelect(false);
            }
          }}
          className={cn(
            "absolute z-40 max-h-[min(60vh,28rem)] w-full overflow-auto rounded-2xl border border-black/5 bg-card/94 p-3 shadow-[0_18px_55px_rgba(0,0,0,.24)] backdrop-blur-2xl",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {list.map((item: ListItem) => (
            <FilterItem key={`filter-${item.slug || item.name}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
