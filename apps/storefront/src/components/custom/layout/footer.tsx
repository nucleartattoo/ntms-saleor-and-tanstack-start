import { Link } from "@tanstack/react-router";
import type { ResultOf } from "gql.tada";
import FooterMenu from "@/components/custom/layout/footer-menu";
import LogoSquare from "@/components/custom/logo-square";
import { clientEnv } from "@/env/client";
import type { collectionFragment } from "@/lib/vendure/queries/collection";
import { Route as HomeRoute } from "@/routes/_default/index";

const COMPANY_NAME = clientEnv.VITE_COMPANY_NAME;
const SITE_NAME = clientEnv.VITE_SITE_NAME;

interface FooterProps {
  menu: ResultOf<typeof collectionFragment>[];
}

export default function Footer({ menu }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <footer className="mt-16 bg-[#f5f5f7] text-sm text-[#86868b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 border-t border-black/5 px-6 py-14 text-sm min-[1320px]:px-0 md:flex-row md:items-start md:gap-16 md:px-4">
        <div>
          <Link
            className="flex items-center gap-2 text-foreground md:pt-1 dark:text-white"
            to={HomeRoute.to}
          >
            <LogoSquare size="sm" />
            <span className="uppercase">{SITE_NAME}</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-foreground/55">
            Fast-moving tattoo supply catalog built for clean browsing and
            repeat studio orders.
          </p>
        </div>
        <FooterMenu menu={menu} />
      </div>
      <div className="border-t border-black/5 py-6 text-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 min-[1320px]:px-0 md:flex-row md:gap-0 md:px-4">
          <p suppressHydrationWarning>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".") ? "." : ""}{" "}
            All rights reserved.
          </p>
          <hr className="mx-4 hidden h-4 w-px border-l border-black/10/24 md:inline-block" />
          <p>Machines, needles, power, and shop essentials.</p>
          <div className="md:ml-auto">
            <p className="text-xs text-foreground/45">
              Live channel inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Development Version Pill Badge */}
      <div className="mt-8 flex items-center justify-between border-t border-black/[0.04] pt-6 text-[11px] text-[#86868b]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Apple Build v1.0.24-PROD</span>
          </span>
          <span>&bull;</span>
          <span>Studio Engine Online</span>
        </div>
        <p className="font-mono text-[10px] text-[#86868b]">
          Release 20260830-apple-1.0.24
        </p>
      </div>
    </footer>
  );
}
