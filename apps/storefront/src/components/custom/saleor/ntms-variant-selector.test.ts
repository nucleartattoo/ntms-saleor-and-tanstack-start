import { describe, expect, test } from "vitest";
import type { NtmsSaleorProductVariant } from "@/lib/saleor/catalog";
import {
  getPreferredSaleorVariant,
  getSaleorColorSwatch,
  getSaleorVariantAttributeGroups,
  isSaleorColorAttribute,
  isSaleorVariantAttributeValueAvailable,
  resolveSaleorVariantAttributeSelection,
} from "./ntms-variant-selector";

function variant(
  id: string,
  type: string,
  gauge: string,
  size: string,
  quantityAvailable: number,
): NtmsSaleorProductVariant {
  return {
    id,
    name: id,
    sku: id,
    price: null,
    priorPrice: null,
    quantityAvailable,
    attributes: [
      {
        id: "size",
        name: "Size",
        slug: "size",
        values: [{ id: `size-${size}`, name: size }],
      },
      {
        id: "gauge",
        name: "Gauge",
        slug: "gauge",
        values: [{ id: `gauge-${gauge}`, name: gauge }],
      },
      {
        id: "type",
        name: "Type",
        slug: "type",
        values: [{ id: `type-${type}`, name: type }],
      },
    ],
  };
}

const variants = [
  variant("round-8-3", "Round Liner", "#8", "3", 12),
  variant("round-8-5", "Round Liner", "#8", "5", 0),
  variant("mag-10-3", "Magnum", "#10", "3", 8),
  variant("mag-10-5", "Magnum", "#10", "5", 8),
];

describe("Saleor variant attribute selector", () => {
  test("orders cartridge attributes as type, gauge, then size", () => {
    const groups = getSaleorVariantAttributeGroups(variants);

    expect(groups.map((group) => group.name)).toEqual([
      "Type",
      "Gauge",
      "Size",
    ]);
    expect(groups[0]?.values.map((value) => value.name)).toEqual([
      "Magnum",
      "Round Liner",
    ]);
  });

  test("selecting a type resolves a valid matching downstream combination", () => {
    const groups = getSaleorVariantAttributeGroups(variants);
    const selected = getPreferredSaleorVariant(variants);
    const typeGroupIndex = groups.findIndex((group) => group.name === "Type");
    const magnumValue = groups[typeGroupIndex]?.values.find(
      (value) => value.name === "Magnum",
    );

    expect(selected?.id).toBe("round-8-3");
    expect(magnumValue).toBeDefined();
    if (!selected || !magnumValue) {
      throw new Error("Expected an initial variant and a Magnum option");
    }

    const next = resolveSaleorVariantAttributeSelection(
      variants,
      groups,
      selected,
      typeGroupIndex,
      magnumValue.id,
    );

    expect(next.id).toBe("mag-10-3");
  });

  test("disables an incompatible downstream gauge", () => {
    const groups = getSaleorVariantAttributeGroups(variants);
    const selected = variants[2];
    const gaugeGroupIndex = groups.findIndex((group) => group.name === "Gauge");
    const roundGauge = groups[gaugeGroupIndex]?.values.find(
      (value) => value.name === "#8",
    );

    expect(roundGauge).toBeDefined();
    if (!selected || !roundGauge) {
      throw new Error("Expected a Magnum variant and the #8 gauge");
    }
    expect(
      isSaleorVariantAttributeValueAvailable(
        variants,
        groups,
        selected,
        gaugeGroupIndex,
        roundGauge.id,
      ),
    ).toBe(false);
  });

  test("omits legacy-only selector dimensions from unavailable variants", () => {
    const retiredVariant: NtmsSaleorProductVariant = {
      ...variant("retired-package", "Round Liner", "#8", "3", 0),
      attributes: [
        ...variant("retired-package", "Round Liner", "#8", "3", 0).attributes,
        {
          id: "package",
          name: "Package",
          slug: "package",
          values: [{ id: "package-case", name: "Case" }],
        },
      ],
    };

    const groups = getSaleorVariantAttributeGroups([
      variant("available", "Round Liner", "#8", "3", 12),
      retiredVariant,
    ]);

    expect(groups.map((group) => group.name)).not.toContain("Package");
  });

  test("recognizes color attributes and resolves common color swatches", () => {
    expect(isSaleorColorAttribute({ name: "Color", slug: "color" })).toBe(true);
    expect(isSaleorColorAttribute({ name: "Needle Type", slug: "type" })).toBe(
      false,
    );
    expect(getSaleorColorSwatch("Matte Black")).toBe("#171717");
    expect(getSaleorColorSwatch("Unspecified Finish")).toBeNull();
  });
});
