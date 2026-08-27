import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/tests/'],
    },
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],
  },
})
