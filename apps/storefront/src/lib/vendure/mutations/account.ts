import { graphql } from "@/gql/graphql";
import {
  activeCustomerFragment,
  customerAddressFragment,
} from "../queries/active-customer";

export const createCustomerAddressMutation = graphql(
  `
  mutation createCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      ...customer_address
    }
  }
`,
  [customerAddressFragment],
);

export const updateCustomerAddressMutation = graphql(
  `
  mutation updateCustomerAddress($input: UpdateAddressInput!) {
    updateCustomerAddress(input: $input) {
      ...customer_address
    }
  }
`,
  [customerAddressFragment],
);

export const deleteCustomerAddressMutation = graphql(`
  mutation deleteCustomerAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`);

export const updateCustomerPasswordMutation = graphql(`
  mutation updateCustomerPassword($currentPassword: String!, $newPassword: String!) {
    updateCustomerPassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const requestPasswordResetMutation = graphql(`
  mutation requestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const resetPasswordMutation = graphql(`
  mutation resetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      __typename
      ... on CurrentUser {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const requestUpdateCustomerEmailAddressMutation = graphql(`
  mutation requestUpdateCustomerEmailAddress(
    $newEmailAddress: String!
    $password: String!
  ) {
    requestUpdateCustomerEmailAddress(
      newEmailAddress: $newEmailAddress
      password: $password
    ) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const updateCustomerEmailAddressMutation = graphql(`
  mutation updateCustomerEmailAddress($token: String!) {
    updateCustomerEmailAddress(token: $token) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const refreshCustomerVerificationMutation = graphql(`
  mutation refreshCustomerVerification($emailAddress: String!) {
    refreshCustomerVerification(emailAddress: $emailAddress) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const updateAccountCustomerMutation = graphql(
  `
  mutation updateAccountCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ...active_customer
    }
  }
`,
  [activeCustomerFragment],
);
