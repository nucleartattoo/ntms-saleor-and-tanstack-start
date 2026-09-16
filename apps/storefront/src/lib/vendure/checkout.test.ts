import { describe, expect, test } from "vitest";
import {
  getCheckoutStepRedirect,
  getCheckoutSteps,
} from "@/lib/vendure/checkout-flow";

const buildOrder = ({
  lineCount = 1,
  shippingAddress = undefined,
  shippingLines = [],
}: {
  lineCount?: number;
  shippingAddress?: Record<string, unknown>;
  shippingLines?: Array<Record<string, unknown>>;
}) =>
  ({
    lines: Array.from({ length: lineCount }, (_, index) => ({
      id: `line-${index}`,
    })),
    shippingAddress,
    shippingLines,
  }) as never;

describe("vendure checkout flow helpers", () => {
  test("redirects home when the active order is missing", () => {
    expect(getCheckoutStepRedirect(undefined, "addresses")).toBe("home");
  });

  test("redirects home when the active order has no lines", () => {
    expect(
      getCheckoutStepRedirect(buildOrder({ lineCount: 0 }), "addresses"),
    ).toBe("home");
  });

  test("redirects payment and shipping steps back to addresses when address data is incomplete", () => {
    const order = buildOrder({
      shippingAddress: {
        streetLine1: "123 Test Street",
        city: "Austin",
        country: "United States",
      },
    });

    expect(getCheckoutStepRedirect(order, "shipping")).toBe("addresses");
    expect(getCheckoutStepRedirect(order, "payment")).toBe("addresses");
  });

  test("redirects payment back to shipping when no shipping line is selected", () => {
    const order = buildOrder({
      shippingAddress: {
        streetLine1: "123 Test Street",
        city: "Austin",
        postalCode: "78701",
        country: "United States",
      },
    });

    expect(getCheckoutStepRedirect(order, "payment")).toBe("shipping");
  });

  test("does not redirect when checkout prerequisites are satisfied", () => {
    const order = buildOrder({
      shippingAddress: {
        streetLine1: "123 Test Street",
        city: "Austin",
        postalCode: "78701",
        country: "United States",
      },
      shippingLines: [{ id: "shipping-1" }],
    });

    expect(getCheckoutStepRedirect(order, "payment")).toBeNull();
  });

  test("marks current and completed checkout steps correctly", () => {
    expect(
      getCheckoutSteps("payment").map((step) => ({
        identifier: step.identifier,
        active: step.active,
        done: step.done,
      })),
    ).toEqual([
      { identifier: "addresses", active: false, done: true },
      { identifier: "shipping", active: false, done: true },
      { identifier: "payment", active: true, done: false },
      { identifier: "summary", active: false, done: false },
    ]);
  });
});
