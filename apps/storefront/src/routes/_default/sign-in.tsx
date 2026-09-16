import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AuthShell } from "@/components/custom/account/auth-shell";
import { SignInForm } from "@/components/custom/account/sign-in-form";
import { serverEnv } from "@/env/server";
import { createBasicMeta } from "@/lib/metadata";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";

const signInSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

const getBuildVersion = createServerFn({ method: "GET" }).handler(
  async () => serverEnv.VITE_APP_BUILD_VERSION?.trim() ?? null,
);

export const Route = createFileRoute("/_default/sign-in")({
  validateSearch: signInSearchSchema,
  loader: async () => ({
    buildVersion: await getBuildVersion(),
  }),
  head: () => ({
    meta: createBasicMeta(
      "Sign In",
      "Sign in to your account to access your orders, saved items, and account settings.",
      true, // private page
    ),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: getSafeInternalRedirect(search.redirect) });
    }
  },
  component: SignInComponent,
});

function SignInComponent() {
  const { buildVersion } = Route.useLoaderData();

  return (
    <AuthShell
      activeAuthTab="sign-in"
      eyebrow="Sign in"
      title="Access your studio account"
      description="Sign in before checkout to keep carts, orders, addresses, and payment state tied to the same customer profile."
      buildVersion={buildVersion}
    >
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0071e3]">
          Professional Account
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1d1d1f] sm:text-3xl">
          Sign In
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#6e6e73]">
          Access order tracking, wholesale pricing, and saved studio addresses.
        </p>
      </div>
      <SignInForm />
    </AuthShell>
  );
}
