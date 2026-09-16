import type { NtmsSaleorAddressInput } from "@/lib/saleor/checkout";

export type NtmsCheckoutAddressValues = NtmsSaleorAddressInput & {
  email: string;
};

export type NtmsCheckoutAddressField = keyof NtmsCheckoutAddressValues;
export type NtmsCheckoutAddressErrors = Partial<
  Record<NtmsCheckoutAddressField, string>
>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const countriesRequiringArea = new Set(["CA", "US"]);

// Saleor restricts shipping-zone country queries to staff users, so this list
// mirrors the public NTMS domestic and cross-border checkout configuration.
export const ntmsCheckoutSupportedCountries = [
  { code: "US", name: "United States" },
  { code: "PR", name: "Puerto Rico" },
  { code: "VI", name: "U.S. Virgin Islands" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
] as const;
const supportedCountryCodes = new Set<string>(
  ntmsCheckoutSupportedCountries.map((country) => country.code),
);

export function validateNtmsCheckoutAddress(
  values: NtmsCheckoutAddressValues,
): NtmsCheckoutAddressErrors {
  const errors: NtmsCheckoutAddressErrors = {};
  const country = values.country.trim().toUpperCase();

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (values.streetAddress1.trim().length < 3) {
    errors.streetAddress1 = "Enter a complete street address.";
  }
  if (!values.city.trim()) {
    errors.city = "City is required.";
  }
  if (!country) {
    errors.country = "Country is required.";
  } else if (!supportedCountryCodes.has(country)) {
    errors.country = "Select a country we currently ship to.";
  }
  if (
    countriesRequiringArea.has(country) &&
    !(values.countryArea ?? "").trim()
  ) {
    errors.countryArea =
      country === "US" ? "State is required." : "Province is required.";
  }
  if (values.postalCode.trim().length < 3) {
    errors.postalCode = "Enter a valid postal code.";
  }

  return errors;
}

export function isNtmsCheckoutAddressValid(errors: NtmsCheckoutAddressErrors) {
  return Object.keys(errors).length === 0;
}
