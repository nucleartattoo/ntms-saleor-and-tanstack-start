const RECENT_SEARCHES_KEY = "saleor-ntms-recent-searches";
const RECENT_SEARCHES_EVENT = "saleor-ntms:recent-searches";
const MAX_RECENT_SEARCHES = 5;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readRecentSearches() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentSearch(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery || !canUseStorage()) {
    return;
  }

  const recentSearches = readRecentSearches();
  const nextSearches = [
    normalizedQuery,
    ...recentSearches.filter(
      (item) => item.toLowerCase() !== normalizedQuery.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT_SEARCHES);

  window.localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(nextSearches),
  );
  window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT));
}

export function clearRecentSearches() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT));
}

export function subscribeToRecentSearches(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === RECENT_SEARCHES_KEY) {
      listener();
    }
  };

  window.addEventListener(RECENT_SEARCHES_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(RECENT_SEARCHES_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
