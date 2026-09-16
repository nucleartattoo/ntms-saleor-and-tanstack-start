const fallbackAccountPath = "/account";

function containsControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function getSafeInternalRedirect(
  value: unknown,
  fallback = fallbackAccountPath,
) {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    containsControlCharacter(candidate)
  ) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://storefront.invalid");
    const redirectUrl = new URL(candidate, baseUrl);

    if (redirectUrl.origin !== baseUrl.origin) return fallback;
    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return fallback;
  }
}
