// Theme utilities that leverage Vite's capabilities
import { showNotification } from "@/lib/notifications";

// Vite build-time constants
declare const __THEME_SUPPORT__: boolean;
declare const __THEME_STORAGE_KEY__: string;

export const THEME_SUPPORT = __THEME_SUPPORT__;
export const THEME_STORAGE_KEY = __THEME_STORAGE_KEY__;

// Theme types
export type Theme = "light" | "dark" | "system";

// CSS variable management with Vite optimizations
export const themeUtils = {
  // Get CSS variable value
  getCSSVariable: (name: string): string => {
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  },

  // Set CSS variable value
  setCSSVariable: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    document.documentElement.style.setProperty(name, value);
  },

  // Apply theme with smooth transitions
  applyTheme: (theme: Theme): void => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Add transition class for smooth theme switching
    root.classList.add("theme-transitioning");

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 300);
  },

  // Get system theme preference
  getSystemTheme: (): Theme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  },

  // Listen for system theme changes
  onSystemThemeChange: (callback: (theme: Theme) => void): (() => void) => {
    if (typeof window === "undefined") return () => {};

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  },

  // Save theme preference
  saveTheme: (theme: Theme): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_error) {
      showNotification.warning(
        "Theme preference",
        "Failed to save theme preference to local storage",
      );
    }
  },

  // Load theme preference
  loadTheme: (): Theme => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      return saved || "system";
    } catch (_error) {
      showNotification.warning(
        "Theme preference",
        "Failed to load theme preference from local storage",
      );
      return "system";
    }
  },
};

// Theme color utilities
export const themeColors = {
  // Get theme-aware color
  getColor: (lightColor: string, darkColor: string): string => {
    if (typeof window === "undefined") return lightColor;

    const isDark = document.documentElement.classList.contains("dark");
    return isDark ? darkColor : lightColor;
  },

  // Get current theme
  getCurrentTheme: (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  },
};

// Export for use in components
export default themeUtils;
