import { Search as SearchIcon } from "lucide-react";

export function SearchSkeleton() {
  return (
    <form className="relative w-full md:max-w-[560px]">
      <input
        placeholder="Search for products..."
        className="w-full rounded-xl border border-black/10/18 bg-background/68 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-foreground/45 dark:bg-black/35 dark:text-white dark:placeholder:text-neutral-400"
        disabled
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center justify-center">
        <SearchIcon className="h-4 w-4" />
      </div>
    </form>
  );
}
