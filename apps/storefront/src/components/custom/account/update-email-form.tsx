import { Link, useRouter } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";
import { useUpdateCustomerEmailAddressMutation } from "@/hooks/use-account-mutations";

export function UpdateEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const updateEmailMutation = useUpdateCustomerEmailAddressMutation();
  const updateStartedRef = useRef(false);

  useEffect(() => {
    if (updateStartedRef.current) {
      return;
    }

    updateStartedRef.current = true;

    const updateEmail = async () => {
      try {
        await updateEmailMutation.mutateAsync(token);
        toast.success("Email address updated.");
        router.invalidate();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error updating email",
        );
      }
    };

    updateEmail();
  }, [router, token, updateEmailMutation]);

  if (updateEmailMutation.isPending || updateEmailMutation.isIdle) {
    return (
      <StatusPanel
        title="Confirming email change"
        description="We are checking the confirmation link and updating the account email."
        testId="update-email-loading"
      />
    );
  }

  if (updateEmailMutation.isSuccess) {
    return (
      <StatusPanel
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="Email updated"
        description="Your customer account email address has been changed."
        testId="update-email-success"
        actions={
          <Button asChild>
            <Link to="/account/settings">Back to account settings</Link>
          </Button>
        }
      />
    );
  }

  return (
    <StatusPanel
      variant="destructive"
      title="Email update failed"
      description={
        updateEmailMutation.error?.message ||
        "Please check the confirmation link and try again."
      }
      testId="update-email-error"
      actions={
        <Button asChild variant="outline">
          <Link to="/account/settings">Back to account settings</Link>
        </Button>
      }
    />
  );
}
