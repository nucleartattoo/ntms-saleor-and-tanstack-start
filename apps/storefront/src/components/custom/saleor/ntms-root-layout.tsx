import { Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/custom/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { NtmsSaleorCategory } from "@/lib/saleor/catalog";
import { SaleorCartProvider } from "./ntms-cart-context";
import { NtmsSaleorCartDrawer } from "./ntms-cart-drawer";
import { NtmsSaleorShell } from "./ntms-shell";

export default function NtmsSaleorRootLayout({
  categories,
}: {
  categories: NtmsSaleorCategory[];
}) {
  return (
    <ThemeProvider>
      <SaleorCartProvider>
        <NtmsSaleorShell categories={categories}>
          <Outlet />
          <NtmsSaleorCartDrawer />
          <Toaster />
        </NtmsSaleorShell>
      </SaleorCartProvider>
    </ThemeProvider>
  );
}
