import { Moon, Sun } from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "../theme-context";

export default function ThemeToggle({
  className = "",
  floating = false,
}: {
  className?: string;
  floating?: boolean;
}) {
  const { darkMode, toggleDarkMode } = useTheme();

  const toggle = (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`theme-toggle ${darkMode ? "is-dark" : ""} ${className}`.trim()}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        <Sun className="theme-toggle-sun" size={17} strokeWidth={2.2} />
        <Moon className="theme-toggle-moon" size={17} strokeWidth={2.2} />
      </span>
    </button>
  );

  if (!floating) return toggle;

  return createPortal(
    <div className="theme-toggle-portal" aria-hidden="false">
      {toggle}
    </div>,
    document.body,
  );
}
