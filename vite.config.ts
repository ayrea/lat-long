import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: set to '/REPO_NAME/' for project sites (e.g. .../lat-long/), or '/' for user/org site or custom domain
  base: '/lat-long/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB (epsg-index all.json chunk)
      },
      manifest: {
        name: 'Coordinate Helper',
        short_name: 'Lat-Long',
        description: 'Spatial coordinate helper: transform coordinates between CRS and project by bearing and distance.',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/lat-long/',
        scope: '/lat-long/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
    }),
  ],
})
