import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  createCustomerAddressAction,
  deleteCustomerAddressAction,
  refreshCustomerVerificationAction,
  registerAccount,
  requestPasswordResetAction,
  requestUpdateCustomerEmailAddressAction,
  resetCustomerPasswordAction,
  signIn,
  updateCustomerAction,
  updateCustomerAddressAction,
  updateCustomerEmailAddressAction,
  updateCustomerPasswordAction,
  verifyAccount,
} from "@/components/custom/account/actions";
import {
  clearPrivateStorefrontState,
  refreshStorefrontState,
} from "@/hooks/use-active-order";
import type {
  AccountAddressInput,
  AccountAddressUpdateInput,
} from "@/lib/account-types";
import { clearSession } from "@/lib/session";

export class AccountActionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AccountActionError";
    this.code = code;
  }
}

function assertActionSuccess<
  T extends { type: string; message?: string; code?: string } | null,
>(result: T, fallback: string) {
  if (result?.type !== "success") {
    throw new AccountActionError(result?.message || fallback, result?.code);
  }

  return result;
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const result = await signIn({ data });
      return assertActionSuccess(result, "Error signing in");
    },
    onSuccess: async () => {
      await refreshStorefrontState({ queryClient, router });
    },
  });
}

export function useRegisterAccountMutation() {
  return useMutation({
    mutationFn: async (data: {
      emailAddress: string;
      password: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      title?: string;
    }) => {
      const result = await registerAccount({ data });
      return assertActionSuccess(result, "Error creating account");
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      phoneNumber?: string | null;
      title?: string | null;
    }) => {
      const result = await updateCustomerAction({ data });
      return assertActionSuccess(result, "Error updating profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useCreateCustomerAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccountAddressInput) => {
      const result = await createCustomerAddressAction({ data });
      return assertActionSuccess(result, "Error creating address");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useUpdateCustomerAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccountAddressUpdateInput) => {
      const result = await updateCustomerAddressAction({ data });
      return assertActionSuccess(result, "Error updating address");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useDeleteCustomerAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCustomerAddressAction({ data: id });
      return assertActionSuccess(result, "Error deleting address");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useUpdateCustomerPasswordMutation() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const result = await updateCustomerPasswordAction({ data });
      return assertActionSuccess(result, "Error updating password");
    },
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: async (emailAddress: string) => {
      const result = await requestPasswordResetAction({ data: emailAddress });
      return assertActionSuccess(result, "Error requesting password reset");
    },
  });
}

export function useResetCustomerPasswordMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      email?: string;
      token: string;
      password: string;
    }) => {
      const result = await resetCustomerPasswordAction({ data });
      return assertActionSuccess(result, "Error resetting password");
    },
    onSuccess: async () => {
      await refreshStorefrontState({ queryClient, router });
    },
  });
}

export function useRequestUpdateCustomerEmailAddressMutation() {
  return useMutation({
    mutationFn: async (data: { newEmailAddress: string; password: string }) => {
      const result = await requestUpdateCustomerEmailAddressAction({ data });
      return assertActionSuccess(
        result,
        "Error requesting email address change",
      );
    },
  });
}

export function useUpdateCustomerEmailAddressMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await updateCustomerEmailAddressAction({ data: token });
      return assertActionSuccess(result, "Error updating email address");
    },
    onSuccess: async () => {
      await refreshStorefrontState({ queryClient, router });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useRefreshCustomerVerificationMutation() {
  return useMutation({
    mutationFn: async (emailAddress: string) => {
      const result = await refreshCustomerVerificationAction({
        data: emailAddress,
      });
      return assertActionSuccess(result, "Error sending verification email");
    },
  });
}

export function useVerifyAccountMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      email?: string;
      token: string;
      password?: string;
    }) => {
      const result = await verifyAccount({ data });
      return assertActionSuccess(result, "Error verifying account");
    },
    onSuccess: async () => {
      await refreshStorefrontState({ queryClient, router });
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await clearSession();
    },
    onSuccess: async () => {
      await clearPrivateStorefrontState({ queryClient });
    },
  });
}
