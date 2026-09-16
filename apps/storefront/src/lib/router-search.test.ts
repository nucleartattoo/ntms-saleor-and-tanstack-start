import { describe, expect, test } from "vitest";
import { parseSearch, stringifySearch } from "@/lib/router-search";

describe("router-search", () => {
  test("parses repeated query parameters into arrays", () => {
    expect(parseSearch("?category=10&category=12&sort=price-asc")).toEqual({
      category: ["10", "12"],
      sort: "price-asc",
    });
  });

  test("stringifies arrays and omits nullish values", () => {
    expect(
      stringifySearch({
        category: ["10", "12"],
        sort: "price-asc",
        q: "",
        empty: undefined,
        missing: null,
      }),
    ).toBe("?category=10&category=12&sort=price-asc&q=");
  });

  test("round-trips repeated parameters", () => {
    const search = {
      category: ["10", "12"],
      brand: "ambition",
      sort: "name-a-z",
    };

    expect(parseSearch(stringifySearch(search))).toEqual(search);
  });
});
