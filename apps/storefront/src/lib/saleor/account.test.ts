import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saleorFetch: vi.fn(),
}));

vi.mock("@/env/server", () => ({
  serverEnv: {
    SALEOR_API_ENDPOINT: "https://saleor.test/graphql/",
  },
}));

vi.mock("@/lib/metadata", () => ({
  getBaseUrl: () => "https://store.test",
}));

vi.mock("@/lib/saleor", () => ({
  getSaleorChannel: () => "test-channel",
  saleorFetch: mocks.saleorFetch,
  SaleorFetchError: class SaleorFetchError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = "SaleorFetchError";
      this.status = status;
    }
  },
}));

import {
  accountLogin,
  accountRegister,
  confirmAccount,
  createSaleorAccountAddress,
  getSaleorAccountOrders,
  getSaleorCurrentUser,
  normalizeSaleorAccountErrors,
  requestPasswordReset,
  resetPassword,
  saleorAccountRegister,
  saleorRequestPasswordReset,
  setPassword,
  tokenCreate,
} from "@/lib/saleor/account";

describe("Saleor account API", () => {
  beforeEach(() => {
    mocks.saleorFetch.mockReset();
    vi.restoreAllMocks();
  });

  test("normalizes account errors with safe fallbacks", () => {
    expect(
      normalizeSaleorAccountErrors([
        {
          field: " email ",
          code: "INVALID_CREDENTIALS",
          message: " ",
          addressType: null,
        },
        {
          code: null,
          message: null,
        },
      ]),
    ).toEqual([
      {
        field: "email",
        code: "INVALID_CREDENTIALS",
        message: "Invalid Credentials",
        addressType: null,
      },
      {
        field: null,
        code: "UNKNOWN",
        message: "Unknown",
        addressType: null,
      },
    ]);
  });

  test("registers an account with the configured Saleor channel", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      accountRegister: {
        requiresConfirmation: true,
        errors: [],
      },
    });

    await expect(
      accountRegister({
        email: "buyer@example.com",
        password: "password",
        firstName: "Ada",
      }),
    ).resolves.toEqual({
      ok: true,
      requiresConfirmation: true,
      errors: [],
    });
    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            email: "buyer@example.com",
            password: "password",
            firstName: "Ada",
            channel: "test-channel",
          },
        },
      }),
    );
  });

  test("registers an account with a safe Saleor input allowlist", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      accountRegister: {
        requiresConfirmation: false,
        errors: [],
      },
    });

    await accountRegister({
      email: "buyer@example.com",
      password: "password",
      firstName: "Ada",
      lastName: "Lovelace",
      redirectUrl: "https://store.test/verify",
      metadata: [{ key: "source", value: "test" }],
    });

    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            email: "buyer@example.com",
            password: "password",
            firstName: "Ada",
            lastName: "Lovelace",
            redirectUrl: "https://store.test/verify",
            channel: "test-channel",
          },
        },
      }),
    );
  });

  test("uses a bare storefront confirmation redirect for Saleor account registration", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      accountRegister: {
        requiresConfirmation: true,
        errors: [],
      },
    });

    await expect(
      saleorAccountRegister({
        email: "buyer@example.com",
        password: "password",
        firstName: "Ada",
        lastName: "Lovelace",
      }),
    ).resolves.toEqual({
      requiresConfirmation: true,
    });

    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            email: "buyer@example.com",
            redirectUrl: "https://store.test/verify",
          }),
        },
      }),
    );
  });

  test("maps tokenCreate payloads and exposes accountLogin as an alias", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      tokenCreate: {
        token: "access-token",
        refreshToken: "refresh-token",
        csrfToken: "csrf-token",
        user: {
          id: "VXNlcjox",
          email: "buyer@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          isActive: true,
          isConfirmed: true,
          checkoutIds: ["Q2hlY2tvdXQ6MQ=="],
        },
        errors: [],
      },
    });

    await expect(
      tokenCreate({
        email: "buyer@example.com",
        password: "password",
      }),
    ).resolves.toEqual({
      ok: true,
      token: "access-token",
      refreshToken: "refresh-token",
      csrfToken: "csrf-token",
      user: {
        id: "VXNlcjox",
        email: "buyer@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        isActive: true,
        isConfirmed: true,
        checkoutIds: ["Q2hlY2tvdXQ6MQ=="],
      },
      errors: [],
    });
    expect(accountLogin).toBe(tokenCreate);
  });

  test("requests password reset with the configured Saleor channel", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      requestPasswordReset: {
        errors: [
          {
            field: "email",
            message: "Already requested",
            code: "PASSWORD_RESET_ALREADY_REQUESTED",
          },
        ],
      },
    });

    await expect(
      requestPasswordReset({
        email: "buyer@example.com",
        redirectUrl: "https://store.test/reset",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: [
        {
          field: "email",
          code: "PASSWORD_RESET_ALREADY_REQUESTED",
          message: "Already requested",
          addressType: null,
        },
      ],
    });
    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          channel: "test-channel",
          email: "buyer@example.com",
          redirectUrl: "https://store.test/reset",
        },
      }),
    );
  });

  test("uses a bare storefront password reset redirect for Saleor reset requests", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      requestPasswordReset: {
        errors: [],
      },
    });

    await expect(
      saleorRequestPasswordReset({
        email: "buyer@example.com",
      }),
    ).resolves.toEqual({
      success: true,
    });

    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          channel: "test-channel",
          email: "buyer@example.com",
          redirectUrl: "https://store.test/reset-password",
        },
      }),
    );
  });

  test("queries the current Saleor user with a bearer token", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      me: {
        id: "VXNlcjox",
        email: "buyer@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        isActive: true,
        isConfirmed: true,
        checkoutIds: null,
      },
    });

    await expect(
      getSaleorCurrentUser({ accessToken: " access-token " }),
    ).resolves.toEqual({
      id: "VXNlcjox",
      email: "buyer@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      isActive: true,
      isConfirmed: true,
      checkoutIds: [],
    });
    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: "access-token",
      }),
    );
  });

  test("maps only completed Saleor invoice downloads into account orders", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      me: {
        orders: {
          totalCount: 1,
          edges: [
            {
              node: {
                id: "order-1",
                number: "1001",
                created: "2026-07-15T00:00:00.000Z",
                updatedAt: "2026-07-15T01:00:00.000Z",
                status: "UNFULFILLED",
                statusDisplay: "Unfulfilled",
                isPaid: true,
                paymentStatusDisplay: "Fully charged",
                shippingMethodName: "UPS Ground",
                subtotal: { gross: { amount: 90, currency: "USD" } },
                shippingPrice: { gross: { amount: 10, currency: "USD" } },
                total: { gross: { amount: 100, currency: "USD" } },
                undiscountedTotal: { gross: { amount: 100, currency: "USD" } },
                lines: [],
                invoices: [
                  {
                    id: "invoice-ready",
                    number: "NTS-1001",
                    status: "SUCCESS",
                    url: "https://media.test/NTS-1001.pdf",
                    createdAt: "2026-07-15T01:00:00.000Z",
                  },
                  {
                    id: "invoice-pending",
                    number: null,
                    status: "PENDING",
                    url: null,
                    createdAt: "2026-07-15T00:59:00.000Z",
                  },
                ],
                shippingAddress: null,
                billingAddress: null,
              },
            },
          ],
        },
      },
    });

    await expect(
      getSaleorAccountOrders({ authToken: "access-token" }),
    ).resolves.toMatchObject({
      totalItems: 1,
      items: [
        {
          code: "1001",
          invoices: [
            {
              id: "invoice-ready",
              number: "NTS-1001",
              url: "https://media.test/NTS-1001.pdf",
            },
          ],
        },
      ],
    });
  });

  test("maps setPassword errors and exposes resetPassword as an alias", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      setPassword: {
        token: null,
        refreshToken: null,
        csrfToken: null,
        user: null,
        errors: [
          {
            field: "token",
            message: "",
            code: "JWT_INVALID_TOKEN",
          },
        ],
      },
    });

    await expect(
      setPassword({
        email: "buyer@example.com",
        password: "password",
        token: "bad-token",
      }),
    ).resolves.toEqual({
      ok: false,
      token: null,
      refreshToken: null,
      csrfToken: null,
      user: null,
      errors: [
        {
          field: "token",
          code: "JWT_INVALID_TOKEN",
          message: "Jwt Invalid Token",
          addressType: null,
        },
      ],
    });
    expect(resetPassword).toBe(setPassword);
  });

  test("confirms a Saleor account token", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      confirmAccount: {
        user: {
          id: "VXNlcjox",
          email: "buyer@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          isActive: true,
          isConfirmed: true,
          checkoutIds: [],
        },
        errors: [],
      },
    });

    await expect(
      confirmAccount({
        email: "buyer@example.com",
        token: "confirm-token",
      }),
    ).resolves.toEqual({
      ok: true,
      user: {
        id: "VXNlcjox",
        email: "buyer@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        isActive: true,
        isConfirmed: true,
        checkoutIds: [],
      },
      errors: [],
    });
  });

  test("creates account addresses without app-only validation bypass", async () => {
    mocks.saleorFetch.mockResolvedValueOnce({
      accountAddressCreate: {
        address: {
          id: "QWRkcmVzczox",
          firstName: "Ada",
          lastName: "Lovelace",
          companyName: "",
          streetAddress1: "123 Test Ave",
          streetAddress2: "",
          city: "Austin",
          cityArea: "",
          postalCode: "78701",
          country: {
            code: "US",
            country: "United States of America",
          },
          countryArea: "TX",
          phone: "+15125550100",
          isDefaultShippingAddress: true,
          isDefaultBillingAddress: false,
        },
        errors: [],
      },
    });

    await expect(
      createSaleorAccountAddress({
        authToken: "access-token",
        type: "SHIPPING",
        input: {
          fullName: "Ada Lovelace",
          company: "",
          streetLine1: "123 Test Ave",
          streetLine2: "",
          city: "Austin",
          province: "TX",
          postalCode: "78701",
          countryCode: "US",
          phoneNumber: "512-555-0100",
          defaultShippingAddress: true,
          defaultBillingAddress: false,
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "QWRkcmVzczox",
        phoneNumber: "+15125550100",
      }),
    );

    expect(mocks.saleorFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: "access-token",
        variables: {
          input: {
            firstName: "Ada",
            lastName: "Lovelace",
            companyName: undefined,
            streetAddress1: "123 Test Ave",
            streetAddress2: undefined,
            city: "Austin",
            postalCode: "78701",
            country: "US",
            countryArea: "TX",
            phone: "+15125550100",
          },
          type: "SHIPPING",
        },
      }),
    );
  });
});
