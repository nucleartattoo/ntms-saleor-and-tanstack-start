import { useForm } from "@tanstack/react-form";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
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
import {
  AccountActionError,
  useSignInMutation,
} from "@/hooks/use-account-mutations";
import { useHydrated } from "@/hooks/use-hydrated";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";
import { isSaleorStorefront } from "@/lib/storefront-mode";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInSubmitError = {
  message: string;
  code?: string;
};

const unconfirmedAccountCodes = new Set([
  "ACCOUNT_NOT_CONFIRMED",
  "ACCOUNT_NOT_CONFIRMED_ERROR",
  "NOT_VERIFIED",
  "NOT_VERIFIED_ERROR",
]);

const invalidCredentialsCodes = new Set([
  "INVALID_CREDENTIALS",
  "INVALID_CREDENTIALS_ERROR",
]);

function getSignInSubmitError(error: unknown): SignInSubmitError {
  if (error instanceof AccountActionError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "Error signing in",
  };
}

function getSignInErrorPanel(error: SignInSubmitError) {
  const code = error.code?.toUpperCase();

  if (code && unconfirmedAccountCodes.has(code)) {
    return {
      title: "Email confirmation required",
      description: (
        <span>
          This account still needs email confirmation. Check your inbox for the
          Nuclear Tattoo Supply confirmation email from
          noreply@nucleartattoosupply.com, then sign in again.
        </span>
      ),
    };
  }

  if (code && invalidCredentialsCodes.has(code)) {
    return {
      title: "Email or password is incorrect",
      description: (
        <span>
          Check the password and try again. If this email was registered
          earlier, use Forgot password to set a fresh password.
        </span>
      ),
    };
  }

  return {
    title: "Sign in failed",
    description: error.message,
  };
}

export function SignInForm() {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <SignInFormSkeleton />;
  }

  return <ClientSignInForm />;
}

function ClientSignInForm() {
  const router = useRouter();
  const { redirect } = useSearch({ strict: false });
  const [submitError, setSubmitError] = useState<SignInSubmitError | null>(
    null,
  );
  const signInMutation = useSignInMutation();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await signInMutation.mutateAsync({
          username: value.username,
          password: value.password,
        });

        toast.success("Welcome back!");
        router.navigate({ to: getSafeInternalRedirect(redirect) });
      } catch (error) {
        const nextError = getSignInSubmitError(error);
        setSubmitError(nextError);
        toast.error(nextError.message);
      }
    },
  });

  const errorPanel = submitError ? getSignInErrorPanel(submitError) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {errorPanel ? (
        <StatusPanel
          variant="destructive"
          title={errorPanel.title}
          description={errorPanel.description}
          testId="sign-in-error"
          size="compact"
        />
      ) : null}
      <FieldGroup className="space-y-4">
        <form.Field
          name="username"
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
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="john.doe@acme.com"
                  autoComplete="email"
                  className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:border-[#0071e3] transition-all"
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
                  className="text-xs font-semibold text-[#1d1d1f]"
                >
                  Password
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:border-[#0071e3] transition-all"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <LoaderButton
        loading={signInMutation.isPending}
        className="w-full h-12 rounded-full bg-[#0071e3] text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0077ed] hover:scale-[1.01] active:scale-[0.99]"
        type="submit"
      >
        Sign in securely
      </LoaderButton>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-[#86868b]">
        <Link
          to="/forgot-password"
          className="font-medium text-[#0071e3] hover:text-[#0077ed] hover:underline transition-colors"
        >
          Forgot password?
        </Link>
        {isSaleorStorefront ? null : (
          <Link
            to="/resend-verification"
            className="font-medium text-[#0071e3] hover:text-[#0077ed] hover:underline transition-colors"
          >
            Resend verification
          </Link>
        )}
      </div>
    </form>
  );
}

function SignInFormSkeleton() {
  const fallbackId = useId();
  const usernameId = `${fallbackId}-username`;
  const passwordId = `${fallbackId}-password`;

  return (
    <form className="space-y-4" aria-busy="true">
      <FieldGroup className="space-y-4">
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={usernameId}
            className="text-xs font-semibold text-[#1d1d1f]"
          >
            E-Mail
          </FieldLabel>
          <Input
            id={usernameId}
            name="username"
            placeholder="john.doe@acme.com"
            autoComplete="email"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm"
          />
        </Field>
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor={passwordId}
            className="text-xs font-semibold text-[#1d1d1f]"
          >
            Password
          </FieldLabel>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            disabled
            className="h-12 rounded-xl bg-[#f5f5f7] border border-black/[0.06] text-sm"
          />
        </Field>
      </FieldGroup>
      <LoaderButton
        disabled
        className="w-full h-12 rounded-full bg-[#0071e3] text-sm font-semibold text-white shadow-sm opacity-50"
        type="submit"
      >
        Sign in
      </LoaderButton>
    </form>
  );
}
