import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "./theme-context";

const THEME_COLOR = { light: "#f7f9ff", dark: "#0a101d" };

function readSavedTheme() {
  try {
    return localStorage.getItem("edurecover-theme") === "dark";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(readSavedTheme);
  const firstRun = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    // Suppress colour transitions for the frame the theme flips in.
    if (!firstRun.current) root.classList.add("theme-changing");
    firstRun.current = false;
    root.classList.toggle("dark", darkMode);
    document.body.classList.toggle("dark", darkMode);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", darkMode ? THEME_COLOR.dark : THEME_COLOR.light);
    try {
      localStorage.setItem("edurecover-theme", darkMode ? "dark" : "light");
    } catch {
      // Storage unavailable: the theme still applies for this visit.
    }
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-changing")),
    );
    return () => cancelAnimationFrame(frame);
  }, [darkMode]);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode: () => setDarkMode((current) => !current),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
