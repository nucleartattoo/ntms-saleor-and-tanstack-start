import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import type { ResultOf, VariablesOf } from "gql.tada";
import { type DocumentNode, print } from "graphql";
import { serverEnv } from "@/env/server";
import { readFragment } from "@/gql/graphql";
import { useAppSession } from "@/lib/session";
import { isVendureError } from "@/lib/type-guards";
import activeChannelFragment from "@/lib/vendure/fragments/active-channel";
import productFragment from "@/lib/vendure/fragments/product";
import {
  createCustomerAddressMutation,
  deleteCustomerAddressMutation,
  refreshCustomerVerificationMutation,
  requestPasswordResetMutation,
  requestUpdateCustomerEmailAddressMutation,
  resetPasswordMutation,
  updateAccountCustomerMutation,
  updateCustomerAddressMutation,
  updateCustomerEmailAddressMutation,
  updateCustomerPasswordMutation,
} from "@/lib/vendure/mutations/account";
import { authenticate } from "@/lib/vendure/mutations/customer";
import { registerCustomerAccount as registerCustomerAccountMutation } from "@/lib/vendure/mutations/register";
import { verifyCustomerAccount as verifyCustomerAccountMutation } from "@/lib/vendure/mutations/verify";
import {
  activeCustomerFragment,
  customerAddressFragment,
  getActiveCustomerQuery,
} from "@/lib/vendure/queries/active-customer";
import { getCustomerOrdersQuery } from "@/lib/vendure/queries/customer-orders";
import activeOrderFragment from "./fragments/active-order";
import { facetFragment, facetValueFragment } from "./fragments/facet";
import orderFragment from "./fragments/order";
import searchResultFragment from "./fragments/search-result";
import {
  addItemToOrder,
  adjustOrderLineMutation,
  removeOrderLineMutation,
} from "./mutations/active-order";
import {
  addPaymentToOrderMutation,
  availableCountriesQuery,
  createPayPalOrderMutation,
  createStripePaymentIntentMutation,
  eligiblePaymentMethodsQuery,
  eligibleShippingMethodsQuery,
  nextOrderStatesQuery,
  orderByCodeQuery,
  paypalCheckoutClientIdQuery,
  setCustomerForOrderMutation,
  setOrderBillingAddressMutation,
  setOrderShippingAddressMutation,
  setOrderShippingMethodMutation,
  transitionOrderToStateMutation,
} from "./mutations/checkout";
import { getActiveChannelQuery } from "./queries/active-channel";
import { getActiveOrderQuery } from "./queries/active-order";
import {
  collectionFragment,
  getCollectionFacetValuesQuery,
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery,
} from "./queries/collection";
import { getFacetsQuery } from "./queries/facets";
import { getMenuQuery } from "./queries/menu";
import { getProductQuery, getProductsQuery } from "./queries/product";

// Types for checkout operations
export type CreateAddressInput = {
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

export type CreateCustomerInput = {
  title?: string | null;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  emailAddress: string;
};

export type UpdateAddressInput = CreateAddressInput & {
  id: string;
};

type EligiblePaymentMethod = {
  id: string;
  code: string;
  name: string;
  description: string;
  isEligible: boolean;
  eligibilityMessage?: string | null;
};

type CheckoutPaymentReadiness = {
  activeOrder: ResultOf<typeof activeOrderFragment> | null;
  eligiblePaymentMethods: EligiblePaymentMethod[];
  nextOrderStates: string[];
  paypalClientId?: string | null;
  paypalError?: string;
  stripePaymentIntent?: string;
  stripeError?: string;
};

type PayPalPaymentInput =
  | {
      action: "create-order";
      paymentMethodCode: string;
    }
  | {
      action: "approve-order";
      paymentMethodCode: string;
      paypalOrderId: string;
    };

type CheckoutPaymentSubmitResult =
  | {
      type: "paypal-order";
      orderId: string;
    }
  | {
      type: "confirmation";
      orderCode: string;
    }
  | {
      type: "error";
      message: string;
      redirectTo?: string;
    };

/**
 * Server-only function to get the Vendure endpoint
 * This prevents the environment variable from being accessed on the client
 */
const getEndpoint = createServerOnlyFn(() => {
  return serverEnv.VENDURE_SHOP_API_ENDPOINT;
});

type VendureFetchQuery<T, V extends Record<string, unknown>> =
  | DocumentNode
  | TypedDocumentNode<T, V>
  | string;

export class VendureFetchError extends Error {
  status: number;
  query: VendureFetchQuery<unknown, Record<string, unknown>>;

  constructor({
    cause,
    message,
    query,
    status,
  }: {
    cause?: unknown;
    message: string;
    query: VendureFetchQuery<unknown, Record<string, unknown>>;
    status: number;
  }) {
    super(message, { cause });
    this.name = "VendureFetchError";
    this.status = status;
    this.query = query;
  }
}

function getVendureErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error !== "object" || error === null || !("message" in error)) {
    return fallback;
  }

  const message = error.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (message instanceof Error && message.message.trim()) {
    return message.message;
  }

  return fallback;
}

/**
 * Core Vendure GraphQL fetch function
 * Similar to Next.js version but adapted for TanStack Start
 */
export async function vendureFetch<
  T,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  cache = "force-cache",
  headers,
  query,
  variables,
}: {
  cache?: RequestCache;
  headers?: HeadersInit;
  query: VendureFetchQuery<T, V>;
  variables?: V;
}): Promise<{ status: number; body: T; headers: Headers }> {
  try {
    const endpoint = getEndpoint();
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        ...(query && {
          query: typeof query === "string" ? query : print(query),
        }),
        ...(variables && { variables }),
      }),
      cache,
    });

    const body = await result.json();

    if (body.errors) {
      const graphQLError = Array.isArray(body.errors)
        ? body.errors[0]
        : body.errors;

      throw new VendureFetchError({
        cause: graphQLError,
        message: getVendureErrorMessage(
          graphQLError,
          "Vendure GraphQL request failed",
        ),
        query,
        status: result.status || 500,
      });
    }

    return {
      status: result.status,
      body: body.data,
      headers: result.headers,
    };
  } catch (e) {
    if (e instanceof VendureFetchError) {
      throw e;
    }

    if (isVendureError(e)) {
      throw new VendureFetchError({
        cause: e.cause ?? e,
        message: getVendureErrorMessage(e, "Vendure request failed"),
        query,
        status: e.status || 500,
      });
    }

    throw new VendureFetchError({
      cause: e,
      message: getVendureErrorMessage(e, "Vendure request failed"),
      query,
      status: 500,
    });
  }
}

/**
 * Server-only function to get auth headers from session
 * Only callable from server functions, not from isomorphic code
 */
export const getAuthHeaders = createServerOnlyFn(async () => {
  const session = await useAppSession();
  const tokenValue = session.data?.vendureToken;

  return tokenValue
    ? {
        Authorization: `Bearer ${tokenValue}`,
      }
    : undefined;
});

/**
 * Server-only function to update auth token in session
 */
const updateAuthToken = createServerOnlyFn(async (headers: Headers) => {
  const session = await useAppSession();
  const tokenValue = headers.get("vendure-auth-token");

  if (tokenValue && tokenValue !== "") {
    await session.update({
      ...session.data,
      vendureToken: tokenValue,
      isAuthenticated: true,
    });
  }
});

// PUBLIC DATA FUNCTIONS (server functions for security)
// All Vendure calls must go through server for security

export const getActiveChannel = createServerFn().handler(
  async (): Promise<ResultOf<typeof activeChannelFragment>> => {
    const res = await vendureFetch({
      query: getActiveChannelQuery,
    });

    return readFragment(activeChannelFragment, res.body.activeChannel);
  },
);

export const getCollection = createServerFn()
  .validator((handle: string) => handle)
  .handler(
    async ({
      data: handle,
    }): Promise<ResultOf<typeof collectionFragment> | null> => {
      const res = await vendureFetch({
        query: getCollectionQuery,
        variables: {
          slug: handle,
        },
      });

      return res.body.collection
        ? readFragment(collectionFragment, res.body.collection)
        : null;
    },
  );

export const getCollectionProducts = createServerFn()
  .validator(
    (params: {
      collection: string;
      sortKey?: string;
      direction?: "ASC" | "DESC";
      facetValueFilters?: VariablesOf<
        typeof getCollectionProductsQuery
      >["facetValueFilters"];
    }) => params,
  )
  .handler(
    async ({
      data: { collection, sortKey, direction, facetValueFilters },
    }): Promise<ResultOf<typeof searchResultFragment>[]> => {
      const res = await vendureFetch({
        query: getCollectionProductsQuery,
        variables: {
          slug: collection,
          facetValueFilters,
          sortKey: {
            [sortKey || "name"]: direction || "ASC",
          },
        },
      });

      return res.body.search.items.map((item) =>
        readFragment(searchResultFragment, item),
      );
    },
  );

export const getCollectionFacetValues = createServerFn()
  .validator(
    (params: {
      collection: string;
      sortKey?: string;
      direction?: "ASC" | "DESC";
    }) => params,
  )
  .handler(
    async ({
      data: { collection, sortKey, direction },
    }): Promise<ResultOf<typeof facetValueFragment>[]> => {
      const res = await vendureFetch({
        query: getCollectionFacetValuesQuery,
        variables: {
          slug: collection,
          sortKey: {
            [sortKey || "name"]: direction || "ASC",
          },
        },
      });

      return res.body.search.facetValues.map((item) =>
        readFragment(facetValueFragment, item.facetValue),
      );
    },
  );

export const getCollections = createServerFn()
  .validator(
    (params: { topLevelOnly?: boolean; parentId?: string } = {}) => params,
  )
  .handler(
    async ({
      data: { topLevelOnly = false, parentId } = {},
    }): Promise<ResultOf<typeof collectionFragment>[]> => {
      const res = await vendureFetch({
        query: getCollectionsQuery,
        variables: {
          topLevelOnly,
          ...(parentId && { filter: { parentId: { eq: parentId } } }),
        },
      });

      return res.body.collections.items.map((item) =>
        readFragment(collectionFragment, item),
      );
    },
  );

export const getFacets = createServerFn().handler(
  async (): Promise<ResultOf<typeof facetFragment>[]> => {
    const res = await vendureFetch({
      query: getFacetsQuery,
    });

    return res.body.facets.items.map((item) =>
      readFragment(facetFragment, item),
    );
  },
);

export const getMenu = createServerFn().handler(
  async (): Promise<ResultOf<typeof collectionFragment>[]> => {
    const res = await vendureFetch({
      query: getMenuQuery,
    });

    return res.body.collections.items.map((item) =>
      readFragment(collectionFragment, item),
    );
  },
);

export const getProduct = createServerFn()
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const res = await vendureFetch({
      query: getProductQuery,
      variables: {
        slug: handle,
      },
    });

    return readFragment(productFragment, res.body.product);
  });

export const getProducts = createServerFn()
  .validator(
    (params: { query?: string; direction?: string; sortKey?: string }) =>
      params,
  )
  .handler(async ({ data: { query, direction, sortKey } }) => {
    const res = await vendureFetch({
      query: getProductsQuery,
      variables: {
        query,
        sortKey: {
          [sortKey || "name"]: direction || "ASC",
        },
      },
    });

    return res.body.search.items.map((item) =>
      readFragment(searchResultFragment, item),
    );
  });

// AUTHENTICATED DATA FUNCTIONS (SERVER FUNCTIONS)
// These require authentication and can only be called from client as RPC

export const addToCart = createServerFn()
  .validator((params: { productVariantId: string; quantity: number }) => params)
  .handler(async ({ data: { productVariantId, quantity } }) => {
    const res = await vendureFetch({
      query: addItemToOrder,
      variables: {
        productVariantId,
        quantity,
      },
      cache: "no-store",
      headers: await getAuthHeaders(),
    });

    await updateAuthToken(res.headers);

    return res.body.addItemToOrder;
  });

export const adjustCartItem = createServerFn()
  .validator((params: { orderLineId: string; quantity: number }) => params)
  .handler(async ({ data: { orderLineId, quantity } }) => {
    const res = await vendureFetch({
      query: adjustOrderLineMutation,
      variables: {
        orderLineId,
        quantity,
      },
      cache: "no-store",
      headers: await getAuthHeaders(),
    });

    return res.body.adjustOrderLine;
  });

export const removeFromCart = createServerFn()
  .validator((orderLineId: string) => orderLineId)
  .handler(async ({ data: orderLineId }) => {
    const res = await vendureFetch({
      query: removeOrderLineMutation,
      variables: {
        orderLineId,
      },
      cache: "no-store",
      headers: await getAuthHeaders(),
    });

    return res.body.removeOrderLine;
  });

export const getActiveOrder = createServerFn().handler(
  async (): Promise<ResultOf<typeof activeOrderFragment> | null> => {
    const res = await vendureFetch({
      query: getActiveOrderQuery,
      cache: "no-store",
      headers: await getAuthHeaders(),
    });

    return res.body.activeOrder
      ? readFragment(activeOrderFragment, res.body.activeOrder)
      : null;
  },
);

export const authenticateCustomer = createServerFn({ method: "POST" })
  .validator((params: { username: string; password: string }) => params)
  .handler(async ({ data: { username, password } }) => {
    const res = await vendureFetch({
      query: authenticate,
      variables: {
        input: {
          native: {
            username,
            password,
          },
        },
      },
      cache: "no-store",
    });

    await updateAuthToken(res.headers);

    return res.body.authenticate;
  });

export const getActiveCustomer = createServerFn().handler(async () => {
  const res = await vendureFetch({
    query: getActiveCustomerQuery,
    cache: "no-store",
    headers: await getAuthHeaders(),
  });

  return res.body.activeCustomer
    ? readFragment(activeCustomerFragment, res.body.activeCustomer)
    : null;
});

export const getCustomerOrders = createServerFn()
  .validator(
    (options?: VariablesOf<typeof getCustomerOrdersQuery>["options"]) =>
      options,
  )
  .handler(async ({ data: options }) => {
    const res = await vendureFetch({
      query: getCustomerOrdersQuery,
      variables: { options },
      cache: "no-store",
      headers: await getAuthHeaders(),
    });

    return res.body.activeCustomer?.orders;
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .validator(
    (params: VariablesOf<typeof updateAccountCustomerMutation>["input"]) =>
      params,
  )
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: updateAccountCustomerMutation,
      cache: "no-store",
      variables: { input: data },
      headers: await getAuthHeaders(),
    });

    return readFragment(activeCustomerFragment, res.body.updateCustomer);
  });

export const createCustomerAddress = createServerFn({ method: "POST" })
  .validator((params: CreateAddressInput) => params)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: createCustomerAddressMutation,
      cache: "no-store",
      variables: { input: data },
      headers: await getAuthHeaders(),
    });

    return readFragment(
      customerAddressFragment,
      res.body.createCustomerAddress,
    );
  });

export const updateCustomerAddress = createServerFn({ method: "POST" })
  .validator((params: UpdateAddressInput) => params)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: updateCustomerAddressMutation,
      cache: "no-store",
      variables: { input: data },
      headers: await getAuthHeaders(),
    });

    return readFragment(
      customerAddressFragment,
      res.body.updateCustomerAddress,
    );
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const res = await vendureFetch({
      query: deleteCustomerAddressMutation,
      cache: "no-store",
      variables: { id },
      headers: await getAuthHeaders(),
    });

    return res.body.deleteCustomerAddress;
  });

export const updateCustomerPassword = createServerFn({ method: "POST" })
  .validator(
    (params: { currentPassword: string; newPassword: string }) => params,
  )
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: updateCustomerPasswordMutation,
      cache: "no-store",
      variables: data,
      headers: await getAuthHeaders(),
    });

    return res.body.updateCustomerPassword;
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((emailAddress: string) => emailAddress)
  .handler(async ({ data: emailAddress }) => {
    const res = await vendureFetch({
      query: requestPasswordResetMutation,
      cache: "no-store",
      variables: { emailAddress },
    });

    return res.body.requestPasswordReset;
  });

export const resetCustomerPassword = createServerFn({ method: "POST" })
  .validator((params: { token: string; password: string }) => params)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: resetPasswordMutation,
      cache: "no-store",
      variables: data,
    });

    await updateAuthToken(res.headers);

    return res.body.resetPassword;
  });

export const requestUpdateCustomerEmailAddress = createServerFn({
  method: "POST",
})
  .validator((params: { newEmailAddress: string; password: string }) => params)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: requestUpdateCustomerEmailAddressMutation,
      cache: "no-store",
      variables: data,
      headers: await getAuthHeaders(),
    });

    return res.body.requestUpdateCustomerEmailAddress;
  });

export const updateCustomerEmailAddress = createServerFn({ method: "POST" })
  .validator((token: string) => token)
  .handler(async ({ data: token }) => {
    const res = await vendureFetch({
      query: updateCustomerEmailAddressMutation,
      cache: "no-store",
      variables: { token },
      headers: await getAuthHeaders(),
    });

    return res.body.updateCustomerEmailAddress;
  });

export const refreshCustomerVerification = createServerFn({ method: "POST" })
  .validator((emailAddress: string) => emailAddress)
  .handler(async ({ data: emailAddress }) => {
    const res = await vendureFetch({
      query: refreshCustomerVerificationMutation,
      cache: "no-store",
      variables: { emailAddress },
    });

    return res.body.refreshCustomerVerification;
  });

// CHECKOUT OPERATIONS (SERVER FUNCTIONS)
// These handle the checkout flow: addresses, shipping, payment, etc.

export const setOrderShippingAddress = createServerFn({ method: "POST" })
  .validator((data: CreateAddressInput) => data)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: setOrderShippingAddressMutation,
      variables: { input: data },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.setOrderShippingAddress.__typename === "Order") {
      return res.body.setOrderShippingAddress;
    }

    throw new Error(
      res.body.setOrderShippingAddress.message ||
        "Failed to set shipping address",
    );
  });

export const setOrderBillingAddress = createServerFn({ method: "POST" })
  .validator((data: CreateAddressInput) => data)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: setOrderBillingAddressMutation,
      variables: { input: data },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.setOrderBillingAddress.__typename === "Order") {
      return res.body.setOrderBillingAddress;
    }

    throw new Error(
      res.body.setOrderBillingAddress.message ||
        "Failed to set billing address",
    );
  });

export const setCustomerForOrder = createServerFn({ method: "POST" })
  .validator((data: CreateCustomerInput) => data)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: setCustomerForOrderMutation,
      variables: { input: data },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.setCustomerForOrder.__typename === "Order") {
      return res.body.setCustomerForOrder;
    }

    throw new Error(
      res.body.setCustomerForOrder.message || "Failed to set customer",
    );
  });

export const setOrderShippingMethod = createServerFn({ method: "POST" })
  .validator((data: { shippingMethodId: string[] }) => data)
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: setOrderShippingMethodMutation,
      variables: { shippingMethodId: data.shippingMethodId },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.setOrderShippingMethod.__typename === "Order") {
      return res.body.setOrderShippingMethod;
    }

    throw new Error(
      res.body.setOrderShippingMethod.message ||
        "Failed to set shipping method",
    );
  });

export const getEligibleShippingMethods = createServerFn().handler(async () => {
  const res = await vendureFetch({
    query: eligibleShippingMethodsQuery,
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  return res.body.eligibleShippingMethods;
});

export const getEligiblePaymentMethods = createServerFn().handler(async () => {
  const res = await vendureFetch({
    query: eligiblePaymentMethodsQuery,
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  return res.body.eligiblePaymentMethods;
});

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error &&
    typeof error.error.message === "string" &&
    error.error.message.trim()
  ) {
    return error.error.message;
  }

  return fallback;
}

export const getCheckoutPaymentReadiness = createServerFn().handler(
  async (): Promise<CheckoutPaymentReadiness> => {
    const headers = await getAuthHeaders();
    const [activeOrderResult, paymentMethodsResult, nextStatesResult] =
      await Promise.allSettled([
        getActiveOrder(),
        vendureFetch({
          query: eligiblePaymentMethodsQuery,
          headers,
          cache: "no-store",
        }),
        vendureFetch({
          query: nextOrderStatesQuery,
          headers,
          cache: "no-store",
        }),
      ]);

    const activeOrder =
      activeOrderResult.status === "fulfilled" ? activeOrderResult.value : null;
    const eligiblePaymentMethods =
      paymentMethodsResult.status === "fulfilled"
        ? paymentMethodsResult.value.body.eligiblePaymentMethods
        : [];
    const nextOrderStates =
      nextStatesResult.status === "fulfilled"
        ? nextStatesResult.value.body.nextOrderStates
        : [];

    const hasStripeMethod = eligiblePaymentMethods.some(
      (method) => method.isEligible && method.code.includes("stripe"),
    );
    const hasPaypalMethod = eligiblePaymentMethods.some(
      (method) => method.isEligible && method.code.includes("paypal"),
    );

    const [stripeResult, paypalResult] = await Promise.allSettled([
      hasStripeMethod
        ? vendureFetch({
            query: createStripePaymentIntentMutation,
            headers,
            cache: "no-store",
          })
        : Promise.resolve(null),
      hasPaypalMethod
        ? vendureFetch({
            query: paypalCheckoutClientIdQuery,
            headers,
            cache: "no-store",
          })
        : Promise.resolve(null),
    ]);

    const readiness: CheckoutPaymentReadiness = {
      activeOrder,
      eligiblePaymentMethods,
      nextOrderStates,
    };

    if (stripeResult.status === "fulfilled" && stripeResult.value) {
      readiness.stripePaymentIntent =
        stripeResult.value.body.createStripePaymentIntent;
    } else if (hasStripeMethod && stripeResult.status === "rejected") {
      readiness.stripeError = toErrorMessage(
        stripeResult.reason,
        "Stripe is currently unavailable for this order.",
      );
    }

    if (paypalResult.status === "fulfilled" && paypalResult.value) {
      readiness.paypalClientId = paypalResult.value.body.paypalCheckoutClientId;
      if (!readiness.paypalClientId) {
        readiness.paypalError =
          "PayPal Checkout is not configured for this channel.";
      }
    } else if (hasPaypalMethod && paypalResult.status === "rejected") {
      readiness.paypalError = toErrorMessage(
        paypalResult.reason,
        "PayPal Checkout is currently unavailable for this order.",
      );
    }

    return readiness;
  },
);

export const getAvailableCountries = createServerFn().handler(async () => {
  const res = await vendureFetch({
    query: availableCountriesQuery,
    cache: "force-cache",
  });

  return res.body.availableCountries;
});

export const addPaymentToOrder = createServerFn({ method: "POST" })
  .validator(
    (data: { method: string; metadata?: Record<string, unknown> }) => data,
  )
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: addPaymentToOrderMutation,
      variables: {
        input: {
          method: data.method,
          metadata: data.metadata || {},
        },
      },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.addPaymentToOrder.__typename === "Order") {
      return res.body.addPaymentToOrder;
    }

    throw new Error(
      res.body.addPaymentToOrder.message || "Failed to add payment",
    );
  });

export const createPayPalOrder = createServerFn({ method: "POST" }).handler(
  async () => {
    const res = await vendureFetch({
      query: createPayPalOrderMutation,
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    return res.body.createPayPalOrder;
  },
);

export const submitPayPalPayment = createServerFn({ method: "POST" })
  .validator((data: PayPalPaymentInput) => data)
  .handler(async ({ data }): Promise<CheckoutPaymentSubmitResult> => {
    try {
      const [activeCustomer, activeOrder] = await Promise.all([
        getActiveCustomer(),
        getActiveOrder(),
      ]);

      if (!activeCustomer?.id) {
        return {
          type: "error",
          message: "Please sign in before continuing to checkout.",
          redirectTo: "/sign-in?redirect=%2Fcheckout%2Fpayment",
        };
      }

      if (!activeOrder || activeOrder.lines.length === 0) {
        return {
          type: "error",
          message: "There is no active order available. Please return to cart.",
          redirectTo: "/checkout/addresses",
        };
      }

      if (data.action === "create-order") {
        const orderId = await createPayPalOrder();

        return {
          type: "paypal-order",
          orderId,
        };
      }

      const headers = await getAuthHeaders();
      const nextStatesRes = await vendureFetch({
        query: nextOrderStatesQuery,
        headers,
        cache: "no-store",
      });

      if (nextStatesRes.body.nextOrderStates.includes("ArrangingPayment")) {
        const transitionRes = await vendureFetch({
          query: transitionOrderToStateMutation,
          variables: { state: "ArrangingPayment" },
          headers,
          cache: "no-store",
        });

        if (transitionRes.body.transitionOrderToState?.__typename !== "Order") {
          const transitionResult = transitionRes.body.transitionOrderToState;

          return {
            type: "error",
            message:
              transitionResult && "message" in transitionResult
                ? transitionResult.message
                : "The order state could not be updated.",
          };
        }
      }

      const paymentRes = await vendureFetch({
        query: addPaymentToOrderMutation,
        variables: {
          input: {
            method: data.paymentMethodCode,
            metadata: {
              paypalOrderId: data.paypalOrderId,
            },
          },
        },
        headers,
        cache: "no-store",
      });

      if (paymentRes.body.addPaymentToOrder.__typename === "Order") {
        return {
          type: "confirmation",
          orderCode: paymentRes.body.addPaymentToOrder.code,
        };
      }

      return {
        type: "error",
        message:
          paymentRes.body.addPaymentToOrder.message || "PayPal payment failed.",
      };
    } catch (error) {
      return {
        type: "error",
        message: toErrorMessage(error, "PayPal payment failed."),
      };
    }
  });

export const submitSettlementPayment = createServerFn({ method: "POST" })
  .validator((data: { paymentMethodCode: string }) => data)
  .handler(async ({ data }): Promise<CheckoutPaymentSubmitResult> => {
    try {
      const [activeCustomer, activeOrder] = await Promise.all([
        getActiveCustomer(),
        getActiveOrder(),
      ]);

      if (!activeCustomer?.id) {
        return {
          type: "error",
          message: "Please sign in before continuing to checkout.",
          redirectTo: "/sign-in?redirect=%2Fcheckout%2Fpayment",
        };
      }

      if (!activeOrder || activeOrder.lines.length === 0) {
        return {
          type: "error",
          message: "There is no active order available. Please return to cart.",
          redirectTo: "/checkout/addresses",
        };
      }

      const headers = await getAuthHeaders();
      const nextStatesRes = await vendureFetch({
        query: nextOrderStatesQuery,
        headers,
        cache: "no-store",
      });

      if (nextStatesRes.body.nextOrderStates.includes("ArrangingPayment")) {
        const transitionRes = await vendureFetch({
          query: transitionOrderToStateMutation,
          variables: { state: "ArrangingPayment" },
          headers,
          cache: "no-store",
        });

        if (transitionRes.body.transitionOrderToState?.__typename !== "Order") {
          const transitionResult = transitionRes.body.transitionOrderToState;

          return {
            type: "error",
            message:
              transitionResult && "message" in transitionResult
                ? transitionResult.message
                : "The order state could not be updated.",
          };
        }
      }

      const paymentRes = await vendureFetch({
        query: addPaymentToOrderMutation,
        variables: {
          input: {
            method: data.paymentMethodCode,
            metadata: {
              note: "Storefront settlement without payment",
            },
          },
        },
        headers,
        cache: "no-store",
      });

      if (paymentRes.body.addPaymentToOrder.__typename === "Order") {
        return {
          type: "confirmation",
          orderCode: paymentRes.body.addPaymentToOrder.code,
        };
      }

      return {
        type: "error",
        message:
          paymentRes.body.addPaymentToOrder.message ||
          "Settlement payment failed.",
      };
    } catch (error) {
      return {
        type: "error",
        message: toErrorMessage(error, "Settlement payment failed."),
      };
    }
  });

export const transitionOrderToState = createServerFn({ method: "POST" })
  .validator((data: { state?: string }) => data)
  .handler(async ({ data }) => {
    const state = data.state || "ArrangingPayment";
    const res = await vendureFetch({
      query: transitionOrderToStateMutation,
      variables: { state },
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    if (res.body.transitionOrderToState?.__typename === "Order") {
      return res.body.transitionOrderToState;
    }

    const transitionResult = res.body.transitionOrderToState;
    throw new Error(
      transitionResult && "message" in transitionResult
        ? transitionResult.message
        : "Failed to transition order state",
    );
  });

export const getOrderByCode = createServerFn()
  .validator((code: string) => code)
  .handler(
    async ({ data: code }): Promise<ResultOf<typeof orderFragment> | null> => {
      const headers = await getAuthHeaders();
      const res = await vendureFetch({
        query: orderByCodeQuery,
        variables: { code },
        headers,
        cache: "no-store",
      });

      return res.body.orderByCode
        ? readFragment(orderFragment, res.body.orderByCode)
        : null;
    },
  );

export async function getPage(_slug: string) {
  // Placeholder until the Vendure Shop API exposes CMS page entities.
  return undefined;
}

export const registerCustomerAccount = createServerFn({ method: "POST" })
  .validator(
    (params: VariablesOf<typeof registerCustomerAccountMutation>["input"]) =>
      params,
  )
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: registerCustomerAccountMutation,
      cache: "no-store",
      headers: await getAuthHeaders(),
      variables: { input: data },
    });

    return res.body.registerCustomerAccount;
  });

export const verifyCustomerAccount = createServerFn({ method: "POST" })
  .validator(
    (params: VariablesOf<typeof verifyCustomerAccountMutation>) => params,
  )
  .handler(async ({ data }) => {
    const res = await vendureFetch({
      query: verifyCustomerAccountMutation,
      cache: "no-store",
      headers: await getAuthHeaders(),
      variables: { token: data.token, password: data.password },
    });

    // If verification succeeded and returned CurrentUser, update auth
    if (res.body.verifyCustomerAccount.__typename === "CurrentUser") {
      await updateAuthToken(res.headers);
    }

    return res.body.verifyCustomerAccount;
  });
