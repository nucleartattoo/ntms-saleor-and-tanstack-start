import { ArrowDownAZ, Filter, Search, Sparkles } from "lucide-react";
import type { SortFilterItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ResultStatusProps {
  count: number;
  description: string;
  sort?: string;
  kind: "search" | "collection";
  className?: string;
}

const sortLabelBySlug = new Map<string, string>([
  ["name-a-z", "Name: A to Z"],
  ["name-z-a", "Name: Z to A"],
  ["price-asc", "Price: Low to high"],
  ["price-desc", "Price: High to low"],
] satisfies Array<[SortFilterItem["slug"], string]>);

export function ResultStatus({
  count,
  description,
  sort,
  kind,
  className,
}: ResultStatusProps) {
  const sortLabel = sort ? sortLabelBySlug.get(sort) : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-black/10/12 bg-card/88 px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/45 to-transparent" />
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/5 bg-background/70 text-[#0071e3]">
          {kind === "search" ? (
            <Search className="h-4 w-4" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {count} {count === 1 ? "result" : "results"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-foreground/55">
            {description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-background/70 px-3 py-1 text-xs text-foreground/55">
          <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" />
          Live results
        </span>
        {sortLabel ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-background/70 px-3 py-1 text-xs text-foreground/55">
            <ArrowDownAZ className="h-3.5 w-3.5" />
            {sortLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
