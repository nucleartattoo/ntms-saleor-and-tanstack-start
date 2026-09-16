import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useId, useState } from "react";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { formatCurrency, getSearchResultPrice } from "@/lib/utils";

export default function Search() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const [isHydrated, setIsHydrated] = useState(false);
  const [query, setQuery] = useState(search?.q || "");
  const [isFocused, setIsFocused] = useState(false);
  const suggestionsId = useId();
  const suggestionsQuery = useSearchSuggestions(isHydrated ? query : "");
  const suggestions = suggestionsQuery.data ?? [];
  const showSuggestions =
    isFocused &&
    query.trim().length >= 2 &&
    (suggestionsQuery.isFetching || suggestions.length > 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isHydrated) return;

    const normalizedQuery = query.trim();

    navigate({
      to: "/search",
      search: { q: normalizedQuery || undefined },
    });
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const inputEl = document.querySelector<HTMLInputElement>(
          'input[role="combobox"]',
        );
        if (inputEl) {
          inputEl.focus();
          setIsFocused(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <search className="relative w-full md:max-w-[560px]">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="q"
          role="combobox"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? suggestionsId : undefined}
          aria-expanded={showSuggestions}
          placeholder="Search products, gear... (⌘K)"
          autoComplete="off"
          disabled={!isHydrated}
          value={query}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 150);
          }}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full rounded-full border border-black/5 bg-[#f5f5f7] px-4 py-2.5 pr-10 text-sm text-[#1d1d1f] placeholder:text-[#86868b] transition focus:border-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/20"
        />
        <button
          type="submit"
          aria-label="Search"
          disabled={!isHydrated}
          className="absolute right-0 top-0 mr-3 flex h-full cursor-pointer items-center justify-center border-none bg-transparent text-foreground/55 transition hover:text-[#0071e3] dark:text-neutral-300"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
        {showSuggestions ? (
          <div
            id={suggestionsId}
            className="absolute left-0 top-full z-40 mt-2 max-h-[min(64vh,32rem)] w-full overflow-hidden rounded-3xl border border-black/5 bg-white/95 text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
          >
            <div className="border-b border-black/5 px-5 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
                Search suggestions
              </p>
              <p className="mt-1 truncate text-sm text-foreground/55">
                Matching "{query.trim()}"
              </p>
            </div>
            {suggestionsQuery.isFetching && suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-foreground/60">
                Searching...
              </div>
            ) : (
              <ul
                aria-label="Search suggestions"
                className="max-h-[min(48vh,23rem)] overflow-auto"
              >
                {suggestions.map((product) => (
                  <li key={product.slug}>
                    <Link
                      to="/product/$productId"
                      params={{ productId: product.slug }}
                      className="group flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-[#f5f5f7] focus:bg-[#f5f5f7] focus:outline-none"
                    >
                      {product.productAsset?.preview ? (
                        <img
                          src={product.productAsset.preview}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-2xl border border-black/5 bg-[#f5f5f7] object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded-lg border border-black/10/10 bg-[#0071e3]/10 dark:bg-neutral-800" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {product.productName}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-foreground/55 dark:text-neutral-400">
                          <span className="truncate">SKU {product.sku}</span>
                          <span className="h-1 w-1 rounded-full bg-[#0071e3]/45" />
                          {formatCurrency(
                            Number(getSearchResultPrice(product)),
                            product.currencyCode,
                          )}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-foreground/35 transition group-hover:translate-x-0.5 group-hover:text-[#0071e3]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/search"
              search={{ q: query.trim(), sort: "name-a-z" }}
              className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-3.5 text-sm font-semibold text-[#0071e3] transition hover:bg-[#f5f5f7]"
            >
              View all results
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </form>
    </search>
  );
}
