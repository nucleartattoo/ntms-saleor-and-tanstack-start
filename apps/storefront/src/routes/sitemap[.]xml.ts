import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalUrl } from "@/lib/metadata";
import { getNtmsSaleorSitemapEntries } from "@/lib/saleor/catalog";
import { applySecurityHeaders } from "@/lib/security";
import { isSearchIndexingAllowedForRequest } from "@/lib/storefront-indexing";

const sitemapCacheTtlMs = 60 * 60 * 1000;
let sitemapCache: { body: string; expiresAt: number } | null = null;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isSearchIndexingAllowedForRequest(request)) {
          return new Response("Not found", { status: 404 });
        }

        const now = Date.now();
        try {
          const body =
            sitemapCache && sitemapCache.expiresAt > now
              ? sitemapCache.body
              : await createSitemap();
          const headers = new Headers({
            "Cache-Control":
              "public, max-age=300, s-maxage=3600, stale-if-error=86400",
            "Content-Type": "application/xml; charset=utf-8",
          });
          applySecurityHeaders(headers);

          return new Response(body, { headers });
        } catch (error) {
          console.error("Unable to build the Saleor sitemap", error);
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});

async function createSitemap() {
  const entries = await getNtmsSaleorSitemapEntries();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ({ path }) =>
        `  <url><loc>${escapeXml(getCanonicalUrl(path))}</loc></url>`,
    ),
    "</urlset>",
  ].join("\n");

  sitemapCache = {
    body,
    expiresAt: Date.now() + sitemapCacheTtlMs,
  };

  return body;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return character;
    }
  });
}
