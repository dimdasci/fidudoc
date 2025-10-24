import { create } from "zustand";

type Theme = "light" | "dark";

type UI = {
  selectedId: number | null;
  setSelected: (id: number | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useUI = create<UI>((set, get) => ({
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
  theme: (localStorage.getItem("theme") as Theme) || "light",
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  },
  toggleTheme: () => {
    const current = get().theme;
    const newTheme = current === "light" ? "dark" : "light";
    get().setTheme(newTheme);
  },
}));

// Apply theme to document
function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

// Initialize theme on app load
const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
applyTheme(savedTheme);
