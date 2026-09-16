import { Link } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "./sign-out-button";

type CustomerSummary = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: string | null;
};

export function UserDropdown({ customer }: { customer: CustomerSummary }) {
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const displayName = fullName || customer.emailAddress || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${displayName}`}
          className="relative flex h-11 w-auto cursor-pointer items-center justify-center rounded-2xl border border-black/5 bg-white px-3 md:px-4 text-sm font-medium text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#f5f5f7] hover:text-[#0071e3]"
        >
          <UserIcon className="h-4 transition-all ease-in-out md:mr-1" />
          <span className="hidden md:inline ml-1">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Hello, {displayName}!</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/account">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/orders">Orders</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/addresses">Addresses</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/security">Security</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
