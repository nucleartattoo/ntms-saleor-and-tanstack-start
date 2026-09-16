import { useForm } from "@tanstack/react-form";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { LoaderButton } from "@/components/custom/loader-button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRequestPasswordResetMutation } from "@/hooks/use-account-mutations";

const requestPasswordResetSchema = z.object({
  emailAddress: z.email("Enter a valid email address"),
});

export function RequestPasswordResetForm() {
  const requestPasswordResetMutation = useRequestPasswordResetMutation();
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: {
      emailAddress: "",
    },
    validators: {
      onSubmit: requestPasswordResetSchema,
    },
    onSubmit: async ({ value }) => {
      await requestPasswordResetMutation.mutateAsync(value.emailAddress);
      setSent(true);
      toast.success("If the account exists, a reset email has been sent.");
    },
  });

  if (sent) {
    return (
      <StatusPanel
        icon={<MailCheck className="h-5 w-5" />}
        title="Check your email"
        description="If that email belongs to a customer account, a password reset link has been sent."
        testId="request-password-reset-success"
      />
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      {requestPasswordResetMutation.error ? (
        <StatusPanel
          variant="destructive"
          size="compact"
          title="Reset request failed"
          description={requestPasswordResetMutation.error.message}
        />
      ) : null}
      <FieldGroup>
        <form.Field
          name="emailAddress"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-semibold text-[#1d1d1f]"
                >
                  E-Mail
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="email"
                  placeholder="john.doe@acme.com"
                  className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:border-[#0071e3] transition-all"
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <LoaderButton
        loading={requestPasswordResetMutation.isPending}
        className="w-full h-12 rounded-full bg-[#0071e3] text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.01] active:scale-[0.99]"
        type="submit"
      >
        Send reset link
      </LoaderButton>
    </form>
  );
}
