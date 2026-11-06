import { expect, test } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { entrarComSessaoFalsa } from './fixtures/sessao'

test.describe('proteção de rotas', () => {
  test('sem sessão, a área logada redireciona para o login guardando o destino', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login\?voltar=%2Fdashboard$/)
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
  })

  test('com sessão, o dashboard abre', async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard Financeiro' })).toBeVisible()
  })

  test('com sessão, o login redireciona para o dashboard', async ({ page, context }) => {
    await entrarComSessaoFalsa(context)

    await page.goto('/login')

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
