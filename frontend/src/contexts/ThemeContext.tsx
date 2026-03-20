import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "dark" | "light";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolved: "dark",
  setTheme: () => {},
});

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) ?? "dark";
  });

  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") return getSystemTheme();
    return "dark";
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved: "dark" | "light" = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("theme", theme);
  }, [resolved, theme]);

  // Apply immediately on first render to avoid flash
  if (typeof document !== "undefined") {
    const saved = (localStorage.getItem("theme") as Theme) ?? "dark";
    const r = saved === "system" ? getSystemTheme() : saved === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", r === "dark");
  }

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
