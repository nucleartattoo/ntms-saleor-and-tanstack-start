import { graphql } from "@/gql/graphql";

const searchResultFragment = graphql(`
  fragment searchResult on SearchResult {
    sku
    slug
    currencyCode
    inStock
    productVariantId
    productName
    productVariantName
    description
    productAsset {
      id
      preview
    }
    productVariantAsset {
      id
      preview
    }
    priceWithTax {
      __typename
      ... on SinglePrice {
        value
      }
      ... on PriceRange {
        min
        max
      }
    }
  }
`);

export default searchResultFragment;
