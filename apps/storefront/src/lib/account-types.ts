export type AccountCountry = {
  id: string;
  code: string;
  name: string;
};

export type AccountAddress = {
  id: string;
  fullName: string;
  company: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: AccountCountry;
  phoneNumber: string;
  defaultShippingAddress: boolean;
  defaultBillingAddress: boolean;
};

export type AccountAddressInput = {
  fullName?: string | null;
  company?: string | null;
  streetLine1: string;
  streetLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  countryCode: string;
  phoneNumber?: string | null;
  defaultShippingAddress?: boolean | null;
  defaultBillingAddress?: boolean | null;
};

export type AccountAddressUpdateInput = AccountAddressInput & {
  id: string;
};

export type AccountCustomer = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  addresses: AccountAddress[];
};

export type AccountOrderAddress = {
  fullName: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
};

export type AccountOrderLine = {
  id: string;
  productName: string;
  variantName: string;
  productSlug?: string | null;
  sku?: string | null;
  quantity: number;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string | null;
  unitPrice: number;
  linePrice: number;
  currencyCode: string;
};

export type AccountInvoice = {
  id: string;
  number: string;
  url: string;
  createdAt: string | null;
};

export type AccountOrder = {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  stateLabel: string;
  paymentState: string;
  shippingMethodName: string | null;
  totalQuantity: number;
  currencyCode: string;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  discountWithTax: number;
  isSaleor: boolean;
  lines: AccountOrderLine[];
  invoices: AccountInvoice[];
  shippingAddress: AccountOrderAddress | null;
  billingAddress: AccountOrderAddress | null;
};

export type AccountOrderHistory = {
  items: AccountOrder[];
  totalItems: number;
};

export type AccountCountryOption = AccountCountry;

export function formatSaleorCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}
