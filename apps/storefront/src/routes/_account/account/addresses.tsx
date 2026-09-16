import { createFileRoute } from "@tanstack/react-router";
import { AddressBook } from "@/components/custom/account/address-book";
import { clientEnv } from "@/env/client";
import {
  activeCustomerQueryOptions,
  useActiveCustomer,
} from "@/hooks/use-active-customer";
import { createBasicMeta } from "@/lib/metadata";

export const Route = createFileRoute("/_account/account/addresses")({
  loader: async ({ context }) => {
    const activeCustomer = await context.queryClient.ensureQueryData(
      activeCustomerQueryOptions(),
    );

    return { activeCustomer };
  },
  head: () => ({
    meta: createBasicMeta(
      "Address Book",
      `Manage saved shipping and billing addresses for your ${clientEnv.VITE_SITE_NAME} account.`,
      true,
    ),
  }),
  component: AccountAddressesComponent,
});

function AccountAddressesComponent() {
  const { activeCustomer: loaderCustomer } = Route.useLoaderData();
  const activeCustomerQuery = useActiveCustomer();
  const activeCustomer = activeCustomerQuery.data ?? loaderCustomer;

  return (
    <div className="py-4">
      <AddressBook customer={activeCustomer} />
    </div>
  );
}
