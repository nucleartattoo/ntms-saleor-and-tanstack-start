import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

const preferenceLabel = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

export function ThemeToggle() {
  const { preference, resolvedTheme, toggleTheme } = useTheme();
  const Icon =
    preference === "system" ? Laptop : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      aria-label={`Switch theme. Current: ${preferenceLabel[preference]}`}
      title={`Theme: ${preference}`}
      onClick={toggleTheme}
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-[#f5f5f7] hover:text-[#0071e3]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
