import { describe, expect, test } from "vitest";
import { categoryPriority, getHomeCategories } from "./ntms-catalog-page";
import { getNtmsSaleorNavigationCategories } from "./ntms-shell";

describe("NTMS Saleor navigation categories", () => {
  test("uses the approved Zoey order and Saleor category names", () => {
    const navigation = getNtmsSaleorNavigationCategories([
      { name: "Products", slug: "ntms-81-products" },
      { name: "Sales", slug: "ntms-452-sales" },
      { name: "Medical", slug: "ntms-89-medical" },
      { name: "Papa", slug: "ntms-117-papa" },
      { name: "Inks", slug: "ntms-91-inks" },
      { name: "Needles", slug: "ntms-289-needles" },
      { name: "Machines", slug: "ntms-103-machines" },
      { name: "Tubes & Grips", slug: "ntms-107-tubes-and-grips" },
      {
        name: "Power Supplies & Cords",
        slug: "ntms-85-power-supplies-and-cords",
      },
      { name: "Shop Supply", slug: "ntms-113-shop-supply" },
    ]);

    expect(navigation).toEqual([
      { label: "Needles", slug: "ntms-289-needles" },
      { label: "Inks", slug: "ntms-91-inks" },
      { label: "Machines", slug: "ntms-103-machines" },
      { label: "Tubes & Grips", slug: "ntms-107-tubes-and-grips" },
      {
        label: "Power Supplies & Cords",
        slug: "ntms-85-power-supplies-and-cords",
      },
      { label: "Medical", slug: "ntms-89-medical" },
      { label: "Shop Supply", slug: "ntms-113-shop-supply" },
      { label: "Papa", slug: "ntms-117-papa" },
      { label: "Sales", slug: "ntms-452-sales" },
    ]);
  });

  test("retains the approved navigation when Saleor is temporarily unavailable", () => {
    expect(getNtmsSaleorNavigationCategories([])).toHaveLength(9);
    expect(
      getNtmsSaleorNavigationCategories([]).some(
        (item) => item.label === "All supplies",
      ),
    ).toBe(false);
  });
});

describe("getHomeCategories", () => {
  test("keeps the homepage category order aligned with the primary navigation", () => {
    const categories = getHomeCategories(
      [...categoryPriority].reverse().map((name, index) => ({
        id: `${index}`,
        imageAlt: "",
        imageUrl: "",
        name,
        productCount: 10,
        slug: name.toLowerCase(),
      })),
    );

    expect(categories.map((category) => category.name)).toEqual(
      categoryPriority,
    );
  });
});
