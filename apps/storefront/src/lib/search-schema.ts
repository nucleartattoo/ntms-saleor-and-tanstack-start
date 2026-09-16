import { z } from "zod";
import { defaultSort, sorting } from "./constants";

// Extract valid sort slugs from the sorting constants with proper type inference
type SortSlugs = (typeof sorting)[number]["slug"];
const validSortSlugs = sorting.map((item) => item.slug) as [SortSlugs];

// Base search schema for common search parameters
export const baseSearchSchema = z.object({
  after: z
    .string()
    .trim()
    .max(1024)
    .regex(/^[A-Za-z0-9+/=_-]+$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  q: z
    .string()
    .transform((value) => value.trim().slice(0, 200))
    .optional()
    .catch(""),
  sort: z
    .enum(validSortSlugs)
    .optional()
    .default(defaultSort.slug)
    .catch(defaultSort.slug),
});

// Known controls are validated above while custom facets remain URL-addressable.
export const searchSchema = baseSearchSchema.catchall(z.string().optional());

export type SearchParams = z.infer<typeof searchSchema>;

// Helper function to get facet value from search params
export function getFacetValue(
  search: SearchParams,
  facetCode: string,
): string[] {
  const value = search[facetCode];
  return value ? value.split(",") : [];
}

// Helper function to set facet value in search params
export function setFacetValue(
  search: SearchParams,
  facetCode: string,
  values: string[],
): SearchParams {
  const newSearch = { ...search };

  if (values.length > 0) {
    newSearch[facetCode] = values.join(",");
  } else {
    delete newSearch[facetCode];
  }

  return newSearch;
}
