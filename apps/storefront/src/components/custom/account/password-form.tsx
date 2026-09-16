import { useForm } from "@tanstack/react-form";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { LoaderButton } from "@/components/custom/loader-button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateCustomerPasswordMutation } from "@/hooks/use-account-mutations";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(4, "New password must be at least 4 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function PasswordForm() {
  const updatePasswordMutation = useUpdateCustomerPasswordMutation();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: passwordSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        await updatePasswordMutation.mutateAsync({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });

        const message = "Your password has been updated.";
        setStatus({ type: "success", message });
        toast.success(message);
        formApi.reset();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error updating password";
        setStatus({ type: "error", message });
        toast.error(message);
      }
    },
  });
  const renderPasswordField = ({
    autoComplete,
    label,
    name,
  }: {
    autoComplete: string;
    label: string;
    name: "currentPassword" | "newPassword" | "confirmPassword";
  }) => (
    <form.Field
      name={name}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={isInvalid}
              autoComplete={autoComplete}
            />
            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
          </Field>
        );
      }}
    />
  );

  return (
    <div className="space-y-6 py-4">
      <CommercePageHero
        eyebrow="Security"
        title="Password"
        description="Update the password used to access your customer account."
        icon={<KeyRound className="h-5 w-5" />}
        meta={
          <CommerceSignal icon={<ShieldCheck className="h-4 w-4" />}>
            Native auth
          </CommerceSignal>
        }
      />

      <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white p-2 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="border-b border-black/[0.06] px-6 py-5">
          <div className="flex items-center gap-2 text-[#0071e3]">
            <KeyRound className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
              Change password
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-foreground/55">
            Enter your current password before choosing a new one.
          </p>
        </div>
        <div className="px-6 py-6">
          {status ? (
            <StatusPanel
              variant={status.type === "error" ? "destructive" : "default"}
              title={
                status.type === "error" ? "Password update failed" : "Saved"
              }
              description={status.message}
              testId="account-password-status"
              className="mb-6"
            />
          ) : null}

          <form
            className="max-w-2xl space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              {renderPasswordField({
                name: "currentPassword",
                label: "Current password",
                autoComplete: "current-password",
              })}
              {renderPasswordField({
                name: "newPassword",
                label: "New password",
                autoComplete: "new-password",
              })}
              {renderPasswordField({
                name: "confirmPassword",
                label: "Confirm new password",
                autoComplete: "new-password",
              })}
            </FieldGroup>

            <LoaderButton
              loading={updatePasswordMutation.isPending}
              type="submit"
              className="h-11 rounded-full bg-[#0071e3] px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0077ed] hover:scale-105 active:scale-95"
            >
              Update password
            </LoaderButton>
          </form>
        </div>
      </section>
    </div>
  );
}
