import { getBaseUrl } from "@/lib/metadata";
import { getSaleorChannel, saleorFetch } from "@/lib/saleor";
import type {
  AccountAddress,
  AccountAddressInput,
  AccountCountryOption,
  AccountCustomer,
  AccountInvoice,
  AccountOrder,
  AccountOrderAddress,
  AccountOrderHistory,
  AccountOrderLine,
} from "../account-types";

export type SaleorAccountError = {
  field?: string | null;
  message?: string | null;
  code?: string | null;
  addressType?: string | null;
};

type SaleorAccountUserNode = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isConfirmed: boolean;
  checkoutIds?: string[] | null;
};

type SaleorCountryDisplay = {
  code: string;
  country: string;
};

type SaleorAddressNode = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  cityArea: string;
  postalCode: string;
  country: SaleorCountryDisplay;
  countryArea: string;
  phone?: string | null;
  isDefaultShippingAddress?: boolean | null;
  isDefaultBillingAddress?: boolean | null;
};

type SaleorAddressInput = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  streetAddress1: string;
  streetAddress2?: string;
  city?: string;
  postalCode?: string;
  country: string;
  countryArea?: string;
  phone?: string;
};

type SaleorMoneyNode = {
  amount: number;
  currency: string;
};

type SaleorTaxedMoneyNode = {
  gross: SaleorMoneyNode;
};

type SaleorOrderLineNode = {
  id: string;
  productName: string;
  variantName: string;
  productSku?: string | null;
  productVariantId?: string | null;
  quantity: number;
  thumbnail?: {
    url: string;
    alt?: string | null;
  } | null;
  unitPrice: SaleorTaxedMoneyNode;
  totalPrice: SaleorTaxedMoneyNode;
  variant?: {
    product?: {
      slug?: string | null;
    } | null;
  } | null;
};

type SaleorInvoiceNode = {
  id: string;
  number?: string | null;
  status?: string | null;
  url?: string | null;
  createdAt?: string | null;
};

type SaleorOrderNode = {
  id: string;
  number: string;
  created: string;
  updatedAt: string;
  status: string;
  statusDisplay: string;
  isPaid: boolean;
  paymentStatusDisplay: string;
  shippingMethodName?: string | null;
  subtotal: SaleorTaxedMoneyNode;
  shippingPrice: SaleorTaxedMoneyNode;
  total: SaleorTaxedMoneyNode;
  undiscountedTotal: SaleorTaxedMoneyNode;
  lines: SaleorOrderLineNode[];
  invoices?: SaleorInvoiceNode[];
  shippingAddress?: SaleorAddressNode | null;
  billingAddress?: SaleorAddressNode | null;
};

type SaleorAccountCustomerNode = SaleorAccountUserNode & {
  addresses: SaleorAddressNode[];
  defaultShippingAddress?: SaleorAddressNode | null;
  defaultBillingAddress?: SaleorAddressNode | null;
};

type SaleorAccountErrorsPayload = {
  errors: SaleorAccountError[];
};

type TokenCreateResponse = {
  tokenCreate: SaleorAccountErrorsPayload & {
    token?: string | null;
    refreshToken?: string | null;
    csrfToken?: string | null;
    user?: SaleorAccountUserNode | null;
  };
};

type AccountRegisterResponse = {
  accountRegister: SaleorAccountErrorsPayload & {
    requiresConfirmation?: boolean | null;
  };
};

type CurrentUserResponse = {
  me?: SaleorAccountUserNode | null;
};

type AccountCustomerResponse = {
  me?: SaleorAccountCustomerNode | null;
};

type AccountOrdersResponse = {
  me?: {
    orders?: {
      totalCount?: number | null;
      edges?: {
        node: SaleorOrderNode;
      }[];
    } | null;
  } | null;
};

type ShopCountriesResponse = {
  shop: {
    countries: SaleorCountryDisplay[];
  };
};

type AccountUpdateResponse = {
  accountUpdate: SaleorAccountErrorsPayload & {
    user?: SaleorAccountCustomerNode | null;
  };
};

type RequestPasswordResetResponse = {
  requestPasswordReset: SaleorAccountErrorsPayload;
};

type SetPasswordResponse = {
  setPassword: SaleorAccountErrorsPayload & {
    token?: string | null;
    refreshToken?: string | null;
    csrfToken?: string | null;
    user?: SaleorAccountUserNode | null;
  };
};

type ConfirmAccountResponse = {
  confirmAccount: SaleorAccountErrorsPayload & {
    user?: SaleorAccountUserNode | null;
  };
};

type PasswordChangeResponse = {
  passwordChange: SaleorAccountErrorsPayload & {
    user?: SaleorAccountUserNode | null;
  };
};

type RequestEmailChangeResponse = {
  requestEmailChange: SaleorAccountErrorsPayload & {
    user?: SaleorAccountUserNode | null;
  };
};

type ConfirmEmailChangeResponse = {
  confirmEmailChange: SaleorAccountErrorsPayload & {
    user?: SaleorAccountUserNode | null;
  };
};

type AccountAddressPayload = SaleorAccountErrorsPayload & {
  address?: SaleorAddressNode | null;
  user?: SaleorAccountCustomerNode | null;
};

type AccountAddressCreateResponse = {
  accountAddressCreate: AccountAddressPayload;
};

type AccountAddressUpdateResponse = {
  accountAddressUpdate: AccountAddressPayload;
};

type AccountAddressDeleteResponse = {
  accountAddressDelete: AccountAddressPayload;
};

type AccountSetDefaultAddressResponse = {
  accountSetDefaultAddress: SaleorAccountErrorsPayload & {
    user?: SaleorAccountCustomerNode | null;
  };
};

export type NtmsSaleorMetadataInput = {
  key: string;
  value: string;
};

export type NtmsSaleorAccountRegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  redirectUrl?: string;
  metadata?: NtmsSaleorMetadataInput[];
  channel?: string;
};

export type SaleorAccountRegisterInput = NtmsSaleorAccountRegisterInput & {
  firstName: string;
  lastName: string;
};

export type NtmsSaleorTokenCreateInput = {
  email: string;
  password: string;
  audience?: string;
};

export type NtmsSaleorRequestPasswordResetInput = {
  email: string;
  redirectUrl: string;
  channel?: string;
};

export type NtmsSaleorSetPasswordInput = {
  email: string;
  password: string;
  token: string;
};

export type NtmsSaleorConfirmAccountInput = {
  email: string;
  token: string;
};

export type NtmsSaleorAccountUpdateInput = {
  firstName: string;
  lastName: string;
};

export type NtmsSaleorPasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};

export type NtmsSaleorRequestEmailChangeInput = {
  newEmailAddress: string;
  password: string;
  redirectUrl?: string;
  channel?: string;
};

export type NtmsSaleorAddressType = "SHIPPING" | "BILLING";

export type NtmsSaleorAccountError = {
  field: string | null;
  code: string;
  message: string;
  addressType: string | null;
};

export type NtmsSaleorAccountMutationResult = {
  ok: boolean;
  errors: NtmsSaleorAccountError[];
};

export type NtmsSaleorAccountRegisterResult =
  NtmsSaleorAccountMutationResult & {
    requiresConfirmation: boolean;
  };

export type NtmsSaleorCurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isConfirmed: boolean;
  checkoutIds: string[];
};

export type SaleorAccountUser = NtmsSaleorCurrentUser;

export type NtmsSaleorAuthResult = NtmsSaleorAccountMutationResult & {
  token: string | null;
  refreshToken: string | null;
  csrfToken: string | null;
  user: NtmsSaleorCurrentUser | null;
};

export type NtmsSaleorConfirmAccountResult = NtmsSaleorAccountMutationResult & {
  user: NtmsSaleorCurrentUser | null;
};

export type SaleorAuthSession = {
  token: string;
  refreshToken?: string | null;
  csrfToken?: string | null;
  user: SaleorAccountUser;
};

const accountErrorFields = `
  errors {
    field
    message
    code
    addressType
  }
`;

const saleorAccountUserFields = `
  id
  email
  firstName
  lastName
  isActive
  isConfirmed
  checkoutIds
`;

const saleorAccountAddressFields = `
  id
  firstName
  lastName
  companyName
  streetAddress1
  streetAddress2
  city
  cityArea
  postalCode
  country {
    code
    country
  }
  countryArea
  phone
  isDefaultShippingAddress
  isDefaultBillingAddress
`;

const saleorAccountCustomerFields = `
  ${saleorAccountUserFields}
  addresses {
    ${saleorAccountAddressFields}
  }
  defaultShippingAddress {
    id
  }
  defaultBillingAddress {
    id
  }
`;

const saleorOrderFields = `
  id
  number
  created
  updatedAt
  status
  statusDisplay
  isPaid
  paymentStatusDisplay
  shippingMethodName
  subtotal {
    gross {
      amount
      currency
    }
  }
  shippingPrice {
    gross {
      amount
      currency
    }
  }
  total {
    gross {
      amount
      currency
    }
  }
  undiscountedTotal {
    gross {
      amount
      currency
    }
  }
  lines {
    id
    productName
    variantName
    productSku
    productVariantId
    quantity
    thumbnail {
      url
      alt
    }
    unitPrice {
      gross {
        amount
        currency
      }
    }
    totalPrice {
      gross {
        amount
        currency
      }
    }
    variant {
      product {
        slug
      }
    }
  }
  invoices {
    id
    number
    status
    url
    createdAt
  }
  shippingAddress {
    ${saleorAccountAddressFields}
  }
  billingAddress {
    ${saleorAccountAddressFields}
  }
`;

const tokenCreateMutation = `
  mutation NtmsSaleorTokenCreate(
    $email: String!
    $password: String!
    $audience: String
  ) {
    tokenCreate(email: $email, password: $password, audience: $audience) {
      token
      refreshToken
      csrfToken
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const accountRegisterMutation = `
  mutation NtmsSaleorAccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
      requiresConfirmation
      ${accountErrorFields}
    }
  }
`;

const currentUserQuery = `
  query NtmsSaleorCurrentUser {
    me {
      ${saleorAccountUserFields}
    }
  }
`;

const accountCustomerQuery = `
  query NtmsSaleorAccountCustomer {
    me {
      ${saleorAccountCustomerFields}
    }
  }
`;

const accountOrdersQuery = `
  query NtmsSaleorAccountOrders($first: Int!, $where: CustomerOrderWhereInput) {
    me {
      orders(first: $first, where: $where) {
        totalCount
        edges {
          node {
            ${saleorOrderFields}
          }
        }
      }
    }
  }
`;

const shopCountriesQuery = `
  query NtmsSaleorShopCountries {
    shop {
      countries {
        code
        country
      }
    }
  }
`;

const accountUpdateMutation = `
  mutation NtmsSaleorAccountUpdate($input: AccountInput!) {
    accountUpdate(input: $input) {
      user {
        ${saleorAccountCustomerFields}
      }
      ${accountErrorFields}
    }
  }
`;

const requestPasswordResetMutation = `
  mutation NtmsSaleorRequestPasswordReset(
    $channel: String
    $email: String!
    $redirectUrl: String!
  ) {
    requestPasswordReset(
      channel: $channel
      email: $email
      redirectUrl: $redirectUrl
    ) {
      ${accountErrorFields}
    }
  }
`;

const setPasswordMutation = `
  mutation NtmsSaleorSetPassword(
    $email: String!
    $password: String!
    $token: String!
  ) {
    setPassword(email: $email, password: $password, token: $token) {
      token
      refreshToken
      csrfToken
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const confirmAccountMutation = `
  mutation NtmsSaleorConfirmAccount($email: String!, $token: String!) {
    confirmAccount(email: $email, token: $token) {
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const passwordChangeMutation = `
  mutation NtmsSaleorPasswordChange(
    $newPassword: String!
    $oldPassword: String
  ) {
    passwordChange(newPassword: $newPassword, oldPassword: $oldPassword) {
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const requestEmailChangeMutation = `
  mutation NtmsSaleorRequestEmailChange(
    $channel: String
    $newEmail: String!
    $password: String!
    $redirectUrl: String!
  ) {
    requestEmailChange(
      channel: $channel
      newEmail: $newEmail
      password: $password
      redirectUrl: $redirectUrl
    ) {
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const confirmEmailChangeMutation = `
  mutation NtmsSaleorConfirmEmailChange($channel: String, $token: String!) {
    confirmEmailChange(channel: $channel, token: $token) {
      user {
        ${saleorAccountUserFields}
      }
      ${accountErrorFields}
    }
  }
`;

const accountAddressCreateMutation = `
  mutation NtmsSaleorAccountAddressCreate(
    $input: AddressInput!
    $type: AddressTypeEnum
  ) {
    accountAddressCreate(input: $input, type: $type) {
      address {
        ${saleorAccountAddressFields}
      }
      user {
        ${saleorAccountCustomerFields}
      }
      ${accountErrorFields}
    }
  }
`;

const accountAddressUpdateMutation = `
  mutation NtmsSaleorAccountAddressUpdate($id: ID!, $input: AddressInput!) {
    accountAddressUpdate(id: $id, input: $input) {
      address {
        ${saleorAccountAddressFields}
      }
      user {
        ${saleorAccountCustomerFields}
      }
      ${accountErrorFields}
    }
  }
`;

const accountAddressDeleteMutation = `
  mutation NtmsSaleorAccountAddressDelete($id: ID!) {
    accountAddressDelete(id: $id) {
      address {
        ${saleorAccountAddressFields}
      }
      ${accountErrorFields}
    }
  }
`;

const accountSetDefaultAddressMutation = `
  mutation NtmsSaleorAccountSetDefaultAddress(
    $id: ID!
    $type: AddressTypeEnum!
  ) {
    accountSetDefaultAddress(id: $id, type: $type) {
      user {
        ${saleorAccountCustomerFields}
      }
      ${accountErrorFields}
    }
  }
`;

export class SaleorAccountMutationError extends Error {
  errors: NtmsSaleorAccountError[];

  constructor(
    errors: readonly SaleorAccountError[] | null | undefined,
    fallback: string,
  ) {
    const normalizedErrors = normalizeSaleorAccountErrors(errors);

    super(formatNormalizedSaleorAccountErrors(normalizedErrors, fallback));
    this.name = "SaleorAccountMutationError";
    this.errors = normalizedErrors;
  }
}

export function normalizeSaleorAccountErrors(
  errors: readonly SaleorAccountError[] | null | undefined,
): NtmsSaleorAccountError[] {
  return (errors ?? []).map((error) => {
    const code = normalizeString(error.code) ?? "UNKNOWN";

    return {
      field: normalizeString(error.field),
      code,
      message:
        normalizeString(error.message) ?? fallbackAccountErrorMessage(code),
      addressType: normalizeString(error.addressType),
    };
  });
}

export function formatSaleorAccountErrors(
  errors: readonly SaleorAccountError[] | null | undefined,
  fallback: string,
) {
  return formatNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(errors),
    fallback,
  );
}

export async function accountRegister(
  input: NtmsSaleorAccountRegisterInput,
): Promise<NtmsSaleorAccountRegisterResult> {
  const data = await saleorFetch<
    AccountRegisterResponse,
    { input: NtmsSaleorAccountRegisterInput }
  >({
    query: accountRegisterMutation,
    variables: {
      input: {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        languageCode: input.languageCode,
        redirectUrl: input.redirectUrl,
        channel: input.channel ?? getSaleorChannel(),
      },
    },
  });
  const errors = normalizeSaleorAccountErrors(data.accountRegister.errors);

  return {
    ok: errors.length === 0,
    requiresConfirmation: data.accountRegister.requiresConfirmation ?? false,
    errors,
  };
}

export async function tokenCreate({
  audience,
  email,
  password,
}: NtmsSaleorTokenCreateInput): Promise<NtmsSaleorAuthResult> {
  const data = await saleorFetch<
    TokenCreateResponse,
    { audience?: string; email: string; password: string }
  >({
    query: tokenCreateMutation,
    variables: {
      audience,
      email,
      password,
    },
  });

  return authResultFromPayload(data.tokenCreate);
}

export const accountLogin = tokenCreate;

export async function getSaleorCurrentUser(
  input?:
    | string
    | {
        accessToken?: string | null;
      }
    | null,
): Promise<NtmsSaleorCurrentUser | null> {
  const authToken =
    typeof input === "string"
      ? normalizeString(input)
      : normalizeString(input?.accessToken);

  if (!authToken) {
    return null;
  }

  const data = await saleorFetch<CurrentUserResponse>({
    authToken,
    query: currentUserQuery,
  });

  return currentUserFromNode(data.me);
}

export async function requestPasswordReset(
  input: NtmsSaleorRequestPasswordResetInput,
): Promise<NtmsSaleorAccountMutationResult> {
  const data = await saleorFetch<
    RequestPasswordResetResponse,
    { channel: string; email: string; redirectUrl: string }
  >({
    query: requestPasswordResetMutation,
    variables: {
      channel: input.channel ?? getSaleorChannel(),
      email: input.email,
      redirectUrl: input.redirectUrl,
    },
  });
  const errors = normalizeSaleorAccountErrors(data.requestPasswordReset.errors);

  return {
    ok: errors.length === 0,
    errors,
  };
}

export async function setPassword(
  input: NtmsSaleorSetPasswordInput,
): Promise<NtmsSaleorAuthResult> {
  const data = await saleorFetch<
    SetPasswordResponse,
    { email: string; password: string; token: string }
  >({
    query: setPasswordMutation,
    variables: input,
  });

  return authResultFromPayload(data.setPassword);
}

// Saleor's schema names this mutation setPassword; keep a reset-oriented alias
// for storefront call sites that use password-reset terminology.
export const resetPassword = setPassword;

export async function confirmAccount(
  input: NtmsSaleorConfirmAccountInput,
): Promise<NtmsSaleorConfirmAccountResult> {
  const data = await saleorFetch<
    ConfirmAccountResponse,
    { email: string; token: string }
  >({
    query: confirmAccountMutation,
    variables: input,
  });
  const errors = normalizeSaleorAccountErrors(data.confirmAccount.errors);

  return {
    ok: errors.length === 0,
    user: currentUserFromNode(data.confirmAccount.user),
    errors,
  };
}

export async function getSaleorAccountCustomer(
  authToken: string | null | undefined,
): Promise<AccountCustomer | null> {
  const token = normalizeString(authToken);

  if (!token) {
    return null;
  }

  const data = await saleorFetch<AccountCustomerResponse>({
    authToken: token,
    query: accountCustomerQuery,
  });

  return accountCustomerFromNode(data.me);
}

export async function getSaleorAccountOrders({
  authToken,
  first = 30,
  ids,
}: {
  authToken: string | null | undefined;
  first?: number;
  ids?: string[];
}): Promise<AccountOrderHistory> {
  const token = normalizeString(authToken);

  if (!token) {
    return { items: [], totalItems: 0 };
  }

  const data = await saleorFetch<
    AccountOrdersResponse,
    {
      first: number;
      where?: {
        ids?: string[];
      };
    }
  >({
    authToken: token,
    query: accountOrdersQuery,
    variables: {
      first,
      where: ids?.length ? { ids } : undefined,
    },
  });
  const edges = data.me?.orders?.edges ?? [];
  const items = edges.map((edge) => accountOrderFromNode(edge.node));

  return {
    items,
    totalItems: data.me?.orders?.totalCount ?? items.length,
  };
}

export async function getSaleorAccountOrder({
  authToken,
  code,
}: {
  authToken: string | null | undefined;
  code: string;
}): Promise<AccountOrder | null> {
  const orders = await getSaleorAccountOrders({ authToken, first: 50 });

  return (
    orders.items.find((order) => order.id === code || order.code === code) ??
    null
  );
}

export async function getSaleorAvailableCountries(): Promise<
  AccountCountryOption[]
> {
  const data = await saleorFetch<ShopCountriesResponse>({
    query: shopCountriesQuery,
  });

  return data.shop.countries.map((country) => ({
    id: country.code,
    code: country.code,
    name: country.country,
  }));
}

export async function updateSaleorAccount(
  authToken: string,
  input: NtmsSaleorAccountUpdateInput,
): Promise<AccountCustomer> {
  const data = await saleorFetch<
    AccountUpdateResponse,
    {
      input: NtmsSaleorAccountUpdateInput;
    }
  >({
    authToken,
    query: accountUpdateMutation,
    variables: { input },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.accountUpdate.errors),
    "Error updating profile",
  );

  const customer = accountCustomerFromNode(data.accountUpdate.user);

  if (!customer) {
    throw new Error("Saleor did not return the updated customer");
  }

  return customer;
}

export async function changeSaleorPassword(
  authToken: string,
  input: NtmsSaleorPasswordChangeInput,
) {
  const data = await saleorFetch<
    PasswordChangeResponse,
    { newPassword: string; oldPassword: string }
  >({
    authToken,
    query: passwordChangeMutation,
    variables: {
      newPassword: input.newPassword,
      oldPassword: input.currentPassword,
    },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.passwordChange.errors),
    "Error updating password",
  );

  return { success: true };
}

export async function requestSaleorEmailChange(
  authToken: string,
  input: NtmsSaleorRequestEmailChangeInput,
) {
  const data = await saleorFetch<
    RequestEmailChangeResponse,
    {
      channel: string;
      newEmail: string;
      password: string;
      redirectUrl: string;
    }
  >({
    authToken,
    query: requestEmailChangeMutation,
    variables: {
      channel: input.channel ?? getSaleorChannel(),
      newEmail: input.newEmailAddress,
      password: input.password,
      redirectUrl:
        input.redirectUrl ?? getDefaultAccountRedirectUrl("/update-email"),
    },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.requestEmailChange.errors),
    "Error requesting email address change",
  );

  return { success: true };
}

export async function confirmSaleorEmailChange(
  authToken: string,
  token: string,
) {
  const data = await saleorFetch<
    ConfirmEmailChangeResponse,
    { channel: string; token: string }
  >({
    authToken,
    query: confirmEmailChangeMutation,
    variables: {
      channel: getSaleorChannel(),
      token,
    },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.confirmEmailChange.errors),
    "Error updating email address",
  );

  return currentUserFromNode(data.confirmEmailChange.user);
}

export async function createSaleorAccountAddress({
  authToken,
  input,
  type,
}: {
  authToken: string;
  input: AccountAddressInput;
  type?: NtmsSaleorAddressType;
}): Promise<AccountAddress> {
  const data = await saleorFetch<
    AccountAddressCreateResponse,
    {
      input: SaleorAddressInput;
      type?: NtmsSaleorAddressType;
    }
  >({
    authToken,
    query: accountAddressCreateMutation,
    variables: {
      input: accountAddressInputToSaleorInput(input),
      type,
    },
  });

  return requireAccountAddressPayload(
    data.accountAddressCreate,
    "Error creating address",
  );
}

export async function updateSaleorAccountAddress({
  authToken,
  id,
  input,
}: {
  authToken: string;
  id: string;
  input: AccountAddressInput;
}): Promise<AccountAddress> {
  const data = await saleorFetch<
    AccountAddressUpdateResponse,
    {
      id: string;
      input: SaleorAddressInput;
    }
  >({
    authToken,
    query: accountAddressUpdateMutation,
    variables: {
      id,
      input: accountAddressInputToSaleorInput(input),
    },
  });

  return requireAccountAddressPayload(
    data.accountAddressUpdate,
    "Error updating address",
  );
}

export async function deleteSaleorAccountAddress(
  authToken: string,
  id: string,
) {
  const data = await saleorFetch<AccountAddressDeleteResponse, { id: string }>({
    authToken,
    query: accountAddressDeleteMutation,
    variables: { id },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.accountAddressDelete.errors),
    "Error deleting address",
  );

  return { success: true };
}

export async function setSaleorDefaultAddress({
  authToken,
  id,
  type,
}: {
  authToken: string;
  id: string;
  type: NtmsSaleorAddressType;
}) {
  const data = await saleorFetch<
    AccountSetDefaultAddressResponse,
    { id: string; type: NtmsSaleorAddressType }
  >({
    authToken,
    query: accountSetDefaultAddressMutation,
    variables: { id, type },
  });

  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(data.accountSetDefaultAddress.errors),
    "Error setting default address",
  );

  return { success: true };
}

export async function saleorTokenCreate(
  input: NtmsSaleorTokenCreateInput,
): Promise<SaleorAuthSession> {
  return requireSaleorAuthSession(await tokenCreate(input), "Error signing in");
}

export async function saleorAccountRegister({
  redirectUrl,
  ...input
}: SaleorAccountRegisterInput) {
  const result = await accountRegister({
    ...input,
    redirectUrl: redirectUrl ?? getDefaultAccountRedirectUrl("/verify"),
  });

  assertNoNormalizedSaleorAccountErrors(
    result.errors,
    "Error creating account",
  );

  return {
    requiresConfirmation: result.requiresConfirmation,
  };
}

export async function saleorRequestPasswordReset({
  email,
  redirectUrl = getDefaultAccountRedirectUrl("/reset-password"),
}: {
  email: string;
  redirectUrl?: string;
}) {
  const result = await requestPasswordReset({
    email,
    redirectUrl,
  });

  assertNoNormalizedSaleorAccountErrors(
    result.errors,
    "Error requesting password reset",
  );

  return { success: true };
}

export async function saleorSetPassword(
  input: NtmsSaleorSetPasswordInput,
): Promise<SaleorAuthSession> {
  return requireSaleorAuthSession(
    await setPassword(input),
    "Error setting password",
  );
}

export async function saleorConfirmAccount(
  input: NtmsSaleorConfirmAccountInput,
): Promise<SaleorAccountUser> {
  const result = await confirmAccount(input);

  assertNoNormalizedSaleorAccountErrors(
    result.errors,
    "Error confirming account",
  );

  if (!result.user) {
    throw new Error("Saleor did not return a confirmed account");
  }

  return result.user;
}

function authResultFromPayload(payload: {
  token?: string | null;
  refreshToken?: string | null;
  csrfToken?: string | null;
  user?: SaleorAccountUserNode | null;
  errors: SaleorAccountError[];
}): NtmsSaleorAuthResult {
  const errors = normalizeSaleorAccountErrors(payload.errors);

  return {
    ok: errors.length === 0,
    token: payload.token ?? null,
    refreshToken: payload.refreshToken ?? null,
    csrfToken: payload.csrfToken ?? null,
    user: currentUserFromNode(payload.user),
    errors,
  };
}

function requireSaleorAuthSession(
  result: NtmsSaleorAuthResult,
  fallback: string,
): SaleorAuthSession {
  assertNoNormalizedSaleorAccountErrors(result.errors, fallback);

  if (!result.token || !result.user) {
    throw new Error("Saleor did not return an account session");
  }

  return {
    token: result.token,
    refreshToken: result.refreshToken,
    csrfToken: result.csrfToken,
    user: result.user,
  };
}

function assertNoNormalizedSaleorAccountErrors(
  errors: readonly NtmsSaleorAccountError[],
  fallback: string,
) {
  if (errors.length > 0) {
    throw new SaleorAccountMutationError(errors, fallback);
  }
}

function currentUserFromNode(
  user: SaleorAccountUserNode | null | undefined,
): NtmsSaleorCurrentUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    isConfirmed: user.isConfirmed,
    checkoutIds: user.checkoutIds ?? [],
  };
}

function accountCustomerFromNode(
  user: SaleorAccountCustomerNode | null | undefined,
): AccountCustomer | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    title: "",
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: "",
    emailAddress: user.email,
    addresses: user.addresses
      .map((address) =>
        accountAddressFromNode({
          ...address,
          isDefaultShippingAddress:
            address.isDefaultShippingAddress ??
            user.defaultShippingAddress?.id === address.id,
          isDefaultBillingAddress:
            address.isDefaultBillingAddress ??
            user.defaultBillingAddress?.id === address.id,
        }),
      )
      .sort((first, second) => {
        const firstDefault =
          Number(first.defaultShippingAddress) +
          Number(first.defaultBillingAddress);
        const secondDefault =
          Number(second.defaultShippingAddress) +
          Number(second.defaultBillingAddress);

        return secondDefault - firstDefault;
      }),
  };
}

function accountAddressFromNode(address: SaleorAddressNode): AccountAddress {
  const fullName = [address.firstName, address.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: address.id,
    fullName,
    company: address.companyName,
    streetLine1: address.streetAddress1,
    streetLine2: address.streetAddress2,
    city: address.city,
    province: address.countryArea || address.cityArea,
    postalCode: address.postalCode,
    country: {
      id: address.country.code,
      code: address.country.code,
      name: address.country.country,
    },
    phoneNumber: address.phone ?? "",
    defaultShippingAddress: Boolean(address.isDefaultShippingAddress),
    defaultBillingAddress: Boolean(address.isDefaultBillingAddress),
  };
}

function accountOrderAddressFromNode(
  address: SaleorAddressNode | null | undefined,
): AccountOrderAddress | null {
  if (!address) {
    return null;
  }

  const mapped = accountAddressFromNode(address);

  return {
    fullName: mapped.fullName,
    streetLine1: mapped.streetLine1,
    streetLine2: mapped.streetLine2,
    city: mapped.city,
    province: mapped.province,
    postalCode: mapped.postalCode,
    country: mapped.country.name,
    phoneNumber: mapped.phoneNumber,
  };
}

function accountOrderLineFromNode(line: SaleorOrderLineNode): AccountOrderLine {
  const currencyCode =
    line.totalPrice.gross.currency || line.unitPrice.gross.currency || "USD";

  return {
    id: line.id,
    productName: line.productName,
    variantName: line.variantName,
    productSlug: line.variant?.product?.slug ?? null,
    sku: line.productSku ?? line.productVariantId ?? null,
    quantity: line.quantity,
    thumbnailUrl: line.thumbnail?.url ?? null,
    thumbnailAlt: line.thumbnail?.alt ?? null,
    unitPrice: line.unitPrice.gross.amount,
    linePrice: line.totalPrice.gross.amount,
    currencyCode,
  };
}

function accountInvoiceFromNode(
  invoice: SaleorInvoiceNode,
): AccountInvoice | null {
  if (invoice.status !== "SUCCESS" || !invoice.url) {
    return null;
  }

  return {
    id: invoice.id,
    number: invoice.number || "Invoice",
    url: invoice.url,
    createdAt: invoice.createdAt ?? null,
  };
}

function accountOrderFromNode(order: SaleorOrderNode): AccountOrder {
  const lines = order.lines.map(accountOrderLineFromNode);
  const currencyCode =
    order.total.gross.currency ||
    order.subtotal.gross.currency ||
    order.shippingPrice.gross.currency ||
    "USD";
  const undiscountedTotal = order.undiscountedTotal.gross.amount;
  const total = order.total.gross.amount;
  const invoices = (order.invoices ?? [])
    .map(accountInvoiceFromNode)
    .filter((invoice): invoice is AccountInvoice => invoice !== null);

  return {
    id: order.id,
    code: order.number,
    createdAt: order.created,
    updatedAt: order.updatedAt,
    state: order.status,
    stateLabel: order.statusDisplay || order.status,
    paymentState: order.paymentStatusDisplay,
    shippingMethodName: order.shippingMethodName ?? null,
    totalQuantity: lines.reduce(
      (quantity, line) => quantity + line.quantity,
      0,
    ),
    currencyCode,
    subTotalWithTax: order.subtotal.gross.amount,
    shippingWithTax: order.shippingPrice.gross.amount,
    totalWithTax: total,
    discountWithTax: Math.max(0, undiscountedTotal - total),
    isSaleor: true,
    lines,
    invoices,
    shippingAddress: accountOrderAddressFromNode(order.shippingAddress),
    billingAddress: accountOrderAddressFromNode(order.billingAddress),
  };
}

function accountAddressInputToSaleorInput(
  input: AccountAddressInput,
): SaleorAddressInput {
  const { firstName, lastName } = splitFullName(input.fullName);

  return {
    firstName,
    lastName,
    companyName: normalizeString(input.company) ?? undefined,
    streetAddress1: input.streetLine1,
    streetAddress2: normalizeString(input.streetLine2) ?? undefined,
    city: normalizeString(input.city) ?? undefined,
    postalCode: normalizeString(input.postalCode) ?? undefined,
    country: input.countryCode,
    countryArea: normalizeString(input.province) ?? undefined,
    phone: normalizeSaleorPhone(input.phoneNumber, input.countryCode),
  };
}

function normalizeSaleorPhone(
  phone: string | null | undefined,
  country: string,
) {
  const trimmedPhone = normalizeString(phone);

  if (!trimmedPhone) {
    return undefined;
  }

  if (trimmedPhone.startsWith("+")) {
    return trimmedPhone;
  }

  const digits = trimmedPhone.replace(/\D/g, "");
  if ((country === "US" || country === "CA") && digits.length === 10) {
    return `+1${digits}`;
  }
  if ((country === "US" || country === "CA") && digits.length === 11) {
    return `+${digits}`;
  }

  return trimmedPhone;
}

function splitFullName(fullName: string | null | undefined) {
  const normalizedName = normalizeString(fullName) ?? "";
  const [first, ...rest] = normalizedName.split(/\s+/).filter(Boolean);

  return {
    firstName: first || "",
    lastName: rest.join(" ") || "",
  };
}

function requireAccountAddressPayload(
  payload: AccountAddressPayload,
  fallback: string,
): AccountAddress {
  assertNoNormalizedSaleorAccountErrors(
    normalizeSaleorAccountErrors(payload.errors),
    fallback,
  );

  if (!payload.address) {
    throw new Error("Saleor did not return an address");
  }

  return accountAddressFromNode(payload.address);
}

function getDefaultAccountRedirectUrl(path: string) {
  return new URL(path, getBaseUrl()).toString();
}

function formatNormalizedSaleorAccountErrors(
  errors: readonly NtmsSaleorAccountError[],
  fallback: string,
) {
  return errors.map((error) => error.message).find(Boolean) ?? fallback;
}

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function fallbackAccountErrorMessage(code: string) {
  return code
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
