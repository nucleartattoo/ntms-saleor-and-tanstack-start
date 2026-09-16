import { createFileRoute } from "@tanstack/react-router";
import { PasswordForm } from "@/components/custom/account/password-form";
import { clientEnv } from "@/env/client";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_account/account/security")({
  head: () => ({
    meta: createBasicMeta(
      "Account Security",
      `Manage password and security settings for your ${clientEnv.VITE_SITE_NAME} account.`,
      true,
    ),
  }),
  component: PasswordForm,
});
