import { configDefaults, defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

const isCloudflare = process.env.DEPLOY_TARGET === "cloudflare" || process.env.CLOUDFLARE === "true";

export default defineConfig(async () => {
  const plugins = [tailwindcss(), tanstackStart(), viteReact()];

  if (isCloudflare) {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.unshift(cloudflare({ viteEnvironment: { name: "ssr" } }));
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 3002,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
      ],
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins,
    test: {
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      exclude: [...configDefaults.exclude, "tests/e2e/**"],
      env: {
        VITE_COMPANY_NAME: "Saleor Storefront",
        VITE_PARENT_ID: "1",
        VITE_SITE_NAME: "Saleor Storefront",
        VITE_TWITTER_CREATOR: "@example",
        VITE_TWITTER_SITE: "@example",
        VITE_WEBSITE_URL: "https://storefront.test",
      },
    },
  };
});
