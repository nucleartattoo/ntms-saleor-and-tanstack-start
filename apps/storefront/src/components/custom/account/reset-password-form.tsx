import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
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
import { useResetCustomerPasswordMutation } from "@/hooks/use-account-mutations";

const resetPasswordSchema = z
  .object({
    password: z.string().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm({
  email,
  token,
}: {
  email?: string;
  token: string;
}) {
  const router = useRouter();
  const resetPasswordMutation = useResetCustomerPasswordMutation();

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await resetPasswordMutation.mutateAsync({
        email,
        token,
        password: value.password,
      });

      toast.success("Password reset successfully.");
      router.navigate({ to: "/account" });
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      {resetPasswordMutation.error ? (
        <StatusPanel
          variant="destructive"
          size="compact"
          title="Password reset failed"
          description={resetPasswordMutation.error.message}
          testId="reset-password-error"
        />
      ) : null}
      <FieldGroup>
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-semibold text-[#1d1d1f]"
                >
                  New password
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:border-[#0071e3] transition-all"
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        />
        <form.Field
          name="confirmPassword"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-semibold text-[#1d1d1f]"
                >
                  Confirm new password
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
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
        loading={resetPasswordMutation.isPending}
        className="w-full h-12 rounded-full bg-[#0071e3] text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.01] active:scale-[0.99]"
        type="submit"
      >
        Reset password
      </LoaderButton>
    </form>
  );
}
