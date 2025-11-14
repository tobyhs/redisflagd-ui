/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/': 'http://localhost:9292',
    },
    watch: {
      ignored: [path.resolve(__dirname, 'coverage')],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest-setup.ts'],
    coverage: {
      enabled: Boolean(process.env.CI),
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['tests/**', 'src/main.tsx'],
      clean: true,
      reportOnFailure: true,
      thresholds: {
        100: true,
      },
    },
  },
})
