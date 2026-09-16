import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "@/env/server";
import { applySecurityHeaders } from "@/lib/security";

export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: () => {
        const headers = new Headers({
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
        });
        applySecurityHeaders(headers);

        const service =
          serverEnv.VITE_STOREFRONT_BACKEND === "saleor"
            ? "Nuclear Tattoo Supply storefront"
            : serverEnv.APP_SERVICE_NAME;

        return new Response(
          JSON.stringify({
            ok: true,
            service,
            timestamp: new Date().toISOString(),
            backend: serverEnv.VITE_STOREFRONT_BACKEND,
            storefrontApiUrlConfigured: Boolean(
              serverEnv.VITE_STOREFRONT_BACKEND === "saleor"
                ? serverEnv.SALEOR_API_ENDPOINT
                : serverEnv.VENDURE_SHOP_API_ENDPOINT,
            ),
            buildVersion: serverEnv.VITE_APP_BUILD_VERSION ?? null,
          }),
          { headers },
        );
      },
    },
  },
});
