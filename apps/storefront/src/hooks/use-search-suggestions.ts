import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/vendure";

const MIN_SEARCH_SUGGESTION_LENGTH = 2;
const MAX_SEARCH_SUGGESTIONS = 5;

export function useSearchSuggestions(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["search-suggestions", normalizedQuery],
    queryFn: async () => {
      const products = await getProducts({
        data: {
          query: normalizedQuery,
          direction: "ASC",
          sortKey: "name",
        },
      });

      return products.slice(0, MAX_SEARCH_SUGGESTIONS);
    },
    enabled: normalizedQuery.length >= MIN_SEARCH_SUGGESTION_LENGTH,
    staleTime: 60_000,
  });
}
