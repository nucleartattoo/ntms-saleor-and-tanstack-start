import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AuthShell } from "@/components/custom/account/auth-shell";
import { ResendVerificationForm } from "@/components/custom/account/resend-verification-form";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_default/resend-verification")({
  head: () => ({
    meta: createBasicMeta(
      "Resend Verification",
      "Request a fresh customer account verification email.",
      true,
    ),
  }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/account" });
    }
  },
  component: ResendVerificationComponent,
});

function ResendVerificationComponent() {
  return (
    <AuthShell
      eyebrow="Account verification"
      title="Resend verification email"
      description="Request a fresh customer verification link for an account that has not been activated yet."
      footer={
        <p className="text-center text-sm text-foreground/55">
          Already verified?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-[#0071e3] underline underline-offset-4 hover:text-[#1d1d1f]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
          Verify account
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Send verification link
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/55">
          Enter the email address used when creating the customer account.
        </p>
      </div>
      <ResendVerificationForm />
    </AuthShell>
  );
}
