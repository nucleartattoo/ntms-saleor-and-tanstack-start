import { useForm } from "@tanstack/react-form";
import { MailCheck } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { LoaderButton } from "@/components/custom/loader-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRequestUpdateCustomerEmailAddressMutation } from "@/hooks/use-account-mutations";
import type { AccountCustomer } from "@/lib/account-types";

const emailChangeSchema = z.object({
  newEmailAddress: z.email("Enter a valid email address"),
  password: z.string().min(1, "Current password is required"),
});

export function EmailChangeForm({
  customer,
}: {
  customer: AccountCustomer | null;
}) {
  const requestEmailChangeMutation =
    useRequestUpdateCustomerEmailAddressMutation();
  const currentEmailId = useId();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      newEmailAddress: "",
      password: "",
    },
    validators: {
      onSubmit: emailChangeSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setStatus(null);

      try {
        await requestEmailChangeMutation.mutateAsync(value);
        const message =
          "Email change requested. Check the new email address for a confirmation link.";
        setStatus({ type: "success", message });
        toast.success(message);
        formApi.reset();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error requesting email address change";
        setStatus({ type: "error", message });
        toast.error(message);
      }
    },
  });

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      {status ? (
        <StatusPanel
          icon={
            status.type === "success" ? (
              <MailCheck className="h-5 w-5" />
            ) : undefined
          }
          variant={status.type === "error" ? "destructive" : "default"}
          title={
            status.type === "error" ? "Email change failed" : "Check your email"
          }
          description={status.message}
          testId="account-email-change-status"
        />
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={currentEmailId}>Current email</FieldLabel>
          <Input
            id={currentEmailId}
            type="email"
            value={customer?.emailAddress || ""}
            disabled
            readOnly
            autoComplete="email"
          />
          <FieldDescription>
            The store sends a confirmation link before the account email is
            changed.
          </FieldDescription>
        </Field>
        <form.Field
          name="newEmailAddress"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>New email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="email"
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        />
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="current-password"
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
        loading={requestEmailChangeMutation.isPending}
        type="submit"
        className="h-11 rounded-full bg-[#0071e3] px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0077ed] hover:scale-105 active:scale-95"
      >
        Request email change
      </LoaderButton>
    </form>
  );
}
