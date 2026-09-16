import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthTab = "sign-in" | "register";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  buildVersion?: string | null;
  className?: string;
  activeAuthTab?: AuthTab;
}

export function AuthShell({
  title,
  children,
  footer,
  buildVersion,
  className,
  activeAuthTab,
}: AuthShellProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-screen-2xl items-start justify-center px-4 py-8 text-[#1d1d1f] sm:px-6 sm:py-12 lg:px-8",
        className,
      )}
    >
      <aside className="w-full max-w-lg rounded-[2rem] border border-black/[0.06] bg-white p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] sm:p-8">
        {activeAuthTab ? <AuthTabs activeTab={activeAuthTab} /> : null}
        {children}
        {footer || buildVersion ? (
          <div className="mt-6 border-t border-black/[0.06] pt-6">
            {footer}
            {buildVersion ? (
              <div
                className={cn(
                  "flex items-center justify-center gap-1.5 text-center text-xs text-[#86868b]",
                  footer ? "mt-4" : "",
                )}
                data-testid="storefront-version"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Apple Build {buildVersion}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </section>
  );
}

function AuthTabs({ activeTab }: { activeTab: AuthTab }) {
  return (
    <nav
      aria-label="Account access"
      className="mb-8 grid grid-cols-2 rounded-full border border-black/[0.04] bg-[#f5f5f7] p-1 shadow-inner"
    >
      <AuthTabLink
        active={activeTab === "sign-in"}
        label="Sign in"
        to="/sign-in"
      />
      <AuthTabLink
        active={activeTab === "register"}
        label="Sign up"
        to="/register"
      />
    </nav>
  );
}

function AuthTabLink({
  active,
  label,
  to,
}: {
  active: boolean;
  label: string;
  to: "/sign-in" | "/register";
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
        active
          ? "bg-white text-[#1d1d1f] shadow-sm"
          : "text-[#86868b] hover:text-[#1d1d1f]",
      )}
    >
      {label}
    </Link>
  );
}
