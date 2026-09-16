import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { CustomerSettingsForm } from "@/components/custom/account/customer-settings-form";
import { EmailChangeForm } from "@/components/custom/account/email-change-form";
import {
  CommercePageHero,
  CommerceSignal,
} from "@/components/custom/layout/commerce-surface";
import {
  activeCustomerQueryOptions,
  useActiveCustomer,
} from "@/hooks/use-active-customer";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_account/account/settings")({
  loader: async ({ context }) => {
    const activeCustomer = await context.queryClient.ensureQueryData(
      activeCustomerQueryOptions(),
    );

    return { activeCustomer };
  },
  head: () => ({
    meta: createBasicMeta(
      "Account Settings",
      "Manage your account settings. Update your personal information, contact details, and account preferences.",
      true,
    ),
  }),
  component: AccountSettingsComponent,
});

function AccountSettingsComponent() {
  const { activeCustomer: loaderCustomer } = Route.useLoaderData();
  const activeCustomerQuery = useActiveCustomer();
  const activeCustomer = activeCustomerQuery.data ?? loaderCustomer;

  return (
    <div className="space-y-6 py-4">
      <CommercePageHero
        eyebrow="Account"
        title="Account settings"
        description="Update your personal information and account preferences."
        icon={<Settings2 className="h-5 w-5" />}
        meta={
          <CommerceSignal icon={<Settings2 className="h-4 w-4" />}>
            Profile
          </CommerceSignal>
        }
      />

      <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/5 px-6 py-5">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            Personal information
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground/55">
            Update your personal details below.
          </p>
        </div>
        <div className="px-6 py-6">
          <CustomerSettingsForm customer={activeCustomer} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/5 px-6 py-5">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            Email address
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground/55">
            Request a verified email change for this customer account.
          </p>
        </div>
        <div className="px-6 py-6">
          <EmailChangeForm customer={activeCustomer} />
        </div>
      </section>
    </div>
  );
}
