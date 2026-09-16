import { ArrowDownAZ, SlidersHorizontal } from "lucide-react";
import type { SortFilterItem } from "@/lib/constants";
import { cn } from "@/lib/utils";
import FilterItemDropdown from "./filter/dropdown";

export function MobileCatalogActions({
  activeFilterCount = 0,
  className,
  count,
  filterTargetId,
  hasFilters = false,
  sortItems,
}: {
  activeFilterCount?: number;
  className?: string;
  count: number;
  filterTargetId?: string;
  hasFilters?: boolean;
  sortItems: readonly SortFilterItem[];
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-black/10/14 bg-background/90 px-3 py-3 shadow-[0_-18px_42px_rgba(0,0,0,.18)] backdrop-blur-2xl lg:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-screen-sm items-center gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-black/10/12 bg-card/72 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0071e3]">
            Catalog
          </p>
          <p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-foreground">
            {count} {count === 1 ? "result" : "results"}
          </p>
        </div>
        <div
          className={cn(
            "grid shrink-0 gap-2",
            hasFilters ? "grid-cols-[6.9rem_6.75rem]" : "grid-cols-[6.9rem]",
          )}
        >
          <div className="min-w-0">
            <FilterItemDropdown
              buttonLabel="Sort"
              compact
              icon={ArrowDownAZ}
              list={sortItems}
              placement="top"
            />
          </div>
          {hasFilters && filterTargetId ? (
            <a
              href={`#${filterTargetId}`}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-black/10/18 bg-background/65 px-3 py-2.5 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl transition hover:border-black/10/34 hover:text-[#0071e3]"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                Filter{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
