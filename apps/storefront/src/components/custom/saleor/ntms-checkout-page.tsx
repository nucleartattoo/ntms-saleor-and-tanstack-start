import {
  CardElement,
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type StripeElementsOptions,
  type StripePaymentElementOptions,
} from "@stripe/stripe-js";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  MapPinned,
  Package2,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  NtmsSaleorCheckout,
  NtmsSaleorOrder,
} from "@/lib/saleor/checkout";
import { encodeNtmsSaleorOrderRouteId } from "@/lib/saleor/route-ids";
import {
  completeSaleorCheckout,
  createSaleorStripePaymentIntent,
  initializeSaleorLegacyStripePayment,
  initializeSaleorPayPalPayment,
  initializeSaleorStripePayment,
  processSaleorPayPalPayment,
  processSaleorStripePayment,
  saveSaleorCheckoutAddress,
  setSaleorCheckoutDeliveryMethod,
} from "./ntms-cart-actions";
import { useSaleorCart } from "./ntms-cart-context";
import {
  isNtmsCheckoutAddressValid,
  type NtmsCheckoutAddressErrors,
  type NtmsCheckoutAddressField,
  type NtmsCheckoutAddressValues,
  ntmsCheckoutSupportedCountries,
  validateNtmsCheckoutAddress,
} from "./ntms-checkout-address";
import { getNtmsSaleorPaymentSessionKey } from "./ntms-checkout-payment-session";
import { NtmsSaleorPromoCode } from "./ntms-promo-code";

type CheckoutFormValues = NtmsCheckoutAddressValues;

type CheckoutOrderPlacedHandler = (order: NtmsSaleorOrder) => Promise<void>;

type PayPalButtonsInstance = {
  close?: () => Promise<void>;
  render: (container: HTMLElement) => Promise<void>;
};

type PayPalSdkWindow = Window & {
  paypal?: {
    Buttons: (options: {
      createOrder: () => Promise<string>;
      onApprove: (data: { orderID?: string }) => Promise<void>;
      onCancel: () => void;
      onError: (error: unknown) => void;
      style?: {
        color?: string;
        height?: number;
        layout?: string;
        shape?: string;
        tagline?: boolean;
      };
    }) => PayPalButtonsInstance;
  };
};

let activeSaleorPayPalSdkPromise: Promise<void> | undefined;
let activeSaleorPayPalSdkSrc: string | undefined;

export function NtmsSaleorCheckoutPage() {
  const navigate = useNavigate();
  const { checkout, clearCartSession, isLoading, syncCheckout } =
    useSaleorCart();
  const [formValues, setFormValues] = useState<CheckoutFormValues>(() =>
    getInitialFormValues(null),
  );
  const [addressErrors, setAddressErrors] = useState<NtmsCheckoutAddressErrors>(
    {},
  );
  const [selectedGatewayId, setSelectedGatewayId] = useState("");
  const addressMutation = useMutation({
    mutationFn: async (values: CheckoutFormValues) => {
      if (!checkout) {
        throw new Error("Cart is empty");
      }

      const result = await saveSaleorCheckoutAddress({
        data: {
          address: {
            city: values.city,
            companyName: values.companyName,
            country: values.country,
            countryArea: values.countryArea,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            postalCode: values.postalCode,
            streetAddress1: values.streetAddress1,
            streetAddress2: values.streetAddress2,
          },
          checkoutId: checkout.id,
          email: values.email,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.checkout;
    },
    onSuccess: (nextCheckout) => {
      syncCheckout(nextCheckout);
      toast.success("Checkout details saved");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save");
    },
  });
  const deliveryMutation = useMutation({
    mutationFn: async (deliveryMethodId: string) => {
      if (!checkout) {
        throw new Error("Cart is empty");
      }

      const result = await setSaleorCheckoutDeliveryMethod({
        data: {
          checkoutId: checkout.id,
          deliveryMethodId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.checkout;
    },
    onSuccess: (nextCheckout) => {
      syncCheckout(nextCheckout);
      toast.success("Delivery method saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to save delivery",
      );
    },
  });
  const handleOrderPlaced = async (order: NtmsSaleorOrder) => {
    clearCartSession();
    toast.success("Order placed");
    await navigate({
      to: "/checkout/confirmation/$code",
      params: { code: encodeNtmsSaleorOrderRouteId(order.id) },
    });
  };
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!checkout) {
        throw new Error("Cart is empty");
      }

      const result = await completeSaleorCheckout({
        data: {
          checkoutId: checkout.id,
          gatewayId: selectedGatewayId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.order;
    },
    onSuccess: handleOrderPlaced,
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to place order",
      );
    },
  });

  useEffect(() => {
    if (checkout) {
      setFormValues(getInitialFormValues(checkout));
    }
  }, [checkout]);

  useEffect(() => {
    if (!checkout || checkout.paymentGateways.length === 0) {
      setSelectedGatewayId("");
      return;
    }

    if (!selectedGatewayId) {
      return;
    }

    const currentGatewayStillAvailable = checkout.paymentGateways.some(
      (gateway) => gateway.id === selectedGatewayId && gateway.supported,
    );
    if (currentGatewayStillAvailable) {
      return;
    }

    setSelectedGatewayId("");
  }, [checkout, selectedGatewayId]);

  const countryOptions = getCheckoutCountryOptions(formValues.country);
  const selectedGateway = checkout?.paymentGateways.find(
    (gateway) => gateway.id === selectedGatewayId,
  );
  const requiresStripeForm =
    selectedGateway?.kind === "stripe" ||
    selectedGateway?.kind === "legacy-stripe";
  const requiresPayPalButtons = selectedGateway?.kind === "paypal";
  const requiresPaymentPanel = requiresStripeForm || requiresPayPalButtons;
  const canPlaceOrder = Boolean(
    checkout?.selectedShippingMethod &&
      checkout.shippingAddress &&
      checkout.billingAddress &&
      selectedGateway?.supported &&
      !requiresPaymentPanel,
  );
  const canUseStripeForm = Boolean(
    checkout?.selectedShippingMethod &&
      checkout.shippingAddress &&
      checkout.billingAddress &&
      requiresStripeForm,
  );
  const canUsePayPalButtons = Boolean(
    checkout?.selectedShippingMethod &&
      checkout.shippingAddress &&
      checkout.billingAddress &&
      requiresPayPalButtons,
  );

  const handleChange =
    (field: keyof CheckoutFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setAddressErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      if (addressMutation.isError) addressMutation.reset();
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateNtmsCheckoutAddress(formValues);
    setAddressErrors(nextErrors);

    if (!isNtmsCheckoutAddressValid(nextErrors)) {
      const firstInvalidField = Object.keys(
        nextErrors,
      )[0] as NtmsCheckoutAddressField;
      requestAnimationFrame(() => {
        const input = document.querySelector<HTMLElement>(
          `[name="${firstInvalidField}"]`,
        );
        input?.focus();
      });
      return;
    }

    addressMutation.mutate(formValues);
  };

  if (isLoading && !checkout) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-10 text-[#1d1d1f]">
        <div className="mx-auto max-w-screen-md">
          <Link
            to="/"
            className="text-sm font-bold tracking-tight text-[#1d1d1f] transition-colors duration-160 hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0071e3]" />
            <p className="mt-3 text-sm font-semibold text-[#6e6e73]">
              Loading checkout...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!checkout || checkout.lines.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-10 text-[#1d1d1f]">
        <div className="mx-auto max-w-screen-md">
          <Link
            to="/"
            className="text-sm font-bold tracking-tight text-[#1d1d1f] transition-colors duration-160 hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#0071e3]">
              <Package2 className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1d1d1f] sm:text-3xl">
              Your bag is empty
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e6e73]">
              Add products before returning to checkout.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]"
              >
                <Link to="/search">Search products</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-black/[0.08] px-6 hover:bg-[#f5f5f7]"
              >
                <Link to="/">Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased"
      data-saleor-checkout-page
    >
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl saturate-150">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-sm font-bold tracking-tight text-[#1d1d1f] transition-colors duration-160 hover:text-[#0071e3]"
          >
            Nuclear Tattoo Supply
          </Link>
          <span className="rounded-full border border-black/[0.06] bg-[#f5f5f7] px-3.5 py-1 text-xs font-semibold tracking-tight text-[#1d1d1f]">
            Secure Checkout
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:px-8">
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-3">
            <CheckoutStepPill
              active
              icon={<MapPinned className="h-4 w-4" />}
              label="Address"
              value={checkout.shippingAddress ? "Saved" : "Required"}
            />
            <CheckoutStepPill
              active={Boolean(checkout.selectedShippingMethod)}
              icon={<Truck className="h-4 w-4" />}
              label="Shipping"
              value={
                checkout.selectedShippingMethod
                  ? checkout.selectedShippingMethod.name
                  : "Select rate"
              }
            />
            <CheckoutStepPill
              active={Boolean(selectedGateway?.supported)}
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment"
              value={selectedGateway?.name ?? "Select method"}
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3.5 border-b border-black/[0.06] px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#0071e3]">
                <MapPinned className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] sm:text-2xl">
                  Delivery details
                </h1>
                <p className="text-xs text-[#6e6e73]">
                  Contact information and studio shipping destination
                </p>
              </div>
            </div>

            <form
              aria-busy={addressMutation.isPending}
              className="p-6"
              data-saleor-checkout-address-form
              noValidate
              onSubmit={handleSubmit}
            >
              {!isNtmsCheckoutAddressValid(addressErrors) ? (
                <p
                  className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
                  data-saleor-checkout-validation-error
                  role="alert"
                >
                  Check the highlighted delivery details before continuing.
                </p>
              ) : null}
              {addressMutation.error ? (
                <p
                  className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
                  data-saleor-checkout-address-error
                  role="alert"
                >
                  {getErrorMessage(
                    addressMutation.error,
                    "Unable to save delivery details. Check the address and try again.",
                  )}
                </p>
              ) : null}
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <CheckoutInput
                  autoComplete="email"
                  error={addressErrors.email}
                  label="Email"
                  name="email"
                  onChange={handleChange("email")}
                  required
                  type="email"
                  value={formValues.email}
                />
                <CheckoutInput
                  autoComplete="tel"
                  error={addressErrors.phone}
                  label="Phone"
                  name="phone"
                  onChange={handleChange("phone")}
                  value={formValues.phone ?? ""}
                />
                <CheckoutInput
                  autoComplete="given-name"
                  error={addressErrors.firstName}
                  label="First name"
                  name="firstName"
                  onChange={handleChange("firstName")}
                  required
                  value={formValues.firstName}
                />
                <CheckoutInput
                  autoComplete="family-name"
                  error={addressErrors.lastName}
                  label="Last name"
                  name="lastName"
                  onChange={handleChange("lastName")}
                  required
                  value={formValues.lastName}
                />
                <CheckoutInput
                  autoComplete="organization"
                  className="sm:col-span-2"
                  label="Company"
                  name="companyName"
                  onChange={handleChange("companyName")}
                  value={formValues.companyName ?? ""}
                />
                <CheckoutInput
                  autoComplete="address-line1"
                  className="sm:col-span-2"
                  error={addressErrors.streetAddress1}
                  label="Street address"
                  name="streetAddress1"
                  onChange={handleChange("streetAddress1")}
                  required
                  value={formValues.streetAddress1}
                />
                <CheckoutInput
                  autoComplete="address-line2"
                  className="sm:col-span-2"
                  label="Apartment, suite, unit"
                  name="streetAddress2"
                  onChange={handleChange("streetAddress2")}
                  value={formValues.streetAddress2 ?? ""}
                />
                <CheckoutInput
                  autoComplete="address-level2"
                  error={addressErrors.city}
                  label="City"
                  name="city"
                  onChange={handleChange("city")}
                  required
                  value={formValues.city}
                />
                <CheckoutInput
                  autoComplete="address-level1"
                  error={addressErrors.countryArea}
                  label={
                    formValues.country === "CA"
                      ? "Province"
                      : "State / Province"
                  }
                  name="countryArea"
                  onChange={handleChange("countryArea")}
                  required={
                    formValues.country === "US" || formValues.country === "CA"
                  }
                  value={formValues.countryArea ?? ""}
                />
                <CheckoutInput
                  autoComplete="postal-code"
                  error={addressErrors.postalCode}
                  label="Postal code"
                  name="postalCode"
                  onChange={handleChange("postalCode")}
                  required
                  value={formValues.postalCode}
                />
                <Field data-invalid={Boolean(addressErrors.country)}>
                  <FieldLabel htmlFor="country">
                    Country
                    <select
                      aria-describedby={
                        addressErrors.country ? "country-error" : undefined
                      }
                      aria-invalid={Boolean(addressErrors.country)}
                      autoComplete="country"
                      className="mt-2 h-11 w-full rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3.5 text-sm text-[#1d1d1f] transition-[border-color,background-color,box-shadow] duration-160 ease-[var(--ease-out)] focus:border-[#0071e3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                      id="country"
                      name="country"
                      onChange={handleChange("country")}
                      required
                      value={formValues.country}
                    >
                      {countryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </FieldLabel>
                  {addressErrors.country ? (
                    <p className="text-sm text-destructive" id="country-error">
                      {addressErrors.country}
                    </p>
                  ) : null}
                </Field>
              </FieldGroup>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
                <p className="text-xs font-medium text-[#6e6e73]">
                  Billing address will match delivery address.
                </p>
                <Button
                  className="rounded-full bg-[#1d1d1f] px-6 text-white transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#333336] active:scale-[0.97]"
                  data-saleor-checkout-save-address
                  disabled={addressMutation.isPending}
                  type="submit"
                >
                  {addressMutation.isPending ? "Saving" : "Save details"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </section>

          <DeliverySection
            checkout={checkout}
            error={deliveryMutation.error}
            isSaving={deliveryMutation.isPending}
            onSelect={(deliveryMethodId) =>
              deliveryMutation.mutate(deliveryMethodId)
            }
          />

          <PaymentSection
            canUsePayPalButtons={canUsePayPalButtons}
            canUseStripeForm={canUseStripeForm}
            checkout={checkout}
            onOrderPlaced={handleOrderPlaced}
            onSelectGateway={setSelectedGatewayId}
            selectedGateway={selectedGateway ?? null}
            selectedGatewayId={selectedGatewayId}
          />
        </div>

        <CheckoutSummary
          canPlaceOrder={canPlaceOrder}
          checkout={checkout}
          error={completeMutation.error}
          isPlacingOrder={completeMutation.isPending}
          onPlaceOrder={() => completeMutation.mutate()}
          requiresPaymentPanel={requiresPaymentPanel}
        />
      </div>
    </main>
  );
}

function DeliverySection({
  checkout,
  error,
  isSaving,
  onSelect,
}: {
  checkout: NtmsSaleorCheckout;
  error: Error | null;
  isSaving: boolean;
  onSelect: (deliveryMethodId: string) => void;
}) {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      data-saleor-checkout-shipping-section
    >
      <div className="flex items-center gap-3.5 border-b border-black/[0.06] px-6 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#0071e3]">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] sm:text-2xl">
            Shipping method
          </h2>
          <p className="text-xs text-[#6e6e73]">
            Select dispatch speed for your studio order
          </p>
        </div>
      </div>
      <div className="space-y-3 p-6">
        {error ? (
          <p
            className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
            data-saleor-checkout-shipping-error
            role="alert"
          >
            {getErrorMessage(
              error,
              "Unable to save that shipping method. Try again.",
            )}
          </p>
        ) : null}
        {checkout.shippingMethods.length > 0 ? (
          checkout.shippingMethods.map((method) => {
            const selected = checkout.selectedShippingMethod?.id === method.id;
            const deliveryEstimate = formatDeliveryEstimate(
              method.minimumDeliveryDays,
              method.maximumDeliveryDays,
            );
            return (
              <button
                className={`w-full rounded-2xl border p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-160 ease-[var(--ease-out)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:transform-none ${
                  selected
                    ? "border-[#0071e3] bg-[#0071e3]/[0.04] shadow-[0_2px_10px_rgba(0,113,227,0.08)] ring-1 ring-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] hover:border-black/[0.14]"
                }`}
                data-saleor-shipping-method-button
                data-saleor-shipping-method-id={method.id}
                data-saleor-shipping-method-selected={
                  selected ? "true" : "false"
                }
                aria-pressed={selected}
                aria-busy={isSaving && selected}
                disabled={isSaving}
                key={method.id}
                onClick={() => onSelect(method.id)}
                type="button"
              >
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-semibold text-[#1d1d1f]">
                      {method.name}
                    </span>
                    {method.description || method.message ? (
                      <span className="mt-1 block text-xs text-[#6e6e73]">
                        {method.description || method.message}
                      </span>
                    ) : null}
                    {deliveryEstimate ? (
                      <span
                        className="mt-1 block text-xs text-[#6e6e73]"
                        data-saleor-shipping-method-delivery
                      >
                        {deliveryEstimate}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-bold text-[#1d1d1f]">
                    {formatSaleorMoney(method.price)}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <p className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">
            Save a delivery address to load shipping methods.
          </p>
        )}
      </div>
    </section>
  );
}

function PaymentSection({
  canUsePayPalButtons,
  canUseStripeForm,
  checkout,
  onOrderPlaced,
  onSelectGateway,
  selectedGateway,
  selectedGatewayId,
}: {
  canUsePayPalButtons: boolean;
  canUseStripeForm: boolean;
  checkout: NtmsSaleorCheckout;
  onOrderPlaced: CheckoutOrderPlacedHandler;
  onSelectGateway: (gatewayId: string) => void;
  selectedGateway: NtmsSaleorCheckout["paymentGateways"][number] | null;
  selectedGatewayId: string;
}) {
  const selectableGateways = checkout.paymentGateways.filter(
    (gateway) => gateway.supported,
  );
  const blockedGatewayCount =
    checkout.paymentGateways.length - selectableGateways.length;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      data-saleor-blocked-payment-gateway-count={blockedGatewayCount}
      data-saleor-checkout-payment-section
    >
      <div className="flex items-center gap-3.5 border-b border-black/[0.06] px-6 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#0071e3]">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] sm:text-2xl">
            Payment method
          </h2>
          <p className="text-xs text-[#6e6e73]">Encrypted payment processing</p>
        </div>
      </div>
      <div className="space-y-3 p-6">
        {selectableGateways.length > 0 ? (
          selectableGateways.map((gateway) => {
            const selected = selectedGatewayId === gateway.id;
            return (
              <button
                className={`w-full rounded-2xl border p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-160 ease-[var(--ease-out)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:transform-none ${
                  selected
                    ? "border-[#0071e3] bg-[#0071e3]/[0.04] shadow-[0_2px_10px_rgba(0,113,227,0.08)] ring-1 ring-[#0071e3]"
                    : "border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] hover:border-black/[0.14]"
                }`}
                data-saleor-payment-gateway-button
                data-saleor-payment-gateway-id={gateway.id}
                data-saleor-payment-gateway-kind={gateway.kind}
                data-saleor-payment-gateway-selected={
                  selected ? "true" : "false"
                }
                data-saleor-payment-gateway-supported={
                  gateway.supported ? "true" : "false"
                }
                aria-pressed={selected}
                key={gateway.id}
                onClick={() => onSelectGateway(gateway.id)}
                type="button"
              >
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-semibold text-[#1d1d1f]">
                      {gateway.name}
                    </span>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      {gateway.currencies.join(", ")}
                    </p>
                  </span>
                  <span className="rounded-full border border-black/[0.06] bg-white px-3 py-1 text-[11px] font-semibold tracking-tight text-[#0071e3]">
                    {gateway.supportLabel}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <p
            className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]"
            data-saleor-payment-unavailable
            role="status"
          >
            {!checkout.selectedShippingMethod
              ? "Save delivery details and select a shipping method to load payment options."
              : "Online payment is not available yet. Your cart is saved; please try again later."}
          </p>
        )}
        {selectedGateway?.kind === "stripe" ? (
          <StripePaymentPanel
            canUseStripeForm={canUseStripeForm}
            checkout={checkout}
            gatewayId={selectedGateway.id}
            onOrderPlaced={onOrderPlaced}
          />
        ) : null}
        {selectedGateway?.kind === "legacy-stripe" ? (
          <LegacyStripePaymentPanel
            canUseStripeForm={canUseStripeForm}
            checkout={checkout}
            gateway={selectedGateway}
            onOrderPlaced={onOrderPlaced}
          />
        ) : null}
        {selectedGateway?.kind === "paypal" ? (
          <PayPalPaymentPanel
            canUsePayPalButtons={canUsePayPalButtons}
            checkout={checkout}
            gatewayId={selectedGateway.id}
            onOrderPlaced={onOrderPlaced}
          />
        ) : null}
      </div>
    </section>
  );
}

function StripePaymentPanel({
  canUseStripeForm,
  checkout,
  gatewayId,
  onOrderPlaced,
}: {
  canUseStripeForm: boolean;
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
}) {
  const paymentSessionKey = getNtmsSaleorPaymentSessionKey(checkout, gatewayId);
  const activePaymentSessionKeyRef = useRef(paymentSessionKey);
  const paymentSessionRequestIdRef = useRef(0);
  const [failedPaymentSessionKey, setFailedPaymentSessionKey] = useState<
    string | null
  >(null);
  const [paymentSession, setPaymentSession] = useState<{
    key: string;
    value: {
      amount: number;
      currency: string;
      publishableKey: string;
    };
  } | null>(null);
  const initializeMutation = useMutation({
    mutationFn: async (variables: {
      checkoutId: string;
      gatewayId: string;
      requestId: number;
      sessionKey: string;
    }) => {
      const result = await initializeSaleorStripePayment({
        data: {
          checkoutId: variables.checkoutId,
          gatewayId: variables.gatewayId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.payment;
    },
    onSuccess: (payment, variables) => {
      if (
        activePaymentSessionKeyRef.current !== variables.sessionKey ||
        paymentSessionRequestIdRef.current !== variables.requestId
      ) {
        return;
      }
      setFailedPaymentSessionKey(null);
      setPaymentSession({ key: variables.sessionKey, value: payment });
    },
    onError: (_error, variables) => {
      if (
        activePaymentSessionKeyRef.current !== variables.sessionKey ||
        paymentSessionRequestIdRef.current !== variables.requestId
      ) {
        return;
      }
      setPaymentSession(null);
      setFailedPaymentSessionKey(variables.sessionKey);
    },
  });

  useEffect(() => {
    activePaymentSessionKeyRef.current = paymentSessionKey;
    const requestId = paymentSessionRequestIdRef.current + 1;
    paymentSessionRequestIdRef.current = requestId;
    setPaymentSession(null);
    setFailedPaymentSessionKey(null);
    if (!canUseStripeForm) {
      return;
    }

    initializeMutation.mutate({
      checkoutId: checkout.id,
      gatewayId,
      requestId,
      sessionKey: paymentSessionKey,
    });
  }, [
    canUseStripeForm,
    checkout.id,
    gatewayId,
    initializeMutation.mutate,
    paymentSessionKey,
  ]);

  if (!canUseStripeForm) {
    return (
      <p className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">
        Save delivery details and select a shipping method before entering card
        details.
      </p>
    );
  }

  if (failedPaymentSessionKey === paymentSessionKey) {
    return (
      <PaymentInitializationError
        onRetry={() => {
          activePaymentSessionKeyRef.current = paymentSessionKey;
          const requestId = paymentSessionRequestIdRef.current + 1;
          paymentSessionRequestIdRef.current = requestId;
          setFailedPaymentSessionKey(null);
          setPaymentSession(null);
          initializeMutation.mutate({
            checkoutId: checkout.id,
            gatewayId,
            requestId,
            sessionKey: paymentSessionKey,
          });
        }}
        message="The secure card form could not be loaded. Try again or choose a different payment method."
      />
    );
  }

  if (
    initializeMutation.isPending ||
    !paymentSession ||
    paymentSession.key !== paymentSessionKey
  ) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm font-semibold text-[#6e6e73]">
        Initializing secure card form
      </div>
    );
  }

  return (
    <StripeElementsForm
      checkout={checkout}
      gatewayId={gatewayId}
      onOrderPlaced={onOrderPlaced}
      paymentSession={paymentSession.value}
    />
  );
}

function PayPalPaymentPanel({
  canUsePayPalButtons,
  checkout,
  gatewayId,
  onOrderPlaced,
}: {
  canUsePayPalButtons: boolean;
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
}) {
  const paymentSessionKey = getNtmsSaleorPaymentSessionKey(checkout, gatewayId);
  const activePaymentSessionKeyRef = useRef(paymentSessionKey);
  const paymentSessionRequestIdRef = useRef(0);
  const [failedPaymentSessionKey, setFailedPaymentSessionKey] = useState<
    string | null
  >(null);
  const [paymentSession, setPaymentSession] = useState<{
    key: string;
    value: {
      clientId: string;
      currency: string;
      environment: string;
      orderId: string;
      transactionId: string;
    };
  } | null>(null);
  const initializeMutation = useMutation({
    mutationFn: async (variables: {
      checkoutId: string;
      gatewayId: string;
      requestId: number;
      sessionKey: string;
    }) => {
      const result = await initializeSaleorPayPalPayment({
        data: {
          checkoutId: variables.checkoutId,
          gatewayId: variables.gatewayId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.payment;
    },
    onSuccess: (payment, variables) => {
      if (
        activePaymentSessionKeyRef.current !== variables.sessionKey ||
        paymentSessionRequestIdRef.current !== variables.requestId
      ) {
        return;
      }
      setFailedPaymentSessionKey(null);
      setPaymentSession({ key: variables.sessionKey, value: payment });
    },
    onError: (_error, variables) => {
      if (
        activePaymentSessionKeyRef.current !== variables.sessionKey ||
        paymentSessionRequestIdRef.current !== variables.requestId
      ) {
        return;
      }
      setPaymentSession(null);
      setFailedPaymentSessionKey(variables.sessionKey);
    },
  });

  useEffect(() => {
    activePaymentSessionKeyRef.current = paymentSessionKey;
    const requestId = paymentSessionRequestIdRef.current + 1;
    paymentSessionRequestIdRef.current = requestId;
    setPaymentSession(null);
    setFailedPaymentSessionKey(null);
    if (!canUsePayPalButtons) {
      return;
    }

    initializeMutation.mutate({
      checkoutId: checkout.id,
      gatewayId,
      requestId,
      sessionKey: paymentSessionKey,
    });
  }, [
    canUsePayPalButtons,
    checkout.id,
    gatewayId,
    initializeMutation.mutate,
    paymentSessionKey,
  ]);

  if (!canUsePayPalButtons) {
    return (
      <p className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">
        Save delivery details and select a shipping method before using PayPal.
      </p>
    );
  }

  if (failedPaymentSessionKey === paymentSessionKey) {
    return (
      <PaymentInitializationError
        onRetry={() => {
          activePaymentSessionKeyRef.current = paymentSessionKey;
          const requestId = paymentSessionRequestIdRef.current + 1;
          paymentSessionRequestIdRef.current = requestId;
          setFailedPaymentSessionKey(null);
          setPaymentSession(null);
          initializeMutation.mutate({
            checkoutId: checkout.id,
            gatewayId,
            requestId,
            sessionKey: paymentSessionKey,
          });
        }}
        message="PayPal Checkout could not be loaded. Try again or choose a different payment method."
      />
    );
  }

  if (
    initializeMutation.isPending ||
    !paymentSession ||
    paymentSession.key !== paymentSessionKey
  ) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm font-semibold text-[#6e6e73]">
        Initializing PayPal Checkout
      </div>
    );
  }

  return (
    <SaleorPayPalButtons
      checkoutId={checkout.id}
      gatewayId={gatewayId}
      onOrderPlaced={onOrderPlaced}
      paymentSession={paymentSession.value}
    />
  );
}

function SaleorPayPalButtons({
  checkoutId,
  gatewayId,
  onOrderPlaced,
  paymentSession,
}: {
  checkoutId: string;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
  paymentSession: {
    clientId: string;
    currency: string;
    environment: string;
    orderId: string;
    transactionId: string;
  };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onOrderPlacedRef = useRef(onOrderPlaced);
  const paypalButtonsRef = useRef<PayPalButtonsInstance | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    onOrderPlacedRef.current = onOrderPlaced;
  }, [onOrderPlaced]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    async function teardown() {
      if (paypalButtonsRef.current?.close) {
        try {
          await paypalButtonsRef.current.close();
        } catch (error) {
          console.error(error);
        }
      }

      paypalButtonsRef.current = null;
      if (container) {
        container.innerHTML = "";
      }
    }

    async function initialize() {
      setIsLoading(true);
      setPaymentError(null);
      await teardown();

      try {
        await loadSaleorPayPalSdk({
          clientId: paymentSession.clientId,
          currencyCode: paymentSession.currency,
        });

        const paypal = (window as PayPalSdkWindow).paypal;
        if (cancelled || !paypal || !container) {
          return;
        }

        const buttons = paypal.Buttons({
          style: {
            color: "gold",
            height: 46,
            layout: "vertical",
            shape: "rect",
            tagline: false,
          },
          createOrder: async () => paymentSession.orderId,
          onApprove: async ({ orderID }) => {
            if (!orderID) {
              throw new Error("PayPal approval did not include an order ID.");
            }
            if (orderID !== paymentSession.orderId) {
              throw new Error("PayPal returned an unexpected order ID.");
            }

            setIsApproving(true);
            setPaymentError(null);
            try {
              const processResult = await processSaleorPayPalPayment({
                data: { transactionId: paymentSession.transactionId },
              });
              if (!processResult.success) {
                throw new Error(processResult.error);
              }

              const completeResult = await completeSaleorCheckout({
                data: {
                  checkoutId,
                  gatewayId,
                },
              });
              if (!completeResult.success) {
                throw new Error(completeResult.error);
              }

              await onOrderPlacedRef.current(completeResult.order);
            } catch (error) {
              setPaymentError(
                error instanceof Error && error.message
                  ? error.message
                  : "PayPal payment failed.",
              );
            } finally {
              setIsApproving(false);
            }
          },
          onCancel: () => {
            setPaymentError(null);
          },
          onError: (error) => {
            console.error(error);
            setPaymentError(
              error instanceof Error && error.message
                ? error.message
                : "PayPal Checkout is currently unavailable.",
            );
          },
        });

        paypalButtonsRef.current = buttons;
        await buttons.render(container);

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPaymentError(
            error instanceof Error && error.message
              ? error.message
              : "Unable to initialize PayPal Checkout.",
          );
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      void teardown();
    };
  }, [
    checkoutId,
    gatewayId,
    paymentSession.clientId,
    paymentSession.currency,
    paymentSession.orderId,
    paymentSession.transactionId,
  ]);

  return (
    <div
      className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4"
      data-saleor-paypal-payment-panel
      data-saleor-paypal-payment-ready={
        !isLoading && !paymentError ? "true" : "false"
      }
    >
      <div className={isApproving ? "pointer-events-none opacity-50" : ""}>
        {isLoading ? (
          <div className="mb-3 rounded-xl border border-black/[0.06] bg-white p-3 text-sm font-semibold text-[#6e6e73] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            Loading PayPal Checkout
          </div>
        ) : null}
        <div ref={containerRef} />
      </div>
      {isApproving ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-3 text-sm font-semibold text-[#6e6e73] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Capturing PayPal payment
        </div>
      ) : null}
      {paymentError ? (
        <p
          className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm leading-6 text-destructive"
          data-saleor-paypal-payment-error
          role="alert"
        >
          {paymentError}
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-[#86868b]">
        PayPal opens a secure approval window and returns to Nuclear Tattoo
        Supply to place the order.
      </p>
    </div>
  );
}

function StripeElementsForm({
  checkout,
  gatewayId,
  onOrderPlaced,
  paymentSession,
}: {
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
  paymentSession: {
    amount: number;
    currency: string;
    publishableKey: string;
  };
}) {
  const stripePromise = useMemo(
    () => loadStripe(paymentSession.publishableKey),
    [paymentSession.publishableKey],
  );
  const options = useMemo<StripeElementsOptions>(
    () => ({
      amount: paymentSession.amount,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#0071e3",
          colorBackground: "#f5f5f7",
          colorText: "#1d1d1f",
          colorDanger: "#ff3b30",
          borderRadius: "12px",
        },
      },
      currency: paymentSession.currency,
      mode: "payment",
    }),
    [paymentSession.amount, paymentSession.currency],
  );

  return (
    <Elements options={options} stripe={stripePromise}>
      <StripeCardForm
        checkout={checkout}
        gatewayId={gatewayId}
        onOrderPlaced={onOrderPlaced}
      />
    </Elements>
  );
}

function LegacyStripePaymentPanel({
  canUseStripeForm,
  checkout,
  gateway,
  onOrderPlaced,
}: {
  canUseStripeForm: boolean;
  checkout: NtmsSaleorCheckout;
  gateway: NtmsSaleorCheckout["paymentGateways"][number];
  onOrderPlaced: CheckoutOrderPlacedHandler;
}) {
  const publishableKey =
    getGatewayConfigValue(gateway, "public_api_key") ??
    getGatewayConfigValue(gateway, "api_key");

  if (!canUseStripeForm) {
    return (
      <p className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">
        Save delivery details and select a shipping method before entering card
        details.
      </p>
    );
  }

  if (!publishableKey) {
    return (
      <p className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4 text-sm leading-6 text-[#6e6e73]">
        Stripe is enabled, but the public key is missing.
      </p>
    );
  }

  return (
    <LegacyStripeElementsForm
      checkout={checkout}
      gatewayId={gateway.id}
      onOrderPlaced={onOrderPlaced}
      publishableKey={publishableKey}
    />
  );
}

function LegacyStripeElementsForm({
  checkout,
  gatewayId,
  onOrderPlaced,
  publishableKey,
}: {
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
  publishableKey: string;
}) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  return (
    <Elements stripe={stripePromise}>
      <LegacyStripeCardForm
        checkout={checkout}
        gatewayId={gatewayId}
        onOrderPlaced={onOrderPlaced}
      />
    </Elements>
  );
}

function LegacyStripeCardForm({
  checkout,
  gatewayId,
  onOrderPlaced,
}: {
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
}) {
  const elements = useElements();
  const stripe = useStripe();
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!stripe || !elements) {
        throw new Error("Stripe card form is not ready");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Stripe card form is not ready");
      }

      const initializeResult = await initializeSaleorLegacyStripePayment({
        data: {
          checkoutId: checkout.id,
          gatewayId,
        },
      });

      if (!initializeResult.success) {
        throw new Error(initializeResult.error);
      }

      const billingAddress =
        checkout.billingAddress ?? checkout.shippingAddress;
      const paymentResult = await stripe.confirmCardPayment(
        initializeResult.payment.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              address: {
                city: billingAddress?.city ?? "",
                country: billingAddress?.countryCode ?? "US",
                line1: billingAddress?.streetAddress1 ?? "",
                line2: billingAddress?.streetAddress2 ?? "",
                postal_code: billingAddress?.postalCode ?? "",
                state: billingAddress?.countryArea ?? "",
              },
              email: checkout.email,
              name: `${billingAddress?.firstName ?? ""} ${
                billingAddress?.lastName ?? ""
              }`.trim(),
              phone: billingAddress?.phone || undefined,
            },
          },
        },
      );

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message ?? "Stripe payment failed");
      }

      const completeResult = await completeSaleorCheckout({
        data: {
          checkoutId: checkout.id,
          gatewayId,
        },
      });

      if (!completeResult.success) {
        throw new Error(completeResult.error);
      }

      return completeResult.order;
    },
    onSuccess: onOrderPlaced,
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to place order",
      );
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || completeMutation.isPending) {
      return;
    }

    completeMutation.mutate();
  };

  return (
    <form
      className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4"
      data-saleor-legacy-stripe-payment-form
      onSubmit={handleSubmit}
    >
      <div className="rounded-xl border border-black/[0.06] bg-white p-3.5">
        <CardElement options={legacyStripeCardElementOptions} />
      </div>
      <Button
        className="mt-4 h-11 w-full gap-2 rounded-full bg-[#0071e3] font-semibold text-white transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#0077ed] active:scale-[0.98]"
        disabled={!stripe || !elements || completeMutation.isPending}
        type="submit"
      >
        {completeMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {completeMutation.isPending ? "Placing order" : "Pay by card"}
      </Button>
    </form>
  );
}

function StripeCardForm({
  checkout,
  gatewayId,
  onOrderPlaced,
}: {
  checkout: NtmsSaleorCheckout;
  gatewayId: string;
  onOrderPlaced: CheckoutOrderPlacedHandler;
}) {
  const elements = useElements();
  const stripe = useStripe();
  const createIntentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const result = await createSaleorStripePaymentIntent({
        data: {
          checkoutId: checkout.id,
          gatewayId,
          paymentMethodId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.payment;
    },
  });
  const processMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const result = await processSaleorStripePayment({
        data: {
          transactionId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }
    },
  });
  const completeMutation = useMutation({
    mutationFn: async () => {
      const result = await completeSaleorCheckout({
        data: {
          checkoutId: checkout.id,
          gatewayId,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.order;
    },
    onSuccess: onOrderPlaced,
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to place order",
      );
    },
  });
  const isSubmitting =
    createIntentMutation.isPending ||
    processMutation.isPending ||
    completeMutation.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) {
      return;
    }

    const submitResult = await elements.submit();
    if (submitResult.error) {
      toast.error(submitResult.error.message ?? "Card details are incomplete");
      return;
    }
    if (!submitResult.selectedPaymentMethod) {
      toast.error("Stripe did not return a payment method");
      return;
    }

    let paymentIntent:
      | {
          clientSecret: string;
          transactionId: string;
        }
      | undefined;
    try {
      paymentIntent = await createIntentMutation.mutateAsync(
        submitResult.selectedPaymentMethod,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create Stripe payment",
      );
      return;
    }

    const billingAddress = checkout.billingAddress ?? checkout.shippingAddress;
    const paymentResult = await stripe.confirmPayment({
      elements,
      clientSecret: paymentIntent.clientSecret,
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: {
            address: {
              city: billingAddress?.city ?? "",
              country: billingAddress?.countryCode ?? "US",
              line1: billingAddress?.streetAddress1 ?? "",
              line2: billingAddress?.streetAddress2 ?? "",
              postal_code: billingAddress?.postalCode ?? "",
              state: billingAddress?.countryArea ?? "",
            },
            email: checkout.email,
            name: `${billingAddress?.firstName ?? ""} ${
              billingAddress?.lastName ?? ""
            }`.trim(),
            phone: billingAddress?.phone || undefined,
          },
        },
      },
      redirect: "if_required",
    });

    if (paymentResult.error) {
      toast.error(paymentResult.error.message ?? "Stripe payment failed");
      return;
    }

    try {
      await processMutation.mutateAsync(paymentIntent.transactionId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to process Stripe payment",
      );
      return;
    }

    completeMutation.mutate();
  };

  return (
    <form
      className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-4"
      data-saleor-stripe-payment-form
      onSubmit={handleSubmit}
    >
      <PaymentElement options={stripePaymentElementOptions} />
      <Button
        className="mt-4 h-11 w-full gap-2 rounded-full bg-[#0071e3] font-semibold text-white transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#0077ed] active:scale-[0.98]"
        disabled={!stripe || !elements || isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {isSubmitting ? "Placing order" : "Pay by card"}
      </Button>
    </form>
  );
}

function loadSaleorPayPalSdk({
  clientId,
  currencyCode,
}: {
  clientId: string;
  currencyCode: string;
}) {
  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
    clientId,
  )}&components=buttons&currency=${encodeURIComponent(currencyCode)}&intent=capture`;

  if (
    (window as PayPalSdkWindow).paypal &&
    activeSaleorPayPalSdkSrc === sdkSrc &&
    activeSaleorPayPalSdkPromise
  ) {
    return activeSaleorPayPalSdkPromise;
  }

  if (activeSaleorPayPalSdkSrc !== sdkSrc) {
    document
      .querySelectorAll('script[data-paypal-sdk="true"]')
      .forEach((element) => {
        element.remove();
      });
    (window as PayPalSdkWindow).paypal = undefined;
    activeSaleorPayPalSdkPromise = undefined;
  }

  activeSaleorPayPalSdkSrc = sdkSrc;
  activeSaleorPayPalSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onerror = () =>
      reject(new Error("Failed to load the PayPal JavaScript SDK."));
    script.onload = () => resolve();
    script.src = sdkSrc;
    document.head.appendChild(script);
  });

  return activeSaleorPayPalSdkPromise;
}

function PaymentInitializationError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4"
      data-saleor-payment-initialization-error
      role="alert"
    >
      <p className="text-sm leading-6 text-[#1d1d1f]/80">{message}</p>
      <Button
        className="mt-3 gap-2 rounded-full"
        data-saleor-retry-payment-initialization
        onClick={onRetry}
        type="button"
        variant="outline"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function CheckoutSummary({
  canPlaceOrder,
  checkout,
  error,
  isPlacingOrder,
  onPlaceOrder,
  requiresPaymentPanel,
}: {
  canPlaceOrder: boolean;
  checkout: NtmsSaleorCheckout;
  error: Error | null;
  isPlacingOrder: boolean;
  onPlaceOrder: () => void;
  requiresPaymentPanel: boolean;
}) {
  return (
    <aside className="sticky top-20 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
        <p className="text-base font-bold tracking-tight text-[#1d1d1f]">
          Order summary
        </p>
        <h2 className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold tracking-tight text-[#6e6e73]">
          {checkout.quantity} item{checkout.quantity === 1 ? "" : "s"}
        </h2>
      </div>
      <ul className="max-h-[42vh] space-y-3 overflow-auto p-6">
        {checkout.lines.map((line) => (
          <li className="flex gap-3.5" key={line.id}>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f5f5f7]">
              {line.imageUrl ? (
                <img
                  alt={line.imageAlt}
                  className="h-full w-full object-contain p-1.5"
                  src={line.imageUrl}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-[#1d1d1f]">
                {line.productName}
              </p>
              <p className="mt-1 text-xs text-[#86868b]">Qty {line.quantity}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#1d1d1f]">
              {formatSaleorMoney(line.totalPrice)}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-black/[0.06] p-6">
        <div className="mb-5">
          <NtmsSaleorPromoCode />
        </div>
        <SummaryRow label="Subtotal" price={checkout.originalSubtotalPrice} />
        {checkout.automaticDiscountPrice.amount > 0 ? (
          <SummaryRow
            discount
            label="Automatic quantity discount"
            price={checkout.automaticDiscountPrice}
          />
        ) : null}
        {checkout.discountPrice.amount > 0 ? (
          <SummaryRow
            discount
            label={checkout.discountName || "Discount"}
            price={checkout.discountPrice}
          />
        ) : null}
        <SummaryRow label="Shipping" price={checkout.shippingPrice} />
        <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-4">
          <p className="font-semibold text-[#1d1d1f]">Total</p>
          <p className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            {formatSaleorMoney(checkout.totalPrice)}
          </p>
        </div>
        <Button
          aria-busy={isPlacingOrder}
          className="mt-5 h-12 w-full gap-2 rounded-full bg-[#0071e3] text-base font-semibold text-white shadow-[0_4px_14px_rgba(0,113,227,0.28)] transition-[transform,background-color,box-shadow] duration-160 ease-[var(--ease-out)] hover:bg-[#0077ed] hover:shadow-[0_6px_20px_rgba(0,113,227,0.36)] active:scale-[0.98]"
          data-saleor-place-order-button
          disabled={!canPlaceOrder || isPlacingOrder}
          onClick={onPlaceOrder}
          type="button"
        >
          {isPlacingOrder ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {isPlacingOrder ? "Placing order" : "Place order"}
        </Button>
        {error ? (
          <p
            className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm leading-6 text-destructive"
            data-saleor-checkout-completion-error
            role="alert"
          >
            {getErrorMessage(
              error,
              "Unable to place the order. Review the checkout details and try again.",
            )}
          </p>
        ) : null}
        {!canPlaceOrder ? (
          <p className="mt-3 text-xs leading-5 text-[#86868b]">
            {requiresPaymentPanel
              ? "Complete the selected payment method above to place the order."
              : !checkout.shippingAddress || !checkout.selectedShippingMethod
                ? "Save delivery details and select a shipping method before placing the order."
                : "Select a payment method before placing the order."}
          </p>
        ) : (
          <p className="mt-3 text-xs leading-5 text-[#86868b]">
            Payment will be handled by the configured Saleor gateway.
          </p>
        )}
      </div>
    </aside>
  );
}

const stripePaymentElementOptions: StripePaymentElementOptions = {
  layout: "tabs",
  fields: {
    billingDetails: "never",
  },
};

const legacyStripeCardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      "::placeholder": {
        color: "#86868b",
      },
      color: "#1d1d1f",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
      fontSize: "16px",
      iconColor: "#0071e3",
    },
    invalid: {
      color: "#ff3b30",
      iconColor: "#ff3b30",
    },
  },
};

function getGatewayConfigValue(
  gateway: NtmsSaleorCheckout["paymentGateways"][number],
  field: string,
) {
  return gateway.config.find((item) => item.field === field)?.value?.trim();
}

function CheckoutStepPill({
  active,
  icon,
  label,
  value,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 ${
        active
          ? "border-[#0071e3]/30 bg-[#0071e3]/[0.04] shadow-[0_2px_10px_rgba(0,113,227,0.06)]"
          : "border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      }`}
    >
      <div className="flex items-center gap-2 text-[#0071e3]">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-[#1d1d1f]">
        {value}
      </p>
    </div>
  );
}

function CheckoutInput({
  className,
  error,
  label,
  ...props
}: React.ComponentProps<typeof Input> & {
  error?: string;
  label: string;
}) {
  const inputId = props.id ?? props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <Field className={className} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        {...props}
        aria-describedby={error ? errorId : props["aria-describedby"]}
        aria-invalid={Boolean(error)}
        className="mt-2 h-11 rounded-xl border-black/[0.08] bg-[#f5f5f7] text-[#1d1d1f] transition-[background-color,border-color,box-shadow] duration-160 focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
        id={inputId}
      />
      {error ? (
        <p className="text-sm text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </Field>
  );
}

function SummaryRow({
  discount = false,
  label,
  price,
}: {
  discount?: boolean;
  label: string;
  price: { amount: number; currency: string };
}) {
  return (
    <div className="mb-2 flex items-center justify-between text-sm text-[#6e6e73]">
      <p>{label}</p>
      <p
        className={
          discount
            ? "font-semibold text-emerald-600"
            : "font-medium text-[#1d1d1f]"
        }
      >
        {discount ? "-" : ""}
        {formatSaleorMoney(price)}
      </p>
    </div>
  );
}

function getInitialFormValues(
  checkout: NtmsSaleorCheckout | null,
): CheckoutFormValues {
  const address = checkout?.shippingAddress;

  return {
    email: checkout?.email ?? "",
    firstName: address?.firstName ?? "",
    lastName: address?.lastName ?? "",
    companyName: address?.companyName ?? "",
    streetAddress1: address?.streetAddress1 ?? "",
    streetAddress2: address?.streetAddress2 ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.countryCode ?? "US",
    countryArea: address?.countryArea ?? "",
    phone: address?.phone ?? "",
  };
}

function getCheckoutCountryOptions(selectedCountryCode: string) {
  if (
    !selectedCountryCode ||
    ntmsCheckoutSupportedCountries.some(
      (country) => country.code === selectedCountryCode,
    )
  ) {
    return ntmsCheckoutSupportedCountries;
  }

  return [
    { code: selectedCountryCode, name: selectedCountryCode },
    ...ntmsCheckoutSupportedCountries,
  ];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}

function formatDeliveryEstimate(
  minimumDeliveryDays: number | null,
  maximumDeliveryDays: number | null,
) {
  const minimum = Number.isInteger(minimumDeliveryDays)
    ? minimumDeliveryDays
    : null;
  const maximum = Number.isInteger(maximumDeliveryDays)
    ? maximumDeliveryDays
    : null;
  if (minimum === null && maximum === null) return null;

  if (minimum !== null && maximum !== null) {
    if (minimum === maximum) {
      return `Estimated delivery: ${minimum} business ${minimum === 1 ? "day" : "days"}`;
    }
    return `Estimated delivery: ${minimum}-${maximum} business days`;
  }
  if (minimum !== null) return `Estimated delivery: ${minimum}+ business days`;
  return `Estimated delivery: within ${maximum} business days`;
}
