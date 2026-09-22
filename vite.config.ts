import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0])
  },
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'prompt', // Changed from 'autoUpdate' to give users control
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Reflexia',
        description: 'A place to write down what happened and think it through. Everything stays on your device.',
        short_name: 'Reflexia',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        // These two files are the ones in public/. The manifest used to name
        // /pwa-192.png and /pwa-512.png, which never existed, so no browser
        // ever considered the app installable (phase 3A.1).
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: false, // Wait for user confirmation
        clientsClaim: false
      }
    })
  ]
})
