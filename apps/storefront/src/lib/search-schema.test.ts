import { describe, expect, test } from "vitest";
import { defaultSort } from "./constants";
import { baseSearchSchema, searchSchema } from "./search-schema";

describe("storefront search parameters", () => {
  test("uses the default sort when the URL omits it", () => {
    expect(baseSearchSchema.parse({}).sort).toBe(defaultSort.slug);
  });

  test("falls back instead of rendering an error for an invalid sort", () => {
    expect(baseSearchSchema.parse({ sort: "featured" }).sort).toBe(
      defaultSort.slug,
    );
  });

  test("trims and bounds public search queries", () => {
    expect(baseSearchSchema.parse({ q: "  tattoo ink  " }).q).toBe(
      "tattoo ink",
    );
    expect(baseSearchSchema.parse({ q: "x".repeat(500) }).q).toHaveLength(200);
  });

  test("keeps TanStack Router search validation synchronous", () => {
    const result = searchSchema["~standard"].validate({
      brand: "eternal-ink",
      page: "2",
      sort: "featured",
    });

    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toMatchObject({
      value: {
        brand: "eternal-ink",
        page: 2,
        sort: defaultSort.slug,
      },
    });
  });
});
