import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry'
  }
})
