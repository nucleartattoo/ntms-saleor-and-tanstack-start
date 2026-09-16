import { graphql } from "@/gql/graphql";
import { collectionFragment } from "../queries/collection";
import assetFragment from "./image";

export const variantFragment = graphql(`
  fragment variant on ProductVariant {
    id
    name
    sku
    options {
      group {
        id
        name
        code
      }
      name
      code
      id
    }
    currencyCode
    priceWithTax
    price
    stockLevel
  }
`);

export const productOptionGroupFragment = graphql(`
  fragment product_option_group on ProductOptionGroup {
    id
    name
    code
    options {
      id
      name
      code
    }
  }
`);

const productFragment = graphql(
  `
    fragment product on Product {
      __typename
      id
      slug
      enabled
      name
      description
      collections {
        ...collection
      }
      optionGroups {
        ...product_option_group
      }
      variantList(options: { take: 100 }) {
        items {
          ...variant
        }
      }
      featuredAsset {
        ...image
      }
      assets {
        ...image
      }
      updatedAt
    }
`,
  [
    assetFragment,
    collectionFragment,
    variantFragment,
    productOptionGroupFragment,
  ],
);

export default productFragment;
