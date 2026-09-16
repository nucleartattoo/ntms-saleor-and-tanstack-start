import { useRouteContext } from "@tanstack/react-router";

/**
 * Hook to access authentication session data and current user in client components
 * This follows the TanStack Start pattern of getting session data through route context
 */
export function useAuth() {
  const { hasSession, user } = useRouteContext({
    from: "__root__",
  });
  const activeCustomer = user
    ? {
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        emailAddress: user.email ?? "",
      }
    : null;
  const session = user
    ? {
        customerId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAuthenticated: true,
      }
    : null;

  return {
    session,
    isAuthenticated: hasSession && Boolean(user),
    customerId: user?.id,
    activeCustomer,
  };
}
