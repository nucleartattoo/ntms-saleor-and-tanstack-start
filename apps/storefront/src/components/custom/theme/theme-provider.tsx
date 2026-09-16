import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "saleor-ntms-theme";
const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";
const THEME_OPTIONS: ThemePreference[] = ["dark", "light", "system"];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  if (globalThis.window?.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialPreference = isThemePreference(storedPreference)
      ? storedPreference
      : DEFAULT_THEME_PREFERENCE;
    const initialResolvedTheme =
      initialPreference === "system" ? getSystemTheme() : initialPreference;

    setPreferenceState(initialPreference);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialPreference, initialResolvedTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = () => {
      setResolvedTheme(() => {
        const nextResolvedTheme =
          preference === "system" ? getSystemTheme() : preference;
        applyTheme(preference, nextResolvedTheme);
        return nextResolvedTheme;
      });
    };

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, [preference]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    const nextResolvedTheme =
      nextPreference === "system" ? getSystemTheme() : nextPreference;

    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setPreferenceState(nextPreference);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextPreference, nextResolvedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentIndex = THEME_OPTIONS.indexOf(preference);
    const nextPreference =
      THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length] ?? "system";
    setPreference(nextPreference);
  }, [preference, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
