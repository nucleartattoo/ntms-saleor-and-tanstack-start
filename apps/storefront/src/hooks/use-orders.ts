import { queryOptions, useQuery } from "@tanstack/react-query";
import type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
import { readFragment } from "@/gql/graphql";
import type {
  AccountOrder,
  AccountOrderAddress,
  AccountOrderHistory,
} from "@/lib/account-types";
import {
  getSaleorCustomerOrders,
  getSaleorOrderByCode,
} from "@/lib/saleor/account-server";
import { isSaleorStorefront, storefrontBackend } from "@/lib/storefront-mode";
import { getCustomerOrders, getOrderByCode } from "@/lib/vendure";
import {
  orderAddressFragment,
  orderDiscountFragment,
  orderPaymentFragment,
  orderShippingLineFragment,
} from "@/lib/vendure/fragments/active-order";
import assetFragment from "@/lib/vendure/fragments/image";
import orderFragment from "@/lib/vendure/fragments/order";
import productFragment from "@/lib/vendure/fragments/product";
import type { getCustomerOrdersQuery } from "@/lib/vendure/queries/customer-orders";

type CustomerOrdersOptions = VariablesOf<
  typeof getCustomerOrdersQuery
>["options"];

export const orderHistoryOptions = {
  sort: { createdAt: "DESC" },
  filter: { active: { eq: false } },
} satisfies NonNullable<CustomerOrdersOptions>;

export const orderHistoryQueryKey = ["account", "orders", "history"] as const;

export const orderByCodeQueryKey = (code: string) =>
  ["account", "orders", code] as const;
export const vendureOrderByCodeQueryKey = (code: string) =>
  ["vendure", "orders", code] as const;

export function orderHistoryQueryOptions() {
  return queryOptions({
    queryKey: [...orderHistoryQueryKey, storefrontBackend],
    queryFn: async (): Promise<AccountOrderHistory> => {
      if (isSaleorStorefront) {
        const history = await getSaleorCustomerOrders();

        return {
          ...history,
          items: [...history.items].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          ),
        };
      }

      const result = await getCustomerOrders({ data: orderHistoryOptions });
      const items = (result?.items ?? []).map(vendureOrderToAccountOrder);

      return {
        items,
        totalItems: result?.totalItems ?? items.length,
      };
    },
    staleTime: 30_000,
  });
}

export function orderByCodeQueryOptions(code: string) {
  return queryOptions({
    queryKey: [...orderByCodeQueryKey(code), storefrontBackend],
    queryFn: async (): Promise<AccountOrder | null> => {
      if (isSaleorStorefront) {
        return getSaleorOrderByCode({ data: code });
      }

      const order = await getOrderByCode({ data: code });

      return order ? vendureOrderResultToAccountOrder(order) : null;
    },
    staleTime: 30_000,
  });
}

export function vendureOrderByCodeQueryOptions(code: string) {
  return queryOptions({
    queryKey: vendureOrderByCodeQueryKey(code),
    queryFn: () => getOrderByCode({ data: code }),
    staleTime: 30_000,
  });
}

export function useOrderHistory() {
  return useQuery(orderHistoryQueryOptions());
}

export function useOrderByCode(code: string) {
  return useQuery(orderByCodeQueryOptions(code));
}

export function useVendureOrderByCode(code: string) {
  return useQuery(vendureOrderByCodeQueryOptions(code));
}

function vendureAddressToAccountOrderAddress(
  addressData: FragmentOf<typeof orderAddressFragment> | null | undefined,
): AccountOrderAddress | null {
  if (!addressData) {
    return null;
  }

  const address = readFragment(orderAddressFragment, addressData);

  return {
    fullName: address.fullName ?? "",
    streetLine1: address.streetLine1 ?? "",
    streetLine2: address.streetLine2 ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    postalCode: address.postalCode ?? "",
    country: address.country ?? "",
    phoneNumber: address.phoneNumber ?? "",
  };
}

function vendureOrderToAccountOrder(
  orderData: FragmentOf<typeof orderFragment>,
): AccountOrder {
  const order = readFragment(orderFragment, orderData);

  return vendureOrderResultToAccountOrder(order);
}

function vendureOrderResultToAccountOrder(
  order: ResultOf<typeof orderFragment>,
): AccountOrder {
  const payment = order.payments?.[0]
    ? readFragment(orderPaymentFragment, order.payments[0])
    : null;
  const shippingLine = order.shippingLines[0]
    ? readFragment(orderShippingLineFragment, order.shippingLines[0])
    : null;
  const discountWithTax = order.discounts.reduce((total, discountData) => {
    const discount = readFragment(orderDiscountFragment, discountData);

    return total + Math.abs(discount.amountWithTax);
  }, 0);

  return {
    id: order.id,
    code: order.code,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    state: order.state,
    stateLabel: order.state,
    paymentState: payment?.state ?? "Payment not recorded",
    shippingMethodName: shippingLine?.shippingMethod.name ?? null,
    totalQuantity: order.totalQuantity,
    currencyCode: order.currencyCode,
    subTotalWithTax: order.subTotalWithTax,
    shippingWithTax: order.shippingWithTax,
    totalWithTax: order.totalWithTax,
    discountWithTax,
    isSaleor: false,
    lines: order.lines.map((line) => {
      const product = readFragment(
        productFragment,
        line.productVariant.product,
      );
      const lineAsset = line.featuredAsset
        ? readFragment(assetFragment, line.featuredAsset)
        : null;
      const productAsset = product.featuredAsset
        ? readFragment(assetFragment, product.featuredAsset)
        : null;

      return {
        id: line.id,
        productName: product.name,
        variantName: line.productVariant.name,
        productSlug: product.slug,
        sku: line.productVariant.sku,
        quantity: line.quantity,
        thumbnailUrl: lineAsset?.preview ?? productAsset?.source ?? null,
        thumbnailAlt: productAsset?.name ?? product.name,
        unitPrice: line.unitPriceWithTax,
        linePrice: line.linePriceWithTax,
        currencyCode: order.currencyCode,
      };
    }),
    invoices: [],
    shippingAddress: vendureAddressToAccountOrderAddress(
      order.shippingAddress ?? null,
    ),
    billingAddress: vendureAddressToAccountOrderAddress(
      order.billingAddress ?? null,
    ),
  };
}
