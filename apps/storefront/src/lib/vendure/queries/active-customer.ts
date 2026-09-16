import { graphql } from "@/gql/graphql";

export const customerAddressFragment = graphql(`
  fragment customer_address on Address {
    id
    fullName
    company
    streetLine1
    streetLine2
    city
    province
    postalCode
    phoneNumber
    defaultShippingAddress
    defaultBillingAddress
    country {
      code
      name
    }
  }
`);

export const activeCustomerFragment = graphql(
  `
  fragment active_customer on Customer {
    id
    title
    firstName
    lastName
    phoneNumber
    emailAddress
    addresses {
      ...customer_address
    }
  }
`,
  [customerAddressFragment],
);

export const getActiveCustomerQuery = graphql(
  `
  query getActiveCustomer {
    activeCustomer {
      ...active_customer
    }
  }
`,
  [activeCustomerFragment],
);
