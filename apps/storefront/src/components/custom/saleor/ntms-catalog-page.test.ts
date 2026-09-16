import { describe, expect, test } from "vitest";
import type { NtmsSaleorCatalogPreview } from "@/lib/saleor/catalog";
import { categoryPriority, getHomeCategories } from "./ntms-catalog-page";

type CatalogCategory = NtmsSaleorCatalogPreview["categories"][number];

function category(name: string, productCount = 1): CatalogCategory {
  return {
    id: name,
    imageAlt: name,
    imageUrl: "",
    name,
    productCount,
    slug: name.toLowerCase().replaceAll(" ", "-"),
  };
}

describe("NTMS homepage categories", () => {
  test("matches the Zoey top-level merchandising order", () => {
    expect(categoryPriority).toEqual([
      "Needles",
      "Inks",
      "Machines",
      "Tubes & Grips",
      "Power Supplies & Cords",
      "Medical",
      "Shop Supply",
      "Papa",
      "Sales",
    ]);
  });

  test("keeps every canonical category in its merchandising order", () => {
    const input = [...categoryPriority].reverse().map((name) => category(name));

    expect(getHomeCategories(input).map((item) => item.name)).toEqual(
      categoryPriority,
    );
    expect(getHomeCategories(input)).toHaveLength(9);
    expect(getHomeCategories(input).at(-1)?.name).toBe("Sales");
  });

  test("does not let legacy aggregate categories displace canonical entries", () => {
    const input = [
      category("Products", 1000),
      ...categoryPriority.map((name) => category(name)),
    ];

    expect(getHomeCategories(input).map((item) => item.name)).toEqual(
      categoryPriority,
    );
  });
});
