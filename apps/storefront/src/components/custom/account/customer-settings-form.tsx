import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
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
import { useUpdateCustomerMutation } from "@/hooks/use-account-mutations";
import { useHydrated } from "@/hooks/use-hydrated";
import type { AccountCustomer } from "@/lib/account-types";

const formSchema = z.object({
  title: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phoneNumber: z.string(),
});

interface CustomerSettingsFormProps {
  customer: AccountCustomer | null;
}

export function CustomerSettingsForm({ customer }: CustomerSettingsFormProps) {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <CustomerSettingsFormSkeleton customer={customer} />;
  }

  return <ClientCustomerSettingsForm customer={customer} />;
}

function ClientCustomerSettingsForm({ customer }: CustomerSettingsFormProps) {
  const updateCustomerMutation = useUpdateCustomerMutation();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm({
    defaultValues: {
      title: customer?.title || "",
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      phoneNumber: customer?.phoneNumber || "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setStatus(null);
      try {
        await updateCustomerMutation.mutateAsync({
          firstName: value.firstName,
          lastName: value.lastName,
          phoneNumber: value.phoneNumber || null,
          title: value.title || null,
        });
        const message = "Your information has been updated successfully!";
        setStatus({ type: "success", message });
        toast.success(message);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error updating profile";
        setStatus({ type: "error", message });
        toast.error(message);
      }
    },
  });
  const inputId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="max-w-2xl space-y-6"
    >
      {status ? (
        <StatusPanel
          variant={status.type === "error" ? "destructive" : "default"}
          title={status.type === "error" ? "Update failed" : "Profile updated"}
          description={status.message}
          testId="account-settings-status"
        />
      ) : null}
      <FieldGroup>
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="honorific-prefix"
                  placeholder="Artist, Owner, Manager"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="firstName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="given-name"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="lastName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="family-name"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="phoneNumber"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="tel"
                  inputMode="tel"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <Field>
          <FieldLabel htmlFor={inputId}>Email Address</FieldLabel>
          <Input
            id={inputId}
            name="email"
            type="email"
            value={customer?.emailAddress || ""}
            disabled
            className="bg-background/70"
            autoComplete="email"
          />
          <p className="mt-1 text-sm text-foreground/55">
            Email address is tied to account verification and checkout records.
          </p>
        </Field>
      </FieldGroup>

      <LoaderButton
        loading={updateCustomerMutation.isPending}
        type="submit"
        className="h-11 rounded-full bg-[#0071e3] px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0077ed] hover:scale-105 active:scale-95"
      >
        Save changes
      </LoaderButton>
    </form>
  );
}

function CustomerSettingsFormSkeleton({ customer }: CustomerSettingsFormProps) {
  const fallbackId = useId();
  const titleId = `${fallbackId}-title`;
  const firstNameId = `${fallbackId}-first-name`;
  const lastNameId = `${fallbackId}-last-name`;
  const phoneNumberId = `${fallbackId}-phone-number`;
  const emailId = `${fallbackId}-email`;

  return (
    <form className="max-w-2xl space-y-6" aria-busy="true">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={titleId}>Title</FieldLabel>
          <Input
            id={titleId}
            name="title"
            value={customer?.title || ""}
            autoComplete="honorific-prefix"
            disabled
            readOnly
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={firstNameId}>First Name</FieldLabel>
          <Input
            id={firstNameId}
            name="firstName"
            value={customer?.firstName || ""}
            autoComplete="given-name"
            disabled
            readOnly
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={phoneNumberId}>Phone Number</FieldLabel>
          <Input
            id={phoneNumberId}
            name="phoneNumber"
            value={customer?.phoneNumber || ""}
            autoComplete="tel"
            disabled
            readOnly
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={lastNameId}>Last Name</FieldLabel>
          <Input
            id={lastNameId}
            name="lastName"
            value={customer?.lastName || ""}
            autoComplete="family-name"
            disabled
            readOnly
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={emailId}>Email Address</FieldLabel>
          <Input
            id={emailId}
            name="email"
            type="email"
            value={customer?.emailAddress || ""}
            className="bg-background/70"
            autoComplete="email"
            disabled
            readOnly
          />
          <p className="mt-1 text-sm text-foreground/55">
            Email address is tied to account verification and checkout records.
          </p>
        </Field>
      </FieldGroup>

      <LoaderButton
        disabled
        type="submit"
        className="h-11 rounded-full bg-[#0071e3] px-8 text-sm font-semibold text-white shadow-md opacity-60"
      >
        Save changes
      </LoaderButton>
    </form>
  );
}
