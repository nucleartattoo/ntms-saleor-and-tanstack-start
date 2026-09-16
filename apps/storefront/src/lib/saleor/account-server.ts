import { createServerFn } from "@tanstack/react-start";
import {
  getSaleorAccountCustomer,
  getSaleorAccountOrder,
  getSaleorAccountOrders,
  getSaleorAvailableCountries,
} from "@/lib/saleor/account";
import { useAppSession as getAppSession } from "@/lib/session";

async function getCurrentSaleorToken() {
  const session = await getAppSession();

  if (
    !session.data.isAuthenticated ||
    session.data.authBackend !== "saleor" ||
    !session.data.saleorToken
  ) {
    return null;
  }

  return session.data.saleorToken;
}

export const getSaleorActiveCustomer = createServerFn({
  method: "GET",
}).handler(async () => {
  const token = await getCurrentSaleorToken();

  return getSaleorAccountCustomer(token);
});

export const getSaleorCustomerOrders = createServerFn({
  method: "GET",
}).handler(async () => {
  const token = await getCurrentSaleorToken();

  return getSaleorAccountOrders({ authToken: token, first: 30 });
});

export const getSaleorOrderByCode = createServerFn({
  method: "GET",
})
  .validator((code: string) => {
    if (!code) {
      throw new Error("Order code is required");
    }

    return code;
  })
  .handler(async ({ data: code }) => {
    const token = await getCurrentSaleorToken();

    return getSaleorAccountOrder({ authToken: token, code });
  });

export const getSaleorCountries = createServerFn({
  method: "GET",
}).handler(() => getSaleorAvailableCountries());
