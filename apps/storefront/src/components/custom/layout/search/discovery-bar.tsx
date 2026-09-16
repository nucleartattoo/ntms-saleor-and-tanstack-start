import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  clearRecentSearches,
  readRecentSearches,
  subscribeToRecentSearches,
} from "@/lib/recent-searches";
import { cn } from "@/lib/utils";

const quickSearches = [
  { label: "Machines", query: "machine" },
  { label: "Needles", query: "needle" },
  { label: "Power", query: "power supply" },
  { label: "Grips", query: "grip" },
];

const collectionLinks = [
  { label: "Tattoo Machines", slug: "machines" },
  { label: "Needles", slug: "cartridge-needles" },
  { label: "Power Supplies", slug: "power-supply" },
];

export function SearchDiscoveryBar({ compact = false }: { compact?: boolean }) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const syncRecentSearches = () => {
      setRecentSearches(readRecentSearches());
    };

    syncRecentSearches();

    return subscribeToRecentSearches(syncRecentSearches);
  }, []);

  return (
    <section className="relative min-w-0 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/55 to-transparent" />
      <div
        className={cn(
          "grid min-w-0 gap-0",
          compact
            ? "xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.38fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)]",
        )}
      >
        <div
          className={cn(
            "min-w-0 border-b border-black/[0.06] px-4 py-4 sm:px-6",
            compact ? "xl:border-b-0 xl:border-r" : "lg:border-b-0 lg:border-r",
          )}
        >
          <div className="flex items-center gap-2 text-[#0071e3]">
            <Search className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Quick search
            </p>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            {quickSearches.map((item) => (
              <Link
                key={item.query}
                to="/search"
                search={{ q: item.query, sort: "name-a-z" }}
                className="inline-flex min-w-0 items-center gap-2 rounded-full border border-black/10/14 bg-background/62 px-3 py-2 text-sm font-semibold text-foreground/72 transition hover:border-black/10/34 hover:text-foreground"
              >
                {item.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
          {recentSearches.length > 0 && !compact ? (
            <div className="mt-4 border-t border-black/10/8 pt-4">
              <div className="flex items-center justify-between gap-3 text-[#0071e3]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Recent searches
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Clear recent searches"
                  onClick={clearRecentSearches}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10/14 bg-background/52 text-foreground/55 transition hover:border-black/10 hover:text-[#0071e3]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {recentSearches.map((query) => (
                  <Link
                    key={query}
                    to="/search"
                    search={{ q: query, sort: "name-a-z" }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10/12 bg-background/46 px-3 py-2 text-sm font-medium text-foreground/65 transition hover:border-black/10 hover:text-foreground"
                  >
                    {query}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 text-[#0071e3]">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Core collections
            </p>
          </div>
          <div
            className={cn(
              "mt-3 grid gap-2",
              compact && "sm:grid-cols-3 xl:grid-cols-1",
            )}
          >
            {collectionLinks.map((item) => (
              <Link
                key={item.slug}
                to="/collections/$collection"
                params={{ collection: item.slug }}
                search={{ sort: "name-a-z" }}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-black/10/10 bg-background/54 px-3 py-2.5 text-sm font-medium text-foreground/68 transition hover:border-black/10/28 hover:text-foreground"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-[#0071e3]" />
                  <span className="truncate">{item.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
