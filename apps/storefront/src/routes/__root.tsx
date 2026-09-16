import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { CartProvider } from "@/components/custom/cart/cart-context";
import { ChannelProvider } from "@/components/custom/cart/channel-context";
import ErrorComponent from "@/components/custom/errors/error";
import { ThemeProvider } from "@/components/custom/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { clientEnv } from "@/env/client";
import { activeOrderQueryOptions } from "@/hooks/use-active-order";
import { activeChannelQueryOptions } from "@/hooks/use-catalog-products";
import { getBaseUrl, getPublicRobotsDirective } from "@/lib/metadata";
import { saleorNavigationQueryOptions } from "@/lib/saleor/catalog-query";
import { getActiveChannelAction } from "@/lib/saleor/channel-actions";
import { getSecurityHeaders } from "@/lib/security";
import { fetchUser, hasPocSessionCookie } from "@/lib/session";
import { isSaleorStorefront } from "@/lib/storefront-mode";
import type { RouterContext } from "@/lib/tanstack-query";
import { ensureStartsWith } from "@/lib/utils";
import appCss from "../styles.css?url";

const NtmsSaleorRootLayout = lazy(
  () => import("@/components/custom/saleor/ntms-root-layout"),
);

const getTwitterHandle = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle ? ensureStartsWith(handle, "@") : undefined;
  } catch {
    return ensureStartsWith(value, "@");
  }
};

const getTwitterProfileUrl = (value: string | undefined) => {
  const handle = getTwitterHandle(value);
  return handle ? `https://twitter.com/${handle.slice(1)}` : undefined;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  headers: () => getSecurityHeaders(),
  head: () => {
    const {
      VITE_SITE_NAME,
      VITE_COMPANY_NAME,
      VITE_TWITTER_CREATOR,
      VITE_TWITTER_SITE,
    } = clientEnv;

    // Base URL construction
    const baseUrl = getBaseUrl();

    // Twitter handle formatting
    const twitterCreator = getTwitterHandle(VITE_TWITTER_CREATOR);
    const twitterSite = getTwitterHandle(VITE_TWITTER_SITE);

    const siteDescription =
      "Professional tattoo supplies, cartridge needles, inks, machines, medical essentials, and studio equipment for working artists.";

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: VITE_SITE_NAME,
        },
        {
          name: "description",
          content: siteDescription,
        },
        {
          name: "keywords",
          content:
            "tattoo supplies, tattoo needles, cartridge needles, tattoo ink, tattoo machines, tattoo medical supplies, studio equipment",
        },
        {
          name: "robots",
          content: getPublicRobotsDirective(),
        },
        {
          name: "author",
          content: VITE_COMPANY_NAME || VITE_SITE_NAME,
        },
        {
          name: "generator",
          content: "TanStack Start",
        },
        // Open Graph tags
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:title",
          content: VITE_SITE_NAME,
        },
        {
          property: "og:description",
          content: siteDescription,
        },
        {
          property: "og:url",
          content: baseUrl,
        },
        {
          property: "og:site_name",
          content: VITE_SITE_NAME,
        },
        {
          property: "og:locale",
          content: "en_US",
        },
        // Twitter Card tags
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        ...(twitterSite
          ? [{ name: "twitter:site", content: twitterSite }]
          : []),
        ...(twitterCreator
          ? [{ name: "twitter:creator", content: twitterCreator }]
          : []),
        {
          name: "twitter:title",
          content: VITE_SITE_NAME,
        },
        {
          name: "twitter:description",
          content: siteDescription,
        },
        // Additional SEO meta tags
        {
          name: "theme-color",
          content: "#fbfbfd",
        },
        {
          name: "msapplication-TileColor",
          content: "#fbfbfd",
        },
        {
          name: "format-detection",
          content: "telephone=no",
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "icon",
          href: "/nuclear-favicon.svg",
        },
        {
          rel: "manifest",
          href: "/manifest.json",
        },
      ],
    };
  },
  errorComponent: ErrorComponent,
  beforeLoad: async () => {
    const hasSession = await hasPocSessionCookie();
    const user = hasSession ? await fetchUser() : null;

    if (isSaleorStorefront) {
      return { hasSession, user };
    }

    return { hasSession, user };
  },
  loader: async ({ context }) => {
    if (isSaleorStorefront) {
      // Navigation must not make the storefront unavailable if Saleor is slow.
      const [saleorNavigationCategories, initialNtmsChannel] =
        await Promise.all([
          context.queryClient
            .ensureQueryData(saleorNavigationQueryOptions())
            .catch(() => []),
          getActiveChannelAction().catch(() => undefined),
        ]);
      return {
        activeOrder: null,
        activeChannel: undefined,
        saleorNavigationCategories,
        initialNtmsChannel,
      };
    }

    const hasSession = await hasPocSessionCookie();
    const [activeOrder, activeChannel] = await Promise.all([
      hasSession
        ? context.queryClient.fetchQuery(activeOrderQueryOptions())
        : Promise.resolve(null),
      context.queryClient.ensureQueryData(activeChannelQueryOptions()),
    ]);
    return { activeOrder, activeChannel, saleorNavigationCategories: [] };
  },
  scripts: () => {
    const { VITE_SITE_NAME, VITE_COMPANY_NAME } = clientEnv;

    const baseUrl = getBaseUrl();
    const twitterProfileUrl = getTwitterProfileUrl(clientEnv.VITE_TWITTER_SITE);

    // Organization structured data
    const organizationJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: VITE_COMPANY_NAME || VITE_SITE_NAME,
      url: baseUrl,
      logo: `${baseUrl}/nuclear-favicon.svg`,
      sameAs: [...(twitterProfileUrl ? [twitterProfileUrl] : [])],
    };

    // Website structured data
    const websiteJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: VITE_SITE_NAME,
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    return [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd),
      },
    ];
  },
  component: RootLayout,
  shellComponent: RootDocument,
});

function RootLayout() {
  const {
    activeOrder,
    activeChannel,
    saleorNavigationCategories,
    initialNtmsChannel,
  } = Route.useLoaderData();
  const { hasSession } = Route.useRouteContext();

  if (isSaleorStorefront) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <NtmsSaleorRootLayout
          categories={saleorNavigationCategories}
          initialChannel={initialNtmsChannel}
        />
      </Suspense>
    );
  }

  return (
    <ThemeProvider>
      <ChannelProvider channel={activeChannel}>
        <CartProvider initialCart={activeOrder} hasSession={hasSession}>
          <main>
            <Outlet />
            <Toaster />
          </main>
        </CartProvider>
      </ChannelProvider>
    </ThemeProvider>
  );
}

const themeInitScript = `
(() => {
  const storageKey = "saleor-ntms-theme";
  const storedPreference = window.localStorage.getItem(storageKey);
  const preference = storedPreference === "light" || storedPreference === "dark" || storedPreference === "system"
    ? storedPreference
    : "light";
  const resolvedTheme = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
})();
`;

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Runs before hydration to prevent theme flash.
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
