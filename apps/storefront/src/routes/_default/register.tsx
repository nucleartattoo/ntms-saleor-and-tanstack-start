import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthShell } from "@/components/custom/account/auth-shell";
import { RegisterForm } from "@/components/custom/account/register-form";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_default/register")({
  head: () => ({
    meta: createBasicMeta(
      "Register",
      "Create a new account to access your orders, saved items, and account settings.",
      true, // private page
    ),
  }),
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/account" });
    }
  },
  component: RegisterComponent,
});

function RegisterComponent() {
  return (
    <AuthShell
      activeAuthTab="register"
      eyebrow="Create account"
      title="Build your customer profile"
      description="Create a customer account for checkout access, order tracking, and a cleaner repeat ordering workflow for tattoo shop supplies."
    >
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0071e3]">
          Artist & Studio Portal
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1d1d1f] sm:text-3xl">
          Create Studio Profile
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#6e6e73]">
          Join verified tattoo artists nationwide for priority dispatch and
          direct wholesale.
        </p>
      </div>
      <RegisterForm />
    </AuthShell>
  );
}
