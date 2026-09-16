import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
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
import { useRegisterAccountMutation } from "@/hooks/use-account-mutations";
import { useHydrated } from "@/hooks/use-hydrated";

const formSchema = z
  .object({
    emailAddress: z.email("Enter a valid email address"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phoneNumber: z.string(),
    title: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <RegisterFormSkeleton />;
  }

  return <ClientRegisterForm />;
}

function ClientRegisterForm() {
  const router = useRouter();
  const registerAccountMutation = useRegisterAccountMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      emailAddress: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      title: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await registerAccountMutation.mutateAsync({
          emailAddress: value.emailAddress,
          password: value.password,
          firstName: value.firstName,
          lastName: value.lastName,
          phoneNumber: value.phoneNumber || undefined,
          title: value.title || undefined,
        });

        toast.success(
          "Account created successfully. Please sign in with your credentials.",
        );
        router.navigate({ to: "/sign-in" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error creating account";
        setSubmitError(message);
        toast.error(message);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      {submitError ? (
        <StatusPanel
          variant="destructive"
          title="Account creation failed"
          description={submitError}
          size="compact"
        />
      ) : null}
      <FieldGroup className="space-y-4">
        <form.Field
          name="emailAddress"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-bold text-[#1d1d1f]"
                >
                  Studio Email *
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="artist@studio.com"
                  autoComplete="email"
                  className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field
            name="firstName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold text-[#1d1d1f]"
                  >
                    First Name *
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Alex"
                    autoComplete="given-name"
                    className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
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
                <Field data-invalid={isInvalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold text-[#1d1d1f]"
                  >
                    Last Name *
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Morgan"
                    autoComplete="family-name"
                    className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
        <form.Field
          name="phoneNumber"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-bold text-[#1d1d1f]"
                >
                  Phone (Optional)
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="text-xs font-bold text-[#1d1d1f]"
                >
                  Password *
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  placeholder="Password"
                  className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                  className="text-xs font-bold text-[#1d1d1f]"
                >
                  Confirm Password *
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06] text-sm focus:bg-white focus:border-[#0071e3]"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <LoaderButton
        loading={registerAccountMutation.isPending}
        className="w-full h-12 rounded-full bg-[#0071e3] text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all duration-300 hover:scale-[1.01] hover:bg-[#0077ed]"
        type="submit"
      >
        Create Studio Profile
      </LoaderButton>
    </form>
  );
}

function RegisterFormSkeleton() {
  const fallbackId = useId();
  const emailId = `${fallbackId}-email`;
  const firstNameId = `${fallbackId}-first-name`;
  const lastNameId = `${fallbackId}-last-name`;
  const phoneNumberId = `${fallbackId}-phone-number`;
  const passwordId = `${fallbackId}-password`;
  const confirmPasswordId = `${fallbackId}-confirm-password`;

  return (
    <form className="space-y-5" aria-busy="true">
      <FieldGroup className="space-y-4">
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={emailId}
            className="text-xs font-bold text-[#1d1d1f]"
          >
            Studio Email *
          </FieldLabel>
          <Input
            id={emailId}
            name="emailAddress"
            type="email"
            placeholder="artist@studio.com"
            autoComplete="email"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field className="space-y-1.5">
            <FieldLabel
              htmlFor={firstNameId}
              className="text-xs font-bold text-[#1d1d1f]"
            >
              First Name *
            </FieldLabel>
            <Input
              id={firstNameId}
              name="firstName"
              placeholder="Alex"
              autoComplete="given-name"
              disabled
              className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
            />
          </Field>
          <Field className="space-y-1.5">
            <FieldLabel
              htmlFor={lastNameId}
              className="text-xs font-bold text-[#1d1d1f]"
            >
              Last Name *
            </FieldLabel>
            <Input
              id={lastNameId}
              name="lastName"
              placeholder="Morgan"
              autoComplete="family-name"
              disabled
              className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
            />
          </Field>
        </div>
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={phoneNumberId}
            className="text-xs font-bold text-[#1d1d1f]"
          >
            Phone
          </FieldLabel>
          <Input
            id={phoneNumberId}
            name="phoneNumber"
            type="tel"
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
          />
        </Field>
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={passwordId}
            className="text-xs font-bold text-[#1d1d1f]"
          >
            Password *
          </FieldLabel>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
          />
        </Field>
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={confirmPasswordId}
            className="text-xs font-bold text-[#1d1d1f]"
          >
            Confirm Password *
          </FieldLabel>
          <Input
            id={confirmPasswordId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border-black/[0.06]"
          />
        </Field>
      </FieldGroup>
      <LoaderButton
        disabled
        className="w-full h-12 rounded-full bg-[#0071e3] text-white opacity-50"
        type="submit"
      >
        Create Studio Profile
      </LoaderButton>
    </form>
  );
}
