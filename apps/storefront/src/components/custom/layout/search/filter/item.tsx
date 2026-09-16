import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { clientEnv } from "@/env/client";
import type { SortFilterItem } from "@/lib/constants";
import type { ListItem, PathFilterItem } from ".";

type FilterItemVariant = "sidebar" | "toolbar";

function PathFilterItemComponent({ item }: { item: PathFilterItem }) {
  const { VITE_PARENT_ID } = clientEnv;
  return (
    <li className="flex text-foreground dark:text-white" key={item.slug}>
      <Link
        to="/collections/$collection"
        params={{ collection: item.slug }}
        activeOptions={{ exact: false }}
        className={clsx(
          "w-full rounded-lg border border-transparent px-3 py-2 text-sm transition",
          {
            "pl-5 text-foreground/72": item.parentId !== VITE_PARENT_ID,
          },
        )}
        activeProps={{
          className:
            "border-black/10/16 bg-[#0071e3]/9 font-medium text-foreground",
        }}
        inactiveProps={{
          className:
            "text-foreground/58 hover:border-black/10/10 hover:bg-[#0071e3]/5 hover:text-foreground",
        }}
      >
        <span>{item.name}</span>
      </Link>
    </li>
  );
}

function SortFilterItemComponent({
  item,
  variant = "sidebar",
}: {
  item: SortFilterItem;
  variant?: FilterItemVariant;
}) {
  const isToolbar = variant === "toolbar";

  return (
    <li className="flex text-foreground dark:text-white" key={item.slug}>
      <Link
        to="."
        search={(prev) => ({
          ...prev,
          page: undefined,
          ...(item?.slug?.length ? { sort: item.slug } : { sort: undefined }),
        })}
        className={clsx(
          "inline-flex items-center justify-center border text-sm transition",
          isToolbar
            ? "w-auto whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.08em]"
            : "w-full rounded-lg px-3 py-2",
        )}
        activeProps={{
          className: clsx(
            "border-black/10/16 bg-[#0071e3]/9 text-foreground",
            isToolbar
              ? "font-semibold shadow-[0_10px_24px_rgba(0,0,0,.12)]"
              : "font-medium",
          ),
          "aria-current": "page",
        }}
        inactiveProps={{
          className: clsx(
            "border-transparent text-foreground/58 hover:border-black/10/10 hover:bg-[#0071e3]/5 hover:text-foreground",
            isToolbar && "bg-background/55",
          ),
        }}
      >
        {item.name}
      </Link>
    </li>
  );
}

export function FilterItem({
  item,
  variant = "sidebar",
}: {
  item: ListItem;
  variant?: FilterItemVariant;
}) {
  return "sortKey" in item ? (
    <SortFilterItemComponent item={item} variant={variant} />
  ) : (
    <PathFilterItemComponent item={item} />
  );
}
