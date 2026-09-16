import { isCancelledError, QueryClient } from "@tanstack/react-query";

export type RouterContext = {
  queryClient: QueryClient;
};

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 15 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !isCancelledError(error) &&
          !(error instanceof DOMException && error.name === "AbortError") &&
          failureCount < 1,
        staleTime: 30_000,
      },
    },
  });
}
