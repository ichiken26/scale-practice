import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import AstroPWA from '@vite-pwa/astro'

export default defineConfig({
  integrations: [vue(), AstroPWA({
    registerType: 'prompt',
    includeAssets: ['icons/icon.svg'],
    manifest: {
      name: 'Scale Trainer', short_name: 'Scale Trainer', description: 'Guitar and bass scale practice',
      theme_color: '#111827', background_color: '#f8fafc', display: 'standalone', start_url: '/',
      icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { globPatterns: ['**/*.{html,js,css,svg,webmanifest}'], cleanupOutdatedCaches: true }
  })],
  vite: { worker: { format: 'es' }, build: { target: 'es2022' } }
})
