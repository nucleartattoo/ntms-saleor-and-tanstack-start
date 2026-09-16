import type { ResultOf } from "gql.tada";
import { Suspense } from "react";
import type { SortFilterItem } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { collectionFragment } from "@/lib/vendure/queries/collection";
import FilterItemDropdown from "./dropdown";
import { FilterItem } from "./item";

export type PathFilterItem = Pick<
  ResultOf<typeof collectionFragment>,
  "slug" | "parentId" | "name"
>;
export type ListItem = SortFilterItem | PathFilterItem;

function FilterItemList({
  list,
  variant,
}: {
  list: readonly ListItem[];
  variant?: "sidebar" | "toolbar";
}) {
  return (
    <>
      {list.map((item) => (
        <FilterItem
          key={`filter-${item.slug || item.name}`}
          item={item}
          variant={variant}
        />
      ))}
    </>
  );
}

export default function FilterList({
  list,
  title,
  description = "Refine the catalog without leaving the current view.",
  className,
  variant = "sidebar",
}: {
  list: readonly ListItem[];
  title?: string;
  description?: string;
  className?: string;
  variant?: "sidebar" | "toolbar";
}) {
  const isToolbar = variant === "toolbar";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/10/12 bg-card/90 p-3 shadow-[0_16px_42px_rgba(0,0,0,.08)] backdrop-blur-xl sm:p-4",
        isToolbar && "mx-auto w-full p-4 sm:p-5",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/45 to-transparent" />
      {title ? (
        isToolbar ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                {title}
              </p>
              <p className="mt-1 text-sm text-foreground/50">{description}</p>
            </div>
            <div className="hidden min-w-0 flex-wrap justify-center gap-2 md:flex lg:justify-end">
              <Suspense fallback={null}>
                <FilterItemList list={list} variant={variant} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="mb-3 border-b border-black/10/8 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
              {title}
            </p>
            <p className="mt-1 text-sm text-foreground/50">{description}</p>
          </div>
        )
      ) : null}
      <div className={cn(isToolbar ? "hidden" : "hidden md:block")}>
        <ul className="space-y-1.5">
          <Suspense fallback={null}>
            <FilterItemList list={list} variant={variant} />
          </Suspense>
        </ul>
      </div>
      <div className={cn(isToolbar ? "mt-4 md:hidden" : "md:hidden")}>
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} />
        </Suspense>
      </div>
    </section>
  );
}
