import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    poolOptions: {
      threads: { singleThread: true },
    },
    setupFiles: [],
  },
})
