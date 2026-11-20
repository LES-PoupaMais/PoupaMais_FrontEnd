import { defineConfig, devices } from '@playwright/test'

// E2E contra a API REAL (Spring + Postgres + Mailpit da pilha E2E do PoupaMais_Development):
//   cd ../PoupaMais_Development && E2E_FRONT_PORT=3130 npm run e2e:up     (API 8580, Mailpit 8525, banco 5435)
//   npm run test:e2e:api-real                                              (este arquivo)
//   cd ../PoupaMais_Development && npm run e2e:down
// Sobe o build de PRODUÇÃO do Next (next build + next start), como a suíte com a API falsa: é o que mais se parece com a
// entrega (sem a compilação sob demanda e o overlay do `next dev`, que deixam o primeiro acesso a cada rota lento e instável).
// O BFF e as Server Actions apontam para a API real por API_URL. Nada é simulado no navegador.
const CI = Boolean(process.env.CI)
const PORTA = Number(process.env.PORT ?? 3130)
const URL_BASE = `http://localhost:${PORTA}`
const URL_API = process.env.API_URL_E2E ?? 'http://localhost:8580'

export default defineConfig({
  testDir: 'e2e/api-real',
  globalSetup: './e2e/api-real/apoio/conferir-pilha.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : 3,
  // Folgas maiores que na suíte falsa: cada passo vai até a API e o banco de verdade (BCrypt no cadastro/login)
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-api-real', open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // O script `test:e2e:api-real` roda só o Chromium; o Firefox (RNF016) já roda na suíte com a API falsa. Para rodar aqui também:
  // npx playwright test -c playwright.api-real.config.ts --project=firefox
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORTA}`,
    url: URL_BASE,
    reuseExistingServer: !CI,
    timeout: 240_000,
    env: { API_URL: URL_API },
  },
})
