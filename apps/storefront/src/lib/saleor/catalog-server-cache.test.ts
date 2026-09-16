import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearCatalogServerCache,
  readThroughCatalogCache,
} from "./catalog-server-cache";

describe("Saleor catalog server cache", () => {
  afterEach(() => {
    clearCatalogServerCache();
    vi.useRealTimers();
  });

  test("deduplicates concurrent loads and reuses fresh data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T00:00:00Z"));
    let loadCount = 0;
    let resolveLoad!: (value: string) => void;
    const pendingLoad = new Promise<string>((resolve) => {
      resolveLoad = resolve;
    });
    const load = vi.fn(() => {
      loadCount += 1;
      return pendingLoad;
    });

    const first = readThroughCatalogCache({
      key: "catalog:test",
      load,
      ttlMs: 60_000,
    });
    const second = readThroughCatalogCache({
      key: "catalog:test",
      load,
      ttlMs: 60_000,
    });

    expect(loadCount).toBe(1);
    resolveLoad("cached");
    await expect(Promise.all([first, second])).resolves.toEqual([
      "cached",
      "cached",
    ]);
    await expect(
      readThroughCatalogCache({ key: "catalog:test", load, ttlMs: 60_000 }),
    ).resolves.toBe("cached");
    expect(loadCount).toBe(1);
  });

  test("serves a recent stale value when Saleor briefly fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T00:00:00Z"));
    const load = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("stale catalog")
      .mockRejectedValueOnce(new Error("Saleor unavailable"));

    await expect(
      readThroughCatalogCache({
        key: "catalog:stale",
        load,
        staleIfErrorMs: 300_000,
        ttlMs: 60_000,
      }),
    ).resolves.toBe("stale catalog");

    vi.advanceTimersByTime(61_000);
    await expect(
      readThroughCatalogCache({
        key: "catalog:stale",
        load,
        staleIfErrorMs: 300_000,
        ttlMs: 60_000,
      }),
    ).resolves.toBe("stale catalog");
    expect(load).toHaveBeenCalledTimes(2);

    await expect(
      readThroughCatalogCache({
        key: "catalog:stale",
        load,
        staleIfErrorMs: 300_000,
        ttlMs: 60_000,
      }),
    ).resolves.toBe("stale catalog");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
