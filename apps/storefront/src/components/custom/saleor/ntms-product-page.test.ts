import { describe, expect, test } from "vitest";
import type { NtmsSaleorProductVariant } from "@/lib/saleor/catalog";
import {
  filterSaleorProductVariants,
  getSaleorVariantBySku,
  shouldSearchSaleorProductVariants,
} from "./ntms-product-page";

const variants = Array.from({ length: 99 }, (_, index) => ({
  id: `variant-${index + 1}`,
  name: `Papa Cartridge ${index + 1}`,
  price: null,
  priorPrice: null,
  quantityAvailable: 50,
  attributes: [],
  sku: `C${String(index + 1).padStart(4, "0")}RL`,
})) satisfies NtmsSaleorProductVariant[];

describe("Saleor configurable product variants", () => {
  test("keeps every variant available when there is no search query", () => {
    const visibleVariants = filterSaleorProductVariants(variants, "");

    expect(visibleVariants).toHaveLength(99);
    expect(visibleVariants.at(-1)?.sku).toBe("C0099RL");
  });

  test("uses a searchable list only after the compact option limit", () => {
    expect(shouldSearchSaleorProductVariants(8)).toBe(false);
    expect(shouldSearchSaleorProductVariants(9)).toBe(true);
  });

  test("finds a variant by SKU or its customer-facing name", () => {
    expect(filterSaleorProductVariants(variants, "c0042rl")).toEqual([
      variants[41],
    ]);
    expect(filterSaleorProductVariants(variants, "cartridge 99")).toEqual([
      variants[98],
    ]);
  });

  test("resolves shared variant links from a case-insensitive SKU", () => {
    expect(getSaleorVariantBySku(variants, " c0042rl ")).toEqual(variants[41]);
    expect(getSaleorVariantBySku(variants, "missing")).toBeUndefined();
  });
});
