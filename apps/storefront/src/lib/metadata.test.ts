import { describe, expect, test } from "vitest";
import {
  createBasicMeta,
  createEcommerceMeta,
  createPageTitle,
  createStructuredData,
  getBaseUrl,
  getCanonicalUrl,
  getPublicRobotsDirective,
  getSearchRobotsDirective,
  normalizeMetaDescription,
} from "./metadata";

describe("storefront metadata", () => {
  test("builds canonical URLs without query strings or fragments", () => {
    expect(
      getCanonicalUrl("product/papa-cartridges?variant=C0807M1-1#details"),
    ).toBe(`${getBaseUrl()}/product/papa-cartridges`);
  });

  test("keeps staging public pages and all search pages out of the index", () => {
    expect(getPublicRobotsDirective(false)).toBe("noindex, nofollow");
    expect(getSearchRobotsDirective(false)).toBe("noindex, nofollow");
    expect(getSearchRobotsDirective(true)).toBe("noindex, follow");

    expect(
      createBasicMeta("Search", "Search the catalog", false, "noindex, follow"),
    ).toContainEqual({ name: "robots", content: "noindex, follow" });
    expect(
      createEcommerceMeta("Needles", "Browse needles", undefined, [
        { name: "robots", content: "noindex, nofollow" },
      ]),
    ).toContainEqual({ name: "robots", content: "noindex, nofollow" });
  });

  test("emits page-specific social metadata for ecommerce pages", () => {
    const metadata = createEcommerceMeta(
      "Tattoo Needles",
      "Browse professional tattoo needles.",
      "https://cdn.example.test/needles.webp",
      [
        {
          property: "og:url",
          content: `${getBaseUrl()}/collections/needles`,
        },
      ],
    );

    expect(metadata).toContainEqual({
      name: "twitter:title",
      content: createPageTitle("Tattoo Needles"),
    });
    expect(metadata).toContainEqual({
      name: "twitter:description",
      content: "Browse professional tattoo needles.",
    });
    expect(metadata).toContainEqual({
      property: "og:url",
      content: `${getBaseUrl()}/collections/needles`,
    });
  });

  test("keeps metadata descriptions concise and readable", () => {
    const description = Array.from(
      { length: 30 },
      () => "professional tattoo supply",
    ).join(" ");
    const normalized = normalizeMetaDescription(description);

    expect(normalized.length).toBeLessThanOrEqual(160);
    expect(normalized.endsWith("...")).toBe(true);
    expect(createEcommerceMeta("Long product", description)).toContainEqual({
      name: "description",
      content: normalized,
    });
  });

  test("emits a Saleor Product aggregate offer from real variant prices", () => {
    const structuredData = createStructuredData.saleorProduct({
      name: "Papa Cartridges",
      slug: "ntms-8256-papa-cartridges",
      description: "Sterile tattoo needle cartridges.",
      imageUrl: "https://cdn.example.test/papa.webp",
      sku: "C0807M1-1",
      price: { amount: 22, currency: "USD" },
      quantityAvailable: 50,
      variants: [
        {
          sku: "C0807M1-1",
          price: { amount: 22, currency: "USD" },
          quantityAvailable: 50,
        },
        {
          sku: "C1209RL-1",
          price: { amount: 29, currency: "USD" },
          quantityAvailable: 0,
        },
      ],
    });

    expect(structuredData).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Papa Cartridges",
      sku: "C0807M1-1",
      image: "https://cdn.example.test/papa.webp",
      url: `${getBaseUrl()}/product/ntms-8256-papa-cartridges`,
      offers: {
        "@type": "AggregateOffer",
        availability: "https://schema.org/InStock",
        lowPrice: 22,
        highPrice: 29,
        offerCount: 2,
        priceCurrency: "USD",
      },
    });
  });
});
