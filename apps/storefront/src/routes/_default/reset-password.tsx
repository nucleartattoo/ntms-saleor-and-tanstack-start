import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AuthShell } from "@/components/custom/account/auth-shell";
import { ResetPasswordForm } from "@/components/custom/account/reset-password-form";
import { createBasicMeta } from "@/lib/metadata";

const resetPasswordSearchSchema = z.object({
  email: z.string().optional().catch(undefined),
  token: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_default/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  head: () => ({
    meta: createBasicMeta(
      "Set New Password",
      "Set a new password for your customer account.",
      true,
    ),
  }),
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({ to: "/forgot-password" });
    }
  },
  component: ResetPasswordComponent,
});

function ResetPasswordComponent() {
  const { email, token } = Route.useSearch();

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Choose a new password"
      description="Use the secure reset link from your email to set a fresh account password."
      footer={
        <p className="text-center text-sm text-foreground/55">
          Already changed it?{" "}
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
          New password
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Reset password
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/55">
          Set a password with at least 8 characters, uppercase, lowercase, and a
          number.
        </p>
      </div>
      <ResetPasswordForm email={email} token={token ?? ""} />
    </AuthShell>
  );
}
