import { serverEnv } from "@/env/server";

export function isSearchIndexingAllowedForRequest(request: Request) {
  return (
    serverEnv.VITE_SEARCH_INDEXING === "enabled" &&
    isCanonicalStorefrontRequest(request)
  );
}

export function isCanonicalStorefrontRequest(request: Request) {
  const configuredUrl = serverEnv.VITE_WEBSITE_URL;
  if (!configuredUrl) {
    return true;
  }

  const configuredHost = new URL(configuredUrl).host.toLowerCase();
  const requestHost = getRequestHost(request);

  return !requestHost || requestHost === configuredHost;
}

function getRequestHost(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  return host?.split(",", 1)[0]?.trim().toLowerCase() ?? "";
}
