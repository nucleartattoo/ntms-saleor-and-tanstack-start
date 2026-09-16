import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { useVerifyAccountMutation } from "@/hooks/use-account-mutations";
import { isSaleorStorefront } from "@/lib/storefront-mode";

interface VerifyFormProps {
  email?: string;
  token: string;
}

export function VerifyForm({ email, token }: VerifyFormProps) {
  const router = useRouter();
  const verifyAccountMutation = useVerifyAccountMutation();
  const { mutateAsync: verifyAccount } = verifyAccountMutation;
  const verifyStartedRef = useRef(false);

  useEffect(() => {
    if (verifyStartedRef.current) {
      return;
    }

    verifyStartedRef.current = true;

    const verify = async () => {
      try {
        await verifyAccount({ email, token });

        toast.success(
          isSaleorStorefront
            ? "Account verified. You can now sign in."
            : "Account verified successfully! You are now signed in.",
        );
        router.navigate({ to: isSaleorStorefront ? "/sign-in" : "/account" });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error verifying account",
        );
      }
    };

    verify();
  }, [email, token, router, verifyAccount]);

  if (verifyAccountMutation.isPending || verifyAccountMutation.isIdle) {
    return (
      <StatusPanel
        title="Verifying your account"
        description="We are checking the verification link and activating the account."
        testId="verify-account-loading"
      />
    );
  }

  return (
    <StatusPanel
      variant="destructive"
      title="Verification failed"
      description="Please check the link in your email or contact support."
      testId="verify-account-error"
    />
  );
}
