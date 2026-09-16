import { Link } from "@tanstack/react-router";
import {
  KeyRound,
  Mail,
  MapPinned,
  Package2,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SignOutButton } from "./sign-out-button";

const navigation = [
  { name: "Orders", href: "/account/orders", icon: Package2 },
  { name: "Addresses", href: "/account/addresses", icon: MapPinned },
  { name: "Settings", href: "/account/settings", icon: Settings2 },
  { name: "Security", href: "/account/security", icon: KeyRound },
];

export function AccountNavigation() {
  const { activeCustomer } = useAuth();
  const firstName = activeCustomer?.firstName || "";
  const lastName = activeCustomer?.lastName || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Studio Artist";

  const initials =
    ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "NT";

  return (
    <nav className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      <div className="border-b border-black/[0.06] pb-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c6ff] text-base font-bold text-white shadow-[0_4px_12px_rgba(0,113,227,0.25)] ring-4 ring-[#f5f5f7]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0071e3]">
                Studio Account
              </span>
            </div>
            <h2 className="truncate text-base font-bold tracking-tight text-[#1d1d1f]">
              {displayName}
            </h2>
            {activeCustomer?.emailAddress ? (
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-[#86868b]">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#86868b]" />
                <span className="truncate">{activeCustomer.emailAddress}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/80 px-3 py-1 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified Studio Member</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="group flex min-w-fit items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 lg:min-w-0"
            activeProps={{
              className: "bg-[#f5f5f7] text-[#0071e3] shadow-sm",
            }}
            inactiveProps={{
              className:
                "text-[#515154] hover:bg-[#f5f5f7]/60 hover:text-[#1d1d1f]",
            }}
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-5 border-t border-black/[0.06] pt-4">
        <SignOutButton variant="button" />
      </div>
    </nav>
  );
}
