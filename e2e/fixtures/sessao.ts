import type { BrowserContext } from '@playwright/test'

// O proxy.ts só confere a presença do cookie; a API é simulada nos testes com page.route('**/api/**').
export async function entrarComSessaoFalsa(context: BrowserContext): Promise<void> {
  await context.addCookies([{ name: 'pm_token', value: 'token-falso-e2e', url: 'http://localhost:3000' }])
}
