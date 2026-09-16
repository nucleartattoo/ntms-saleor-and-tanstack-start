import { graphql } from "@/gql/graphql";
import {
  orderAddressFragment,
  orderCustomerFragment,
  orderDiscountFragment,
  orderPaymentFragment,
  orderShippingLineFragment,
} from "./active-order";
import productFragment from "./product";

export const orderFragment = graphql(
  `
  fragment Order on Order {
    id
    code
    state
    active
    createdAt
    updatedAt
    currencyCode
    couponCodes
    total
    totalWithTax
    subTotal
    subTotalWithTax
    shipping
    shippingWithTax
    totalQuantity
    discounts {
      ...OrderDiscount
    }
    lines {
      id
      quantity
      linePrice
      linePriceWithTax
      unitPrice
      unitPriceWithTax
      featuredAsset {
        id
        preview
      }
      productVariant {
        id
        name
        sku
        options {
          code
          name
          group {
            code
            name
          }
        }
        product {
          ...product
        }
      }
    }
    billingAddress {
      ...OrderAddress
    }
    shippingAddress {
      ...OrderAddress
    }
    customer {
      ...OrderCustomer
    }
    shippingLines {
      ...OrderShippingLine
    }
    payments {
      ...OrderPayment
    }
  }
`,
  [
    productFragment,
    orderAddressFragment,
    orderCustomerFragment,
    orderDiscountFragment,
    orderPaymentFragment,
    orderShippingLineFragment,
  ],
);

export default orderFragment;
