import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

// E2E sobre o build de produção. Não precisa do backend: a sessão é um cookie falso e a API é
// simulada no navegador com page.route('**/api/**') (ver e2e/fixtures).
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'pt-BR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Chromium e Firefox: navegadores exigidos pela RNF016 (Edge usa o motor do Chromium)
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !CI,
    timeout: 240_000,
  },
})
