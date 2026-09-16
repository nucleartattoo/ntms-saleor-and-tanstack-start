import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const legacyPasswordResetSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_default/password-reset")({
  validateSearch: legacyPasswordResetSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/reset-password",
      search: search.token ? { token: search.token } : undefined,
    });
  },
});
