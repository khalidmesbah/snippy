import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'


const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          :root {
            --theme-transition: 0.3s ease-in-out;
          }
        `
      }
    }
  },
  define: {
    __THEME_SUPPORT__: JSON.stringify(true),
    __THEME_STORAGE_KEY__: JSON.stringify('snippy-theme'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          theme: ['./src/components/theme-provider.tsx', './src/components/theme-toggle.tsx'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})

export default config
