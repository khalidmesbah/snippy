import { useTheme } from "@/components/theme-provider"
import { themeUtils, type Theme } from "@/lib/theme-utils"

export function useThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const switchToLight = () => setTheme("light")
  const switchToDark = () => setTheme("dark")
  const switchToSystem = () => setTheme("system")
  
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const isLight = theme === "light" || (theme === "system" && themeUtils.getSystemTheme() === "light")
  const isDark = theme === "dark" || (theme === "system" && themeUtils.getSystemTheme() === "dark")

  return {
    theme,
    setTheme,
    switchToLight,
    switchToDark,
    switchToSystem,
    toggleTheme,
    isLight,
    isDark,
  }
}
