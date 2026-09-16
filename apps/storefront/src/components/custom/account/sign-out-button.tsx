import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useSignOutMutation } from "@/hooks/use-account-mutations";

export function SignOutButton({
  variant = "dropdown",
}: {
  variant?: "dropdown" | "button";
}) {
  const router = useRouter();
  const signOutMutation = useSignOutMutation();
  const label = signOutMutation.isPending ? "Signing out..." : "Sign out";
  const handleSignOut = () => {
    signOutMutation.mutate(undefined, {
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Error signing out",
        );
      },
      onSuccess: async () => {
        await router.navigate({ to: "/" });
        await router.invalidate();
      },
    });
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        disabled={signOutMutation.isPending}
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-[#1d1d1f] shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <DropdownMenuItem
      disabled={signOutMutation.isPending}
      onSelect={(event) => {
        event.preventDefault();
        handleSignOut();
      }}
    >
      {label}
    </DropdownMenuItem>
  );
}
