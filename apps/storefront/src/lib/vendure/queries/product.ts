import { graphql } from "@/gql/graphql";
import productFragment from "../fragments/product";
import searchResultFragment from "../fragments/search-result";

export const getProductQuery = graphql(
  `
  query getProduct($slug: String!) {
    product(slug: $slug) {
      ...product
    }
  }
`,
  [productFragment],
);

export const getProductsQuery = graphql(
  `
    query getProducts($sortKey: SearchResultSortParameter, $query: String) {
        search(input: { take: 100, sort: $sortKey, term: $query, groupByProduct: true}) {
            items {
                ...searchResult
            }
            totalItems
        }
    }
`,
  [searchResultFragment],
);

// Product recommendations depend on a Vendure Shop API extension.
// Add a typed gql.tada query here when that field is available in the schema.
