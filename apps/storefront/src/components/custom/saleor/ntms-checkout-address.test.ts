import { describe, expect, test } from "vitest";
import {
  isNtmsCheckoutAddressValid,
  type NtmsCheckoutAddressValues,
  ntmsCheckoutSupportedCountries,
  validateNtmsCheckoutAddress,
} from "./ntms-checkout-address";

const validAddress: NtmsCheckoutAddressValues = {
  email: "artist@example.com",
  firstName: "A",
  lastName: "Li",
  companyName: "Studio",
  streetAddress1: "123 Main Street",
  streetAddress2: "",
  city: "LA",
  postalCode: "90001",
  country: "US",
  countryArea: "CA",
  phone: "",
};

describe("Saleor checkout address validation", () => {
  test("matches the countries configured in NTMS shipping zones", () => {
    expect(
      ntmsCheckoutSupportedCountries.map((country) => country.code),
    ).toEqual(["US", "PR", "VI", "CA", "MX"]);
  });

  test("accepts a complete address, including a one-letter legal name", () => {
    expect(validateNtmsCheckoutAddress(validAddress)).toEqual({});
  });

  test("reports actionable errors for required customer fields", () => {
    const errors = validateNtmsCheckoutAddress({
      ...validAddress,
      email: "not-an-email",
      firstName: " ",
      streetAddress1: "1",
      postalCode: "",
    });

    expect(errors).toMatchObject({
      email: "Enter a valid email address.",
      firstName: "First name is required.",
      streetAddress1: "Enter a complete street address.",
      postalCode: "Enter a valid postal code.",
    });
    expect(isNtmsCheckoutAddressValid(errors)).toBe(false);
  });

  test.each([
    ["US", "State is required."],
    ["CA", "Province is required."],
  ])("requires an area for %s", (country, expectedMessage) => {
    expect(
      validateNtmsCheckoutAddress({
        ...validAddress,
        country,
        countryArea: "",
      }).countryArea,
    ).toBe(expectedMessage);
  });

  test("does not require an administrative area for every country", () => {
    const errors = validateNtmsCheckoutAddress({
      ...validAddress,
      country: "MX",
      countryArea: "",
    });

    expect(errors.countryArea).toBeUndefined();
    expect(isNtmsCheckoutAddressValid(errors)).toBe(true);
  });

  test("rejects destinations outside the configured shipping zones", () => {
    expect(
      validateNtmsCheckoutAddress({ ...validAddress, country: "GB" }).country,
    ).toBe("Select a country we currently ship to.");
  });
});
