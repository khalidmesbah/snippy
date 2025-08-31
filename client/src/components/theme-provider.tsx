"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { themeUtils, type Theme } from "@/lib/theme-utils"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => themeUtils.loadTheme())

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    themeUtils.saveTheme(newTheme)
    themeUtils.applyTheme(newTheme)
  }

  useEffect(() => {
    // Apply initial theme
    themeUtils.applyTheme(theme)

    // Listen for system theme changes
    const unsubscribe = themeUtils.onSystemThemeChange((systemTheme) => {
      if (theme === "system") {
        themeUtils.applyTheme("system")
      }
    })

    return unsubscribe
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
