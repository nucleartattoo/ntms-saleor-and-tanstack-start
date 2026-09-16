import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { Lock, MapPinned } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";

import { useCart } from "@/components/custom/cart/cart-context";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readFragment } from "@/gql/graphql";
import { useActiveCustomer } from "@/hooks/use-active-customer";
import { useAuth } from "@/hooks/use-auth";
import { useSaveCheckoutAddressMutation } from "@/hooks/use-checkout-mutations";
import { useAvailableCountries } from "@/hooks/use-checkout-options";
import type { CreateAddressInput, CreateCustomerInput } from "@/lib/vendure";
import { customerAddressFragment } from "@/lib/vendure/queries/active-customer";

const formSchema = z.object({
  // Customer info
  emailAddress: z.email("Enter a valid email address."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  phoneNumber: z.string(),
  title: z.string(),
  // Shipping address
  fullName: z.string().min(2, "Full name is required."),
  streetLine1: z.string().min(3, "Street address is required."),
  streetLine2: z.string(),
  company: z.string(),
  city: z.string().min(2, "City is required."),
  province: z.string(),
  postalCode: z.string().min(3, "Postal code is required."),
  countryCode: z.string().min(1, "Country is required."),
  shippingPhoneNumber: z.string(),
});

type CheckoutAddressFormValues = z.infer<typeof formSchema>;

const STORAGE_KEY = "checkout-addresses-form";
const draftField = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z.string().optional(),
);
const savedFormSchema = z.object({
  emailAddress: draftField,
  firstName: draftField,
  lastName: draftField,
  phoneNumber: draftField,
  title: draftField,
  fullName: draftField,
  streetLine1: draftField,
  streetLine2: draftField,
  company: draftField,
  city: draftField,
  province: draftField,
  postalCode: draftField,
  countryCode: draftField,
  shippingPhoneNumber: draftField,
});

function getEmptyCheckoutAddressFormValues(): CheckoutAddressFormValues {
  return {
    emailAddress: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    title: "",
    fullName: "",
    streetLine1: "",
    streetLine2: "",
    company: "",
    city: "",
    province: "",
    postalCode: "",
    countryCode: "",
    shippingPhoneNumber: "",
  };
}

function readSavedCheckoutAddressForm() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = savedFormSchema.safeParse(JSON.parse(saved));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeSavedCheckoutAddressForm(values: CheckoutAddressFormValues) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {}
}

function clearSavedCheckoutAddressForm() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function getPreferredCountryCode(
  countries: { code: string }[],
  fallback = "US",
) {
  return (
    countries.find((country) => country.code === fallback)?.code ??
    countries[0]?.code ??
    fallback
  );
}

export function Addresses() {
  const router = useRouter();
  const { activeCustomer } = useAuth();
  const activeCustomerQuery = useActiveCustomer();
  const { cart } = useCart();
  const countriesQuery = useAvailableCountries();
  const saveCheckoutAddressMutation = useSaveCheckoutAddressMutation();
  const countries = countriesQuery.data ?? [];
  const requiresSignIn = !activeCustomer;
  const error = saveCheckoutAddressMutation.error?.message;
  const savedAddresses = useMemo(
    () =>
      activeCustomerQuery.data?.addresses?.map((address) =>
        readFragment(customerAddressFragment, address),
      ) ?? [],
    [activeCustomerQuery.data],
  );

  const savedFormData = useMemo(() => readSavedCheckoutAddressForm(), []);
  const fallbackCountryCode = getPreferredCountryCode(countries);
  const defaultFormValues = useMemo<CheckoutAddressFormValues>(() => {
    const emptyValues = getEmptyCheckoutAddressFormValues();
    const customerFullName = [
      activeCustomer?.firstName,
      activeCustomer?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...emptyValues,
      ...savedFormData,
      emailAddress:
        savedFormData?.emailAddress || activeCustomer?.emailAddress || "",
      firstName: savedFormData?.firstName || activeCustomer?.firstName || "",
      lastName: savedFormData?.lastName || activeCustomer?.lastName || "",
      fullName: savedFormData?.fullName || customerFullName,
      countryCode: savedFormData?.countryCode || fallbackCountryCode,
    };
  }, [activeCustomer, fallbackCountryCode, savedFormData]);

  const form = useForm({
    defaultValues: defaultFormValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const customerInput: CreateCustomerInput = {
          emailAddress: value.emailAddress,
          firstName: value.firstName,
          lastName: value.lastName,
          phoneNumber: value.phoneNumber || null,
          title: value.title || null,
        };

        const addressInput: CreateAddressInput = {
          fullName: value.fullName,
          streetLine1: value.streetLine1,
          streetLine2: value.streetLine2 || null,
          company: value.company || null,
          city: value.city || null,
          province: value.province || null,
          postalCode: value.postalCode || null,
          countryCode: value.countryCode,
          phoneNumber: value.shippingPhoneNumber || null,
        };

        await saveCheckoutAddressMutation.mutateAsync({
          address: addressInput,
          customer: customerInput,
          shouldSetCustomer: !activeCustomer && !cart?.customer,
        });

        clearSavedCheckoutAddressForm();

        router.navigate({
          to: "/checkout/$step",
          params: { step: "shipping" },
        });
      } catch {
        // Mutation state renders the error.
      }
    },
  });
  const applySavedAddress = (address: (typeof savedAddresses)[number]) => {
    form.setFieldValue("fullName", address.fullName || "");
    form.setFieldValue("streetLine1", address.streetLine1);
    form.setFieldValue("streetLine2", address.streetLine2 || "");
    form.setFieldValue("company", address.company || "");
    form.setFieldValue("city", address.city || "");
    form.setFieldValue("province", address.province || "");
    form.setFieldValue("postalCode", address.postalCode || "");
    form.setFieldValue("countryCode", address.country.code);
    form.setFieldValue("shippingPhoneNumber", address.phoneNumber || "");
  };

  useEffect(() => {
    if (fallbackCountryCode && !form.state.values.countryCode) {
      form.setFieldValue("countryCode", fallbackCountryCode);
    }
  }, [fallbackCountryCode, form]);

  // Save form state to sessionStorage whenever it changes
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      writeSavedCheckoutAddressForm(form.state.values);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-8">
      <CommercePageHero
        eyebrow="Checkout"
        title="Contact and shipping details"
        description="Fill this once and keep moving. The form state is saved in this session until checkout completes."
        icon={<MapPinned className="h-5 w-5" />}
        meta={<CommerceSignal>Step 1 of 3</CommerceSignal>}
      />

      {requiresSignIn ? (
        <StatusPanel
          eyebrow="Checkout access"
          icon={<Lock className="h-5 w-5" />}
          title="Sign in required for checkout"
          description={
            <p>
              NTMS currently blocks guest checkout, so sign in before continuing
              to shipping and payment.
            </p>
          }
          actions={
            <>
              <Button asChild size="sm">
                <Link
                  to="/sign-in"
                  search={{ redirect: "/checkout/addresses" }}
                >
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/register">Create account</Link>
              </Button>
            </>
          }
        />
      ) : null}
      {savedAddresses.length > 0 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,.08)]">
          <div className="mb-4 flex items-center gap-2 text-[#0071e3]">
            <MapPinned className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
              Saved addresses
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {savedAddresses.map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() => applySavedAddress(address)}
                className="rounded-xl border border-black/5 bg-background/55 p-4 text-left text-sm transition hover:border-black/10 hover:bg-[#0071e3]/6"
              >
                <span className="block font-semibold text-foreground">
                  {address.fullName || "Saved address"}
                </span>
                <span className="mt-2 block leading-6 text-foreground/58">
                  {address.streetLine1}
                  {address.city || address.province || address.postalCode
                    ? `, ${[address.city, address.province, address.postalCode]
                        .filter(Boolean)
                        .join(", ")}`
                    : ""}
                </span>
                <span className="mt-1 block text-xs text-foreground/45">
                  {address.country.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(0,0,0,.08)]">
        <h2 className="mb-4 text-lg font-medium text-foreground">
          Contact information
        </h2>
        {error ? (
          <StatusPanel
            variant="destructive"
            title="Unable to save checkout details"
            description={error}
            className="mb-6"
          />
        ) : null}
        <FieldGroup>
          <form.Field
            name="emailAddress"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="email"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <form.Field
              name="firstName"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="given-name"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="lastName"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="family-name"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>
        </FieldGroup>
      </section>

      <section className="rounded-2xl border border-black/5 bg-card/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,.1)]">
        <h2 className="mb-4 text-lg font-medium text-foreground">
          Shipping information
        </h2>

        <FieldGroup>
          <form.Field
            name="fullName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="name"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="company"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Company (optional)</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="organization"
                />
              </Field>
            )}
          />

          <form.Field
            name="streetLine1"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Street address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="address-line1"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="streetLine2"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Apartment, suite, etc. (optional)
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="address-line2"
                />
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
            <form.Field
              name="city"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>City</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="address-level2"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="province"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    State / Province (optional)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="address-level1"
                  />
                </Field>
              )}
            />

            <form.Field
              name="postalCode"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Postal code</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="postal-code"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          <form.Field
            name="countryCode"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {countries.map(
                        (country: {
                          id: string;
                          code: string;
                          name: string;
                        }) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="shippingPhoneNumber"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Phone number (optional)
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="tel"
                />
                <FieldDescription>
                  For delivery notifications and updates
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </section>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={
              !canSubmit ||
              isSubmitting ||
              saveCheckoutAddressMutation.isPending ||
              requiresSignIn
            }
            onClick={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Lock className="h-4 w-4" />
            <span>
              {isSubmitting || saveCheckoutAddressMutation.isPending
                ? "Processing..."
                : "Continue to shipping"}
            </span>
          </Button>
        )}
      </form.Subscribe>
    </div>
  );
}
