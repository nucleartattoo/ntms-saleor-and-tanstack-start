import { createServerFn } from "@tanstack/react-start";
import { serverEnv } from "@/env/server";
import type {
  AccountAddressInput,
  AccountAddressUpdateInput,
} from "@/lib/account-types";
import {
  changeSaleorPassword,
  confirmSaleorEmailChange,
  createSaleorAccountAddress,
  deleteSaleorAccountAddress,
  requestSaleorEmailChange,
  SaleorAccountMutationError,
  saleorAccountRegister,
  saleorConfirmAccount,
  saleorRequestPasswordReset,
  saleorSetPassword,
  saleorTokenCreate,
  setSaleorDefaultAddress,
  updateSaleorAccount,
  updateSaleorAccountAddress,
} from "@/lib/saleor/account";
import { useAppSession as getAppSession, updateSession } from "@/lib/session";
import { isVendureError } from "@/lib/type-guards";
import {
  authenticateCustomer,
  createCustomerAddress,
  deleteCustomerAddress,
  getActiveCustomer,
  refreshCustomerVerification,
  registerCustomerAccount,
  requestPasswordReset,
  requestUpdateCustomerEmailAddress,
  resetCustomerPassword,
  updateCustomer,
  updateCustomerAddress,
  updateCustomerEmailAddress,
  updateCustomerPassword,
  verifyCustomerAccount,
} from "@/lib/vendure";

const isSaleorAccountBackend = () =>
  serverEnv.VITE_STOREFRONT_BACKEND === "saleor";

const getRequiredSaleorToken = async () => {
  const session = await getAppSession();

  if (
    !session.data.isAuthenticated ||
    session.data.authBackend !== "saleor" ||
    !session.data.saleorToken
  ) {
    throw new Error("Sign in is required");
  }

  return session.data.saleorToken;
};

const getAccountActionErrorMessage = (error: unknown, fallback: string) => {
  if (isSaleorAccountBackend() && error instanceof Error) {
    return error.message || fallback;
  }

  if (isVendureError(error)) {
    return error.message?.toString() || fallback;
  }

  return fallback;
};

const getSaleorAccountActionErrorCode = (error: unknown) => {
  if (isSaleorAccountBackend() && error instanceof SaleorAccountMutationError) {
    return error.errors[0]?.code;
  }

  return undefined;
};

export type RegisterState =
  | {
      type: "success";
    }
  | {
      type: "error";
      message: string;
    }
  | null;

export type SignInState =
  | {
      type: "success";
      id: string;
    }
  | {
      type: "error";
      message: string;
      code?: string;
    }
  | null;

export type UpdateCustomerState =
  | {
      type: "success";
      customer: {
        id: string;
        title?: string | null;
        firstName: string;
        lastName: string;
        phoneNumber?: string | null;
        emailAddress: string;
      };
    }
  | {
      type: "error";
      message: string;
    }
  | null;

export type AccountMutationState =
  | {
      type: "success";
    }
  | {
      type: "error";
      message: string;
    }
  | null;

/**
 * Server function for sign in
 * Uses proper session management instead of manual cookie handling
 */
export const signIn = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string }) => {
    if (!data.username || !data.password) {
      throw new Error("Username and password are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<SignInState> => {
    try {
      if (isSaleorAccountBackend()) {
        const session = await saleorTokenCreate({
          email: data.username,
          password: data.password,
        });

        await updateSession({
          data: {
            authBackend: "saleor",
            saleorToken: session.token,
            saleorRefreshToken: session.refreshToken ?? undefined,
            saleorCsrfToken: session.csrfToken ?? undefined,
            isAuthenticated: true,
            customerId: session.user.id,
            email: session.user.email,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
          },
        });

        return {
          type: "success",
          id: session.user.id,
        };
      }

      const res = await authenticateCustomer({ data });

      if (res.__typename === "CurrentUser") {
        const customer = await getActiveCustomer();
        if (customer) {
          await updateSession({
            data: {
              isAuthenticated: true,
              customerId: customer.id,
              email: customer.emailAddress,
              firstName: customer.firstName,
              lastName: customer.lastName,
            },
          });
        }

        return {
          type: "success",
          id: res.id,
        };
      }

      if (
        res.__typename === "InvalidCredentialsError" ||
        res.__typename === "NotVerifiedError"
      ) {
        return {
          type: "error",
          message: res.message,
        };
      }

      return {
        type: "error",
        message: "Error signing in",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error signing in"),
        code: getSaleorAccountActionErrorCode(e),
      };
    }
  });

/**
 * Server function for updating customer profile
 */
export const updateCustomerAction = createServerFn({ method: "POST" })
  .validator(
    (data: {
      firstName: string;
      lastName: string;
      phoneNumber?: string | null;
      title?: string | null;
    }) => {
      if (!data.firstName || !data.lastName) {
        throw new Error("First name and last name are required");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<UpdateCustomerState> => {
    try {
      if (isSaleorAccountBackend()) {
        const customer = await updateSaleorAccount(
          await getRequiredSaleorToken(),
          {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        );

        await updateSession({
          data: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.emailAddress,
          },
        });

        return {
          type: "success",
          customer: {
            id: customer.id,
            title: customer.title,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phoneNumber: customer.phoneNumber,
            emailAddress: customer.emailAddress,
          },
        };
      }

      const customer = await updateCustomer({ data });

      // Update session with new customer data
      await updateSession({
        data: {
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
      });

      return {
        type: "success",
        customer: {
          id: customer.id,
          title: customer.title,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          emailAddress: customer.emailAddress,
        },
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error updating profile"),
      };
    }
  });

export const createCustomerAddressAction = createServerFn({ method: "POST" })
  .validator((data: AccountAddressInput) => {
    if (!data.streetLine1 || !data.countryCode) {
      throw new Error("Street address and country are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        const token = await getRequiredSaleorToken();
        const address = await createSaleorAccountAddress({
          authToken: token,
          input: data,
          type: data.defaultShippingAddress
            ? "SHIPPING"
            : data.defaultBillingAddress
              ? "BILLING"
              : undefined,
        });

        if (data.defaultShippingAddress) {
          await setSaleorDefaultAddress({
            authToken: token,
            id: address.id,
            type: "SHIPPING",
          });
        }

        if (data.defaultBillingAddress) {
          await setSaleorDefaultAddress({
            authToken: token,
            id: address.id,
            type: "BILLING",
          });
        }

        return { type: "success" };
      }

      await createCustomerAddress({ data });
      return { type: "success" };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error creating address"),
      };
    }
  });

export const updateCustomerAddressAction = createServerFn({ method: "POST" })
  .validator((data: AccountAddressUpdateInput) => {
    if (!data.id || !data.streetLine1 || !data.countryCode) {
      throw new Error("Address id, street address, and country are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        const token = await getRequiredSaleorToken();
        const address = await updateSaleorAccountAddress({
          authToken: token,
          id: data.id,
          input: data,
        });

        if (data.defaultShippingAddress) {
          await setSaleorDefaultAddress({
            authToken: token,
            id: address.id,
            type: "SHIPPING",
          });
        }

        if (data.defaultBillingAddress) {
          await setSaleorDefaultAddress({
            authToken: token,
            id: address.id,
            type: "BILLING",
          });
        }

        return { type: "success" };
      }

      await updateCustomerAddress({ data });
      return { type: "success" };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error updating address"),
      };
    }
  });

export const deleteCustomerAddressAction = createServerFn({ method: "POST" })
  .validator((id: string) => {
    if (!id) {
      throw new Error("Address id is required");
    }
    return id;
  })
  .handler(async ({ data: id }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        await deleteSaleorAccountAddress(await getRequiredSaleorToken(), id);
        return { type: "success" };
      }

      await deleteCustomerAddress({ data: id });
      return { type: "success" };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error deleting address"),
      };
    }
  });

export const updateCustomerPasswordAction = createServerFn({ method: "POST" })
  .validator((data: { currentPassword: string; newPassword: string }) => {
    if (!data.currentPassword || !data.newPassword) {
      throw new Error("Current and new passwords are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        await changeSaleorPassword(await getRequiredSaleorToken(), data);
        return { type: "success" };
      }

      const result = await updateCustomerPassword({ data });

      if (result.__typename === "Success") {
        return { type: "success" };
      }

      if ("message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error updating password",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error updating password"),
      };
    }
  });

export const requestPasswordResetAction = createServerFn({ method: "POST" })
  .validator((emailAddress: string) => {
    if (!emailAddress) {
      throw new Error("Email address is required");
    }
    return emailAddress;
  })
  .handler(async ({ data: emailAddress }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        await saleorRequestPasswordReset({ email: emailAddress });
        return { type: "success" };
      }

      const result = await requestPasswordReset({ data: emailAddress });

      if (result?.__typename === "Success") {
        return { type: "success" };
      }

      if (result && "message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error requesting password reset",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(
          e,
          "Error requesting password reset",
        ),
      };
    }
  });

export const resetCustomerPasswordAction = createServerFn({ method: "POST" })
  .validator((data: { email?: string; token: string; password: string }) => {
    if (!data.token || !data.password) {
      throw new Error("Reset token and password are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        if (!data.email) {
          return {
            type: "error",
            message: "Email address is required to reset this Saleor password",
          };
        }

        const session = await saleorSetPassword({
          email: data.email,
          password: data.password,
          token: data.token,
        });

        await updateSession({
          data: {
            authBackend: "saleor",
            saleorToken: session.token,
            saleorRefreshToken: session.refreshToken ?? undefined,
            saleorCsrfToken: session.csrfToken ?? undefined,
            isAuthenticated: true,
            customerId: session.user.id,
            email: session.user.email,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
          },
        });

        return { type: "success" };
      }

      const result = await resetCustomerPassword({ data });

      if (result.__typename === "CurrentUser") {
        const customer = await getActiveCustomer();

        if (customer) {
          await updateSession({
            data: {
              isAuthenticated: true,
              customerId: customer.id,
              email: customer.emailAddress,
              firstName: customer.firstName,
              lastName: customer.lastName,
            },
          });
        }

        return { type: "success" };
      }

      if ("message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error resetting password",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error resetting password"),
      };
    }
  });

export const requestUpdateCustomerEmailAddressAction = createServerFn({
  method: "POST",
})
  .validator((data: { newEmailAddress: string; password: string }) => {
    if (!data.newEmailAddress || !data.password) {
      throw new Error("New email address and password are required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        await requestSaleorEmailChange(await getRequiredSaleorToken(), data);
        return { type: "success" };
      }

      const result = await requestUpdateCustomerEmailAddress({ data });

      if (result.__typename === "Success") {
        return { type: "success" };
      }

      if ("message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error requesting email address change",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(
          e,
          "Error requesting email address change",
        ),
      };
    }
  });

export const updateCustomerEmailAddressAction = createServerFn({
  method: "POST",
})
  .validator((token: string) => {
    if (!token) {
      throw new Error("Email change token is required");
    }
    return token;
  })
  .handler(async ({ data: token }): Promise<AccountMutationState> => {
    try {
      if (isSaleorAccountBackend()) {
        const customer = await confirmSaleorEmailChange(
          await getRequiredSaleorToken(),
          token,
        );

        if (customer) {
          await updateSession({
            data: {
              isAuthenticated: true,
              customerId: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
            },
          });
        }

        return { type: "success" };
      }

      const result = await updateCustomerEmailAddress({ data: token });

      if (result.__typename === "Success") {
        const customer = await getActiveCustomer();

        if (customer) {
          await updateSession({
            data: {
              isAuthenticated: true,
              customerId: customer.id,
              email: customer.emailAddress,
              firstName: customer.firstName,
              lastName: customer.lastName,
            },
          });
        }

        return { type: "success" };
      }

      if ("message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error updating email address",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(
          e,
          "Error updating email address",
        ),
      };
    }
  });

export const refreshCustomerVerificationAction = createServerFn({
  method: "POST",
})
  .validator((emailAddress: string) => {
    if (!emailAddress) {
      throw new Error("Email address is required");
    }
    return emailAddress;
  })
  .handler(async ({ data: emailAddress }): Promise<AccountMutationState> => {
    try {
      const result = await refreshCustomerVerification({ data: emailAddress });

      if (result.__typename === "Success") {
        return { type: "success" };
      }

      if ("message" in result) {
        return {
          type: "error",
          message: result.message,
        };
      }

      return {
        type: "error",
        message: "Error sending verification email",
      };
    } catch (e: unknown) {
      if (isVendureError(e)) {
        return {
          type: "error",
          message: e.message?.toString() || "Error sending verification email",
        };
      }

      return {
        type: "error",
        message: "Error sending verification email",
      };
    }
  });

/**
 * Server function for registering a new account
 */
export const registerAccount = createServerFn({ method: "POST" })
  .validator(
    (data: {
      emailAddress: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      title?: string;
    }) => {
      if (!data.emailAddress || !data.password) {
        throw new Error("Email and password are required");
      }
      if (!data.firstName || !data.lastName) {
        throw new Error("First name and last name are required");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<RegisterState> => {
    try {
      if (isSaleorAccountBackend()) {
        await saleorAccountRegister({
          email: data.emailAddress,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        });

        return {
          type: "success",
        };
      }

      const res = await registerCustomerAccount({
        data: {
          emailAddress: data.emailAddress,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || null,
          title: data.title || null,
        },
      });

      if (res.__typename === "Success") {
        return {
          type: "success",
        };
      }

      if (
        res.__typename === "MissingPasswordError" ||
        res.__typename === "PasswordValidationError" ||
        res.__typename === "NativeAuthStrategyError"
      ) {
        return {
          type: "error",
          message: res.message,
        };
      }

      return {
        type: "error",
        message: "Error creating account",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error creating account"),
      };
    }
  });

export type VerifyAccountState =
  | {
      type: "success";
      id: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

/**
 * Server function for verifying customer account
 */
export const verifyAccount = createServerFn({ method: "POST" })
  .validator((data: { email?: string; token: string; password?: string }) => {
    if (!data.token) {
      throw new Error("Verification token is required");
    }
    return data;
  })
  .handler(async ({ data }): Promise<VerifyAccountState> => {
    try {
      if (isSaleorAccountBackend()) {
        if (!data.email) {
          return {
            type: "error",
            message: "Email address is required to verify this Saleor account",
          };
        }

        await saleorConfirmAccount({
          email: data.email,
          token: data.token,
        });

        return {
          type: "success",
          id: data.email,
        };
      }

      const res = await verifyCustomerAccount({
        data: {
          token: data.token,
          password: data.password || null,
        },
      });

      if (res.__typename === "CurrentUser") {
        // Get the full customer data to populate session
        const customer = await getActiveCustomer();

        if (customer) {
          // Update session with user data
          await updateSession({
            data: {
              isAuthenticated: true,
              customerId: customer.id,
              email: customer.emailAddress,
              firstName: customer.firstName,
              lastName: customer.lastName,
            },
          });
        }

        return {
          type: "success",
          id: res.id,
        };
      }

      if (
        res.__typename === "VerificationTokenInvalidError" ||
        res.__typename === "VerificationTokenExpiredError" ||
        res.__typename === "MissingPasswordError" ||
        res.__typename === "PasswordValidationError" ||
        res.__typename === "PasswordAlreadySetError" ||
        res.__typename === "NativeAuthStrategyError"
      ) {
        return {
          type: "error",
          message: res.message,
        };
      }

      return {
        type: "error",
        message: "Error verifying account",
      };
    } catch (e: unknown) {
      return {
        type: "error",
        message: getAccountActionErrorMessage(e, "Error verifying account"),
      };
    }
  });
