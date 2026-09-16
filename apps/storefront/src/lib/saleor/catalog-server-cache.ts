type CatalogCacheEntry<T> = {
  accessedAt: number;
  expiresAt: number;
  hasValue: boolean;
  pending?: Promise<T>;
  staleUntil: number;
  value?: T;
};

type CatalogCacheOptions<T> = {
  key: string;
  load: () => Promise<T>;
  staleIfErrorMs?: number;
  ttlMs: number;
};

const catalogCache = new Map<string, CatalogCacheEntry<unknown>>();
const maxCatalogCacheEntries = 250;

export async function readThroughCatalogCache<T>({
  key,
  load,
  staleIfErrorMs = 10 * 60_000,
  ttlMs,
}: CatalogCacheOptions<T>): Promise<T> {
  const now = Date.now();
  const existing = catalogCache.get(key) as CatalogCacheEntry<T> | undefined;

  if (existing?.hasValue && existing.expiresAt > now) {
    existing.accessedAt = now;
    return existing.value as T;
  }

  if (existing?.pending) {
    existing.accessedAt = now;
    return existing.pending;
  }

  const pending = load()
    .then((value) => {
      const loadedAt = Date.now();
      catalogCache.set(key, {
        accessedAt: loadedAt,
        expiresAt: loadedAt + ttlMs,
        hasValue: true,
        staleUntil: loadedAt + ttlMs + staleIfErrorMs,
        value,
      });
      pruneCatalogCache();
      return value;
    })
    .catch((error: unknown) => {
      const failedAt = Date.now();
      if (existing?.hasValue && existing.staleUntil > failedAt) {
        catalogCache.set(key, {
          ...existing,
          accessedAt: failedAt,
          expiresAt: failedAt + Math.min(ttlMs, 15_000),
          pending: undefined,
        });
        return existing.value as T;
      }

      catalogCache.delete(key);
      throw error;
    });

  catalogCache.set(key, {
    accessedAt: now,
    expiresAt: existing?.expiresAt ?? 0,
    hasValue: existing?.hasValue ?? false,
    pending,
    staleUntil: existing?.staleUntil ?? 0,
    value: existing?.value,
  });
  pruneCatalogCache();

  return pending;
}

export function clearCatalogServerCache() {
  catalogCache.clear();
}

export function getCatalogServerCacheSize() {
  return catalogCache.size;
}

function pruneCatalogCache() {
  if (catalogCache.size <= maxCatalogCacheEntries) {
    return;
  }

  const removableEntries = [...catalogCache.entries()]
    .filter(([, entry]) => !entry.pending)
    .sort(([, left], [, right]) => left.accessedAt - right.accessedAt);

  for (const [key] of removableEntries) {
    if (catalogCache.size <= maxCatalogCacheEntries) {
      break;
    }
    catalogCache.delete(key);
  }
}
