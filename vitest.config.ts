import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Load .env.local for tests (Vitest doesn't do this automatically like Next.js does)
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local may not exist in CI — that's fine, CI sets env vars directly
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Coverage is a source-code signal; imported fixtures and generated data
      // must not make thresholds vary between local and CI environments.
      exclude: ['**/*.json', 'sanity.types.ts'],
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 77,
        lines: 81,
        // New navigation and EPUB surfaces are held to complete
        // coverage independently so their guarantees cannot regress behind
        // the repository-wide aggregate.
        'app/about/page.tsx': { 100: true },
        'app/api/epub/route.ts': { 100: true },
        'components/public/FloatingNav.tsx': { 100: true },
        'components/public/StoryDrawer.tsx': { 100: true },
        'lib/epub.ts': { 100: true },
        'lib/share.ts': { 100: true },
      },
    },
  },
})
