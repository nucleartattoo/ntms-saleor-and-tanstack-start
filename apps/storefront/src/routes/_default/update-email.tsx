import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AuthShell } from "@/components/custom/account/auth-shell";
import { UpdateEmailForm } from "@/components/custom/account/update-email-form";
import { createBasicMeta } from "@/lib/metadata";

const updateEmailSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_default/update-email")({
  validateSearch: updateEmailSearchSchema,
  head: () => ({
    meta: createBasicMeta(
      "Update Email Address",
      "Confirm an email address change for your customer account.",
      true,
    ),
  }),
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: UpdateEmailComponent,
});

function UpdateEmailComponent() {
  const { token } = Route.useSearch();

  return (
    <AuthShell
      eyebrow="Email confirmation"
      title="Confirm email change"
      description="Use this confirmation link to finish changing the email address on your customer account."
      footer={
        <p className="text-center text-sm text-foreground/55">
          Need account access?{" "}
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
          Confirm email
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Update account email
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/55">
          This page automatically validates the confirmation token from your
          email.
        </p>
      </div>
      <UpdateEmailForm token={token ?? ""} />
    </AuthShell>
  );
}
