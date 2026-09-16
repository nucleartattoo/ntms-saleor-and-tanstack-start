import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ResultOf } from "gql.tada";
import { readFragment } from "@/gql/graphql";
import type { AccountCustomer } from "@/lib/account-types";
import { getSaleorActiveCustomer } from "@/lib/saleor/account-server";
import { isSaleorStorefront, storefrontBackend } from "@/lib/storefront-mode";
import { getActiveCustomer } from "@/lib/vendure";
import {
  type activeCustomerFragment,
  customerAddressFragment,
} from "@/lib/vendure/queries/active-customer";

export const activeCustomerQueryKey = ["account", "active-customer"] as const;

export function activeCustomerQueryOptions() {
  return queryOptions({
    queryKey: [...activeCustomerQueryKey, storefrontBackend],
    queryFn: async (): Promise<AccountCustomer | null> => {
      if (isSaleorStorefront) {
        return getSaleorActiveCustomer();
      }

      return vendureCustomerToAccountCustomer(await getActiveCustomer());
    },
    staleTime: 30_000,
  });
}

export function useActiveCustomer() {
  return useQuery(activeCustomerQueryOptions());
}

function vendureCustomerToAccountCustomer(
  customer: ResultOf<typeof activeCustomerFragment> | null,
): AccountCustomer | null {
  if (!customer) {
    return null;
  }

  return {
    id: customer.id,
    title: customer.title ?? "",
    firstName: customer.firstName,
    lastName: customer.lastName,
    phoneNumber: customer.phoneNumber ?? "",
    emailAddress: customer.emailAddress,
    addresses: (customer.addresses ?? []).map((addressData) => {
      const address = readFragment(customerAddressFragment, addressData);

      return {
        id: address.id,
        fullName: address.fullName ?? "",
        company: address.company ?? "",
        streetLine1: address.streetLine1,
        streetLine2: address.streetLine2 ?? "",
        city: address.city ?? "",
        province: address.province ?? "",
        postalCode: address.postalCode ?? "",
        country: {
          id: address.country.code,
          code: address.country.code,
          name: address.country.name,
        },
        phoneNumber: address.phoneNumber ?? "",
        defaultShippingAddress: Boolean(address.defaultShippingAddress),
        defaultBillingAddress: Boolean(address.defaultBillingAddress),
      };
    }),
  };
}
