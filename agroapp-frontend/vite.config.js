import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isVercelBuild = process.env.VERCEL === '1'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    ...(isVercelBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            pwaAssets: {
              disabled: false,
              config: true,
            },
            manifest: {
              name: 'agroapp-frontend',
              short_name: 'agroapp',
              description: 'Gestion Agricola Inteligente',
              theme_color: '#2E7D4F',
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              cleanupOutdatedCaches: true,
              clientsClaim: true,
            },
            devOptions: {
              enabled: false,
              navigateFallback: 'index.html',
              suppressWarnings: true,
              type: 'module',
            },
          }),
        ]),
  ],
})