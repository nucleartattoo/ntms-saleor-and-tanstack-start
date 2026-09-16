import { createServerOnlyFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { serverEnv } from "@/env/server";
import {
  DEFAULT_SALEOR_CHANNEL,
  isValidSaleorChannel,
  SALEOR_CHANNEL_COOKIE,
} from "./channels";

type SaleorGraphQLError = {
  message?: string;
  path?: string[];
};

type SaleorGraphQLResponse<T> = {
  data?: T;
  errors?: SaleorGraphQLError[];
};

const getSaleorEndpoint = createServerOnlyFn(
  () => serverEnv.SALEOR_API_ENDPOINT,
);

export const getSaleorChannel = createServerOnlyFn(() => {
  try {
    const cookieChannel = getCookie(SALEOR_CHANNEL_COOKIE);
    if (cookieChannel && isValidSaleorChannel(cookieChannel)) {
      return cookieChannel;
    }
  } catch {
    // Outside active request context (e.g. CLI or tests)
  }
  return serverEnv.SALEOR_CHANNEL || DEFAULT_SALEOR_CHANNEL;
});

export const getSaleorRootCategorySlug = createServerOnlyFn(
  () => serverEnv.SALEOR_ROOT_CATEGORY_SLUG,
);

export const getSaleorAllowUnsafePaymentGateways = createServerOnlyFn(
  () => serverEnv.SALEOR_ALLOW_UNSAFE_PAYMENT_GATEWAYS === "enabled",
);

export const getSaleorEnabledPaymentGatewayIds = createServerOnlyFn(
  () =>
    new Set(
      serverEnv.SALEOR_ENABLED_PAYMENT_GATEWAYS.split(",")
        .map((gatewayId) => gatewayId.trim())
        .filter(Boolean),
    ),
);

export class SaleorFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SaleorFetchError";
    this.status = status;
  }
}

export async function saleorFetch<
  T,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  authToken,
  query,
  variables,
}: {
  authToken?: string | null;
  query: string;
  variables?: V;
}): Promise<T> {
  const response = await fetch(getSaleorEndpoint(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = (await response.json()) as SaleorGraphQLResponse<T>;

  if (!response.ok) {
    throw new SaleorFetchError(
      `Saleor HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`,
      response.status,
    );
  }

  if (payload.errors?.length) {
    throw new SaleorFetchError(
      payload.errors
        .map((error) => error.message || "GraphQL error")
        .join("; "),
      response.status,
    );
  }

  if (!payload.data) {
    throw new SaleorFetchError(
      "Saleor response did not include data",
      response.status,
    );
  }

  return payload.data;
}
