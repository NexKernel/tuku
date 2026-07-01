import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button onClick={toggle} className="btn-ghost" aria-label="Cambiar tema" title="Cambiar tema">
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
