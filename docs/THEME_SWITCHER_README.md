# Theme Switcher Implementation

This document describes the theme switcher implementation using shadcn/ui components in the Snippy application.

## Components Created

### 1. ThemeProvider (`src/components/theme-provider.tsx`)
- Manages theme state (light, dark, system)
- Persists theme preference in localStorage
- Automatically detects system theme preference
- Applies theme classes to the document root

### 2. ThemeToggle (`src/components/theme-toggle.tsx`)
- Dropdown menu with theme options
- Shows current theme with animated icons
- Integrates with the theme provider

### 3. Settings Page (`src/routes/settings.tsx`)
- Complete settings interface with multiple sections
- Theme switcher prominently displayed in Appearance section
- Additional settings for notifications, privacy, and account

## Features

- **Three Theme Options:**
  - Light: Bright theme with light colors
  - Dark: Dark theme with dark colors  
  - System: Automatically follows OS preference

- **Persistent Storage:**
  - Theme choice is saved in localStorage
  - Survives browser restarts

- **System Integration:**
  - Detects OS theme preference
  - Automatically switches when OS theme changes

- **Accessibility:**
  - Screen reader support
  - Keyboard navigation
  - High contrast themes

## Usage

### In Components
```tsx
import { useTheme } from "@/components/theme-provider";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Theme Toggle Component
```tsx
import { ThemeToggle } from "@/components/theme-toggle";

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

## CSS Variables

The theme system uses CSS custom properties defined in `src/styles.css`:

- Light theme variables (default)
- Dark theme variables (`.dark` class)
- Automatic switching between themes

## Integration Points

1. **Root Route** (`src/routes/__root.tsx`):
   - ThemeProvider wraps the entire application
   - ThemeToggle added to the header

2. **Settings Page** (`src/routes/settings.tsx`):
   - Dedicated theme switcher in Appearance section
   - Current theme display

3. **Global Styles** (`src/styles.css`):
   - CSS variables for both themes
   - Smooth transitions between themes

## Browser Support

- Modern browsers with CSS custom properties support
- localStorage for persistence
- CSS media queries for system theme detection

## Future Enhancements

- Theme preview in settings
- Custom color schemes
- Animation preferences
- Export/import theme settings
