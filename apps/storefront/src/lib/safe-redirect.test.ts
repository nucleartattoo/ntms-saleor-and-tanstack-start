import { describe, expect, test } from "vitest";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";

describe("getSafeInternalRedirect", () => {
  test("keeps internal paths, query strings, and hashes", () => {
    expect(
      getSafeInternalRedirect("/checkout?step=payment#payment-method"),
    ).toBe("/checkout?step=payment#payment-method");
  });

  test.each([
    "https://example.com/checkout",
    "//example.com/checkout",
    "/\\example.com/checkout",
    "javascript:alert(1)",
    "account",
    "\u0000/account",
  ])("rejects unsafe redirect %s", (redirect) => {
    expect(getSafeInternalRedirect(redirect)).toBe("/account");
  });

  test("uses a caller-provided fallback for missing values", () => {
    expect(getSafeInternalRedirect(undefined, "/")).toBe("/");
  });
});
