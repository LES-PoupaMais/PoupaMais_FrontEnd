import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

// E2E sobre o build de produção. Não precisa do backend: a sessão é um cookie falso e a API é
// simulada no navegador com page.route('**/api/**') (ver e2e/fixtures).
// Porta configurável (PORT): com várias worktrees, cada uma usa a sua e o reuseExistingServer não pega o build de outra.
const PORTA = Number(process.env.PORT ?? 3000)
const URL_BASE = `http://localhost:${PORTA}`
// API falsa (e2e/api-falsa.mjs) para as Server Actions, que chamam a API pelo servidor: porta = PORT + 1000
const PORTA_API = PORTA + 1000

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  // Localmente, poucos workers: com muitos em paralelo o Firefox fica sem CPU (WSL) e estoura o tempo
  workers: CI ? 1 : 3,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    locale: 'pt-BR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Chromium e Firefox: navegadores exigidos pela RNF016 (Edge usa o motor do Chromium)
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: [
    {
      command: `node e2e/api-falsa.mjs ${PORTA_API}`,
      url: `http://localhost:${PORTA_API}/saude`,
      reuseExistingServer: !CI,
    },
    {
      command: `npm run build && npm run start -- --port ${PORTA}`,
      url: URL_BASE,
      reuseExistingServer: !CI,
      timeout: 240_000,
      env: { API_URL: `http://localhost:${PORTA_API}` },
    },
  ],
})
