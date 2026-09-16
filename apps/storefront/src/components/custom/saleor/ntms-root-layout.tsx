import { Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/custom/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { NtmsSaleorCategory } from "@/lib/saleor/catalog";
import type { SaleorChannelConfig } from "@/lib/saleor/channels";
import { SaleorCartProvider } from "./ntms-cart-context";
import { NtmsSaleorCartDrawer } from "./ntms-cart-drawer";
import { NtmsChannelProvider } from "./ntms-channel-context";
import { NtmsSaleorShell } from "./ntms-shell";

export default function NtmsSaleorRootLayout({
  categories,
  initialChannel,
}: {
  categories: NtmsSaleorCategory[];
  initialChannel?: SaleorChannelConfig;
}) {
  return (
    <ThemeProvider>
      <NtmsChannelProvider initialChannel={initialChannel}>
        <SaleorCartProvider>
          <NtmsSaleorShell categories={categories}>
            <Outlet />
            <NtmsSaleorCartDrawer />
            <Toaster />
          </NtmsSaleorShell>
        </SaleorCartProvider>
      </NtmsChannelProvider>
    </ThemeProvider>
  );
}
