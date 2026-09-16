import { createFileRoute } from "@tanstack/react-router";
import { getBaseUrl } from "@/lib/metadata";
import { applySecurityHeaders } from "@/lib/security";
import { isSearchIndexingAllowedForRequest } from "@/lib/storefront-indexing";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const indexingEnabled = isSearchIndexingAllowedForRequest(request);
        const headers = new Headers({
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "Content-Type": "text/plain; charset=utf-8",
        });
        applySecurityHeaders(headers);

        const body = indexingEnabled
          ? `User-agent: *\nAllow: /\nSitemap: ${getBaseUrl()}/sitemap.xml\n`
          : "User-agent: *\nDisallow: /\n";

        return new Response(body, { headers });
      },
    },
  },
});
