import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { useSetCheckoutShippingMethodMutation } from "@/hooks/use-checkout-mutations";
import { useEligibleShippingMethods } from "@/hooks/use-checkout-options";

const formSchema = z.object({
  shippingMethodId: z.string().min(1, "Please select a shipping method"),
});

export function Shipping() {
  const router = useRouter();
  const setShippingMethodMutation = useSetCheckoutShippingMethodMutation();
  const shippingMethodsQuery = useEligibleShippingMethods();
  const shippingMethods = shippingMethodsQuery.data ?? [];
  const error = setShippingMethodMutation.error?.message;

  const form = useForm({
    defaultValues: {
      shippingMethodId: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await setShippingMethodMutation.mutateAsync(value.shippingMethodId);

        router.navigate({
          to: "/checkout/$step",
          params: { step: "payment" },
        });
      } catch {
        // Mutation state renders the error.
      }
    },
  });

  // Auto-select first method if only one available
  useEffect(() => {
    if (shippingMethods.length === 1 && !form.state.values.shippingMethodId) {
      form.setFieldValue("shippingMethodId", shippingMethods[0].id);
    }
  }, [shippingMethods, form]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price / 100);
  };

  const hero = (
    <CommercePageHero
      eyebrow="Checkout"
      title="Shipping method"
      description="Choose the carrier and speed that fit this order."
      icon={<Truck className="h-5 w-5" />}
      meta={
        <CommerceSignal icon={<Truck className="h-4 w-4" />}>
          Step 2 of 3
        </CommerceSignal>
      }
    />
  );

  return (
    <div className="space-y-8">
      {hero}

      {shippingMethodsQuery.isLoading ? (
        <StatusPanel
          title="Loading shipping methods"
          description="We are fetching the eligible shipping options for this order."
          testId="shipping-methods-loading"
        />
      ) : (error || shippingMethodsQuery.isError) &&
        shippingMethods.length === 0 ? (
        <StatusPanel
          variant="destructive"
          title="Failed to load shipping methods"
          description={
            error || "We could not fetch the eligible shipping methods."
          }
          testId="shipping-methods-error"
          actions={
            <Button
              variant="outline"
              onClick={() =>
                router.navigate({
                  to: "/checkout/$step",
                  params: { step: "addresses" },
                })
              }
            >
              Go back
            </Button>
          }
        />
      ) : (
        <>
          {error ? (
            <StatusPanel
              variant="destructive"
              title="Shipping method refresh failed"
              description={error}
            />
          ) : null}

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(0,0,0,.08)]">
            <form.Field
              name="shippingMethodId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <FieldSet>
                    <div className="space-y-4">
                      {shippingMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex cursor-pointer items-start rounded-2xl border p-6 transition-all ${
                            field.state.value === method.id
                              ? "border-black/10/24 bg-[#0071e3]/6 shadow-[0_14px_30px_rgba(0,0,0,.06)]"
                              : "border-black/5 bg-background/58 hover:border-black/10 hover:bg-[#0071e3]/3"
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.name}
                            value={method.id}
                            checked={field.state.value === method.id}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            aria-invalid={isInvalid}
                            className="mt-1 h-4 w-4 border-black/15 text-[#1d1d1f] focus:ring-[color:var(--apple-blue)]/35"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <FieldLabel className="cursor-pointer font-medium text-foreground">
                                  {method.name}
                                </FieldLabel>
                                {method.description && (
                                  <FieldDescription className="mt-1">
                                    {method.description}
                                  </FieldDescription>
                                )}
                              </div>
                              <span className="shrink-0 font-semibold text-foreground">
                                {formatPrice(method.priceWithTax)}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </FieldSet>
                );
              }}
            />
          </section>

          <div className="flex items-center justify-between border-t border-black/5 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.navigate({
                  to: "/checkout/$step",
                  params: { step: "addresses" },
                })
              }
              disabled={setShippingMethodMutation.isPending}
            >
              Back
            </Button>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
                  disabled={
                    !canSubmit ||
                    isSubmitting ||
                    setShippingMethodMutation.isPending
                  }
                  size="lg"
                >
                  {isSubmitting || setShippingMethodMutation.isPending
                    ? "Processing..."
                    : "Continue to payment"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </>
      )}
    </div>
  );
}
