import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { UserIcon } from "lucide-react";

export default function OpenSignIn({ className }: { className?: string }) {
  return (
    <Link
      to={"/sign-in"}
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#f5f5f7] hover:text-[#0071e3]"
    >
      <UserIcon
        className={clsx(
          "h-4 transition-all ease-in-out hover:scale-110",
          className,
        )}
      />
    </Link>
  );
}
