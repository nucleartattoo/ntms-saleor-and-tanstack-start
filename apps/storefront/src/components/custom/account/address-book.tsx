import { useForm } from "@tanstack/react-form";
import { MapPinned, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { LoaderButton } from "@/components/custom/loader-button";
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
import {
  useCreateCustomerAddressMutation,
  useDeleteCustomerAddressMutation,
  useUpdateCustomerAddressMutation,
} from "@/hooks/use-account-mutations";
import { useAvailableCountries } from "@/hooks/use-checkout-options";
import type {
  AccountAddress,
  AccountAddressInput,
  AccountCustomer,
} from "@/lib/account-types";
import { cn } from "@/lib/utils";

type AddressFormMode = "create" | "edit";
type AddressTextFieldName = Exclude<
  keyof AddressFormValues,
  "defaultBillingAddress" | "defaultShippingAddress"
>;
type AddressCheckboxFieldName =
  | "defaultBillingAddress"
  | "defaultShippingAddress";

type AddressFormValues = {
  fullName: string;
  company: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
  phoneNumber: string;
  defaultShippingAddress: boolean;
  defaultBillingAddress: boolean;
};

const addressFormSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required."),
    company: z.string(),
    streetLine1: z.string().min(3, "Street address is required."),
    streetLine2: z.string(),
    city: z.string().min(2, "City is required."),
    province: z.string(),
    postalCode: z.string().min(3, "Postal code is required."),
    countryCode: z.string().min(1, "Country is required."),
    phoneNumber: z.string(),
    defaultShippingAddress: z.boolean(),
    defaultBillingAddress: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      (value.countryCode === "US" || value.countryCode === "CA") &&
      !value.province.trim()
    ) {
      context.addIssue({
        code: "custom",
        message: "State / Province is required for US and Canada.",
        path: ["province"],
      });
    }
  });

function getAddressDefaults(
  address: AccountAddress | null,
  fallbackCountryCode: string,
): AddressFormValues {
  return {
    fullName: address?.fullName || "",
    company: address?.company || "",
    streetLine1: address?.streetLine1 || "",
    streetLine2: address?.streetLine2 || "",
    city: address?.city || "",
    province: address?.province || "",
    postalCode: address?.postalCode || "",
    countryCode: address?.country.code || fallbackCountryCode,
    phoneNumber: address?.phoneNumber || "",
    defaultShippingAddress: Boolean(address?.defaultShippingAddress),
    defaultBillingAddress: Boolean(address?.defaultBillingAddress),
  };
}

function toAddressInput(values: AddressFormValues): AccountAddressInput {
  return {
    fullName: values.fullName,
    company: values.company,
    streetLine1: values.streetLine1,
    streetLine2: values.streetLine2,
    city: values.city,
    province: values.province,
    postalCode: values.postalCode,
    countryCode: values.countryCode,
    phoneNumber: values.phoneNumber,
    defaultShippingAddress: values.defaultShippingAddress,
    defaultBillingAddress: values.defaultBillingAddress,
  };
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

export function AddressBook({
  customer,
}: {
  customer: AccountCustomer | null;
}) {
  const [formState, setFormState] = useState<{
    mode: AddressFormMode;
    address: AccountAddress | null;
  } | null>(null);
  const deleteAddressMutation = useDeleteCustomerAddressMutation();
  const addresses = useMemo(
    () =>
      customer?.addresses
        ?.map((address) => address)
        .sort((first, second) => {
          const firstDefault =
            Number(Boolean(first.defaultShippingAddress)) +
            Number(Boolean(first.defaultBillingAddress));
          const secondDefault =
            Number(Boolean(second.defaultShippingAddress)) +
            Number(Boolean(second.defaultBillingAddress));

          return secondDefault - firstDefault;
        }) ?? [],
    [customer],
  );

  const handleDelete = async (address: AccountAddress) => {
    try {
      await deleteAddressMutation.mutateAsync(address.id);
      toast.success("Address deleted");
      if (formState?.address?.id === address.id) {
        setFormState(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error deleting address",
      );
    }
  };

  return (
    <div className="space-y-6">
      <CommercePageHero
        eyebrow="Address book"
        title="Saved addresses"
        description="Manage shipping and billing addresses attached to your customer account."
        icon={<MapPinned className="h-5 w-5" />}
        meta={<CommerceSignal>{addresses.length} saved</CommerceSignal>}
        actions={
          <Button
            type="button"
            onClick={() => setFormState({ mode: "create", address: null })}
          >
            <Plus className="h-4 w-4" />
            Add address
          </Button>
        }
      />

      {formState ? (
        <AddressForm
          address={formState.address}
          mode={formState.mode}
          onCancel={() => setFormState(null)}
          onSaved={() => setFormState(null)}
        />
      ) : null}

      {addresses.length === 0 && !formState ? (
        <StatusPanel
          icon={<MapPinned className="h-5 w-5" />}
          title="No saved addresses"
          description="Add a default shipping or billing address to speed up checkout."
          actions={
            <Button
              type="button"
              onClick={() => setFormState({ mode: "create", address: null })}
            >
              <Plus className="h-4 w-4" />
              Add address
            </Button>
          }
        />
      ) : null}

      {addresses.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              deleting={deleteAddressMutation.isPending}
              editing={formState?.address?.id === address.id}
              onDelete={() => handleDelete(address)}
              onEdit={() => setFormState({ mode: "edit", address })}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function AddressCard({
  address,
  deleting,
  editing,
  onDelete,
  onEdit,
}: {
  address: AccountAddress;
  deleting: boolean;
  editing: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition hover:border-black/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
        editing && "border-[#0071e3] ring-1 ring-[#0071e3]/20 bg-[#f5f5f7]/30",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {address.defaultShippingAddress ? (
              <AddressBadge>Default shipping</AddressBadge>
            ) : null}
            {address.defaultBillingAddress ? (
              <AddressBadge>Default billing</AddressBadge>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-semibold text-[#1d1d1f]">
            {address.fullName || "Saved address"}
          </h2>
          {address.company ? (
            <p className="mt-1 text-sm text-[#86868b]">{address.company}</p>
          ) : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-[#f5f5f7] text-[#0071e3]">
          <MapPinned className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm leading-6 text-foreground/68">
        <p>{address.streetLine1}</p>
        {address.streetLine2 ? <p>{address.streetLine2}</p> : null}
        <p>
          {[address.city, address.province, address.postalCode]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>{address.country.name}</p>
        {address.phoneNumber ? (
          <p className="pt-1 text-foreground/52">{address.phoneNumber}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </article>
  );
}

function AddressBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0071e3]/20 bg-[#0071e3]/10 px-2.5 py-1 text-xs font-semibold text-[#0071e3]">
      <Star className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function AddressForm({
  address,
  mode,
  onCancel,
  onSaved,
}: {
  address: AccountAddress | null;
  mode: AddressFormMode;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const countriesQuery = useAvailableCountries();
  const countries = countriesQuery.data ?? [];
  const createAddressMutation = useCreateCustomerAddressMutation();
  const updateAddressMutation = useUpdateCustomerAddressMutation();
  const fallbackCountryCode = getPreferredCountryCode(countries);
  const defaultValues = useMemo(
    () => getAddressDefaults(address, fallbackCountryCode),
    [address, fallbackCountryCode],
  );
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: addressFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const input = toAddressInput(value);

        if (mode === "edit" && address) {
          await updateAddressMutation.mutateAsync({
            id: address.id,
            ...input,
          });
          toast.success("Address updated");
        } else {
          await createAddressMutation.mutateAsync(input);
          toast.success("Address created");
        }

        onSaved();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error saving address",
        );
      }
    },
  });
  const isSaving =
    createAddressMutation.isPending || updateAddressMutation.isPending;
  const error =
    createAddressMutation.error?.message ||
    updateAddressMutation.error?.message;
  const renderTextField = ({
    autoComplete,
    label,
    name,
    required = false,
    type = "text",
  }: {
    autoComplete?: string;
    label: string;
    name: AddressTextFieldName;
    required?: boolean;
    type?: string;
  }) => (
    <form.Field
      name={name}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched &&
          (!field.state.meta.isValid ||
            (required && !String(field.state.value).trim()));

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type={type}
              value={String(field.state.value)}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={isInvalid}
              autoComplete={autoComplete}
            />
            {required ? (
              <FieldDescription>
                Required for saving addresses.
              </FieldDescription>
            ) : null}
            {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
          </Field>
        );
      }}
    />
  );
  const renderCheckboxField = ({
    label,
    name,
  }: {
    label: string;
    name: AddressCheckboxFieldName;
  }) => (
    <form.Field
      name={name}
      children={(field) => (
        <label className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 px-3.5 py-3 text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(field.state.value)}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-[#0071e3] accent-[#0071e3]"
          />
          {label}
        </label>
      )}
    />
  );

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
            {mode === "edit" ? "Edit address" : "New address"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">
            {mode === "edit" ? "Update saved address" : "Add saved address"}
          </h2>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <StatusPanel
          variant="destructive"
          size="compact"
          title="Address update failed"
          description={error}
          className="mb-6"
        />
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {renderTextField({
              name: "fullName",
              label: "Full name",
              required: true,
              autoComplete: "name",
            })}
            {renderTextField({
              name: "company",
              label: "Company",
              autoComplete: "organization",
            })}
          </div>
          {renderTextField({
            name: "streetLine1",
            label: "Street address",
            required: true,
            autoComplete: "address-line1",
          })}
          {renderTextField({
            name: "streetLine2",
            label: "Apartment, suite, etc.",
            autoComplete: "address-line2",
          })}
          <div className="grid gap-5 sm:grid-cols-3">
            {renderTextField({
              name: "city",
              label: "City",
              required: true,
              autoComplete: "address-level2",
            })}
            {renderTextField({
              name: "province",
              label: "State / Province",
              autoComplete: "address-level1",
            })}
            {renderTextField({
              name: "postalCode",
              label: "Postal code",
              required: true,
              autoComplete: "postal-code",
            })}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
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
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            />
            {renderTextField({
              name: "phoneNumber",
              label: "Phone number",
              autoComplete: "tel",
              type: "tel",
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCheckboxField({
              name: "defaultShippingAddress",
              label: "Default shipping address",
            })}
            {renderCheckboxField({
              name: "defaultBillingAddress",
              label: "Default billing address",
            })}
          </div>
        </FieldGroup>

        <div className="flex flex-wrap gap-3">
          <LoaderButton loading={isSaving} type="submit">
            {mode === "edit" ? "Save address" : "Create address"}
          </LoaderButton>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
