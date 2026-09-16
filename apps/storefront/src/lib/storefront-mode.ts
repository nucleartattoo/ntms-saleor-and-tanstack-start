import { clientEnv } from "@/env/client";

export type StorefrontBackend = "vendure" | "saleor";

export const storefrontBackend: StorefrontBackend =
  clientEnv.VITE_STOREFRONT_BACKEND ?? "vendure";

export const isSaleorStorefront = storefrontBackend === "saleor";
