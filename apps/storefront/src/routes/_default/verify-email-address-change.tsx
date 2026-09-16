import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const legacyEmailChangeSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_default/verify-email-address-change")({
  validateSearch: legacyEmailChangeSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/update-email",
      search: search.token ? { token: search.token } : undefined,
    });
  },
});
