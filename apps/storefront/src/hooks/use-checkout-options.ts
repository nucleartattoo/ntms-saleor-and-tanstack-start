import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSaleorCountries } from "@/lib/saleor/account-server";
import { isSaleorStorefront, storefrontBackend } from "@/lib/storefront-mode";
import {
  getAvailableCountries,
  getCheckoutPaymentReadiness,
  getEligiblePaymentMethods,
  getEligibleShippingMethods,
} from "@/lib/vendure";

export const availableCountriesQueryKey = [
  "checkout",
  "available-countries",
] as const;
export const eligibleShippingMethodsQueryKey = [
  "checkout",
  "eligible-shipping-methods",
] as const;
export const eligiblePaymentMethodsQueryKey = [
  "checkout",
  "eligible-payment-methods",
] as const;
export const checkoutPaymentReadinessQueryKey = [
  "checkout",
  "payment-readiness",
] as const;

export function availableCountriesQueryOptions() {
  return queryOptions({
    queryKey: [...availableCountriesQueryKey, storefrontBackend],
    queryFn: () =>
      isSaleorStorefront ? getSaleorCountries() : getAvailableCountries(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function eligibleShippingMethodsQueryOptions() {
  return queryOptions({
    queryKey: eligibleShippingMethodsQueryKey,
    queryFn: () => getEligibleShippingMethods(),
    staleTime: 0,
  });
}

export function eligiblePaymentMethodsQueryOptions() {
  return queryOptions({
    queryKey: eligiblePaymentMethodsQueryKey,
    queryFn: () => getEligiblePaymentMethods(),
    staleTime: 0,
  });
}

export function checkoutPaymentReadinessQueryOptions() {
  return queryOptions({
    queryKey: checkoutPaymentReadinessQueryKey,
    queryFn: () => getCheckoutPaymentReadiness(),
    staleTime: 0,
  });
}

export function useAvailableCountries() {
  return useQuery(availableCountriesQueryOptions());
}

export function useEligibleShippingMethods() {
  return useQuery(eligibleShippingMethodsQueryOptions());
}

export function useEligiblePaymentMethods() {
  return useQuery(eligiblePaymentMethodsQueryOptions());
}

export function useCheckoutPaymentReadiness() {
  return useQuery(checkoutPaymentReadinessQueryOptions());
}
