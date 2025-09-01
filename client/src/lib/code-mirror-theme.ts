// Custom CodeMirror theme that integrates with shadcn/ui theme
// Note: These modules are available through MDXEditor's internal CodeMirror
// We'll create a simpler theme using CSS variables instead

// Export a function that can be called to get the theme configuration
export const getCustomCodeMirrorTheme = () => {
  // This will be used by MDXEditor internally
  return {
    theme: "custom-shadcn-theme",
    // The actual styling will be handled by CSS in styles.css
  };
};

// Export the theme name for reference
export const customCodeMirrorThemeName = "custom-shadcn-theme";

// Export a function to get extensions (if needed in the future)
export const getCustomCodeMirrorExtensions = () => {
  return [];
};

// For now, export an empty array to maintain compatibility
export const customCodeMirrorThemeExtension: unknown[] = [];

// Export individual components for flexibility
export { customCodeMirrorThemeName as theme };
export { customCodeMirrorThemeName as darkTheme };
export { customCodeMirrorThemeName as highlightStyle };
