import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  resolve: {
    alias: {
      // Electron n'existe pas dans Node.js — on redirige vers un mock
      electron: fileURLToPath(new URL('./tests/setup/electronMock.js', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/globalSetup.js'],
    testTimeout: 15000,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/main/**/*.js', 'src/renderer/src/utils/**/*.js'],
      exclude: ['src/main/index.js']
    }
  }
})
