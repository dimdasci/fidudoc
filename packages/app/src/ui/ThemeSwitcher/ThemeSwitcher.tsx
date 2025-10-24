import { Moon, Sun } from "lucide-react";
import { useUI } from "../../stores/ui";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useUI();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-neutral-bg transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light"
        ? <Moon size={20} className="text-text-secondary" />
        : <Sun size={20} className="text-text-secondary" />}
    </button>
  );
}
