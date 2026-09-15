import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "edurecover-theme";

export function applyStoredTheme() {
  if (typeof document === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = stored ? stored === "dark" : prefersDark;
  document.documentElement.classList.toggle("dark", isDark);
  return isDark;
}

export default function ThemeSwitch() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(applyStoredTheme());
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-surface-alt text-gray-600 transition-colors duration-standard hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-dark-border dark:bg-dark-elevated dark:text-gray-400 dark:hover:border-primary-700 dark:hover:text-primary-300"
    >
      {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
    </button>
  );
}
