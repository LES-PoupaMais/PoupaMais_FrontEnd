import { expect, test } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Casca da área logada (DS: Navegação e layout): sidebar ≥ 768px, barra inferior abaixo disso.
test.describe('casca da área logada', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)
  })

  test('no computador, recolher a sidebar fica salvo para o próximo acesso', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard?mes=11&ano=2026')
    const sidebar = page.locator('#sidebar')

    await expect(sidebar.getByRole('link', { name: 'Lançamentos' })).toBeVisible()
    await expect(page.locator('[data-slot="app-shell-bottom-nav"]')).toBeHidden()
    const larguraExpandida = (await sidebar.boundingBox())?.width

    await sidebar.getByRole('button', { name: 'Recolher menu' }).click()
    await expect(sidebar.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(72)

    await page.reload()
    await expect(sidebar.getByRole('button', { name: 'Expandir menu' })).toBeVisible()
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(72)
    expect(larguraExpandida).toBe(256)
  })

  test('no tablet, a sidebar começa no trilho e abre por cima; Esc fecha', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1000 })
    await page.goto('/dashboard')
    const sidebar = page.locator('#sidebar')

    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(72)
    await sidebar.getByRole('button', { name: 'Expandir menu' }).click()
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(256)
    // por cima: o conteúdo não se mexe
    expect((await page.getByRole('main').boundingBox())?.x).toBeLessThan(256)

    // aberta por cima, o Tab fica preso dentro da sidebar
    await sidebar.getByRole('button', { name: 'Sair' }).focus()
    await page.keyboard.press('Tab')
    await expect(sidebar.getByRole('link', { name: 'PoupaMais, ir para o Dashboard' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(72)
  })

  test('no celular, a barra inferior aparece e a sidebar some', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')

    await expect(page.locator('#sidebar')).toBeHidden()
    const barra = page.locator('[data-slot="app-shell-bottom-nav"]')
    await expect(barra.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Seu perfil' })).toBeVisible()
  })

  test('no celular, o + abre a folha Criar; Esc fecha e o foco volta ao +', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    const criar = page.locator('[data-slot="app-shell-bottom-nav"]').getByRole('button', { name: 'Criar' })

    await criar.click()
    const folha = page.getByRole('dialog', { name: 'Criar' })
    await expect(folha).toBeVisible()
    await expect(folha.getByRole('link', { name: /Novo lançamento/ })).toBeFocused()
    await expect(folha.getByRole('link', { name: /Importar CSV/ })).toHaveAttribute('href', '/lancamentos/importar')

    await page.keyboard.press('Escape')
    await expect(folha).toBeHidden()
    await expect(criar).toBeFocused()
  })

  test('no celular, a TopBar troca o mês na URL', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard?mes=11&ano=2026')
    const mes = page.getByRole('banner').getByRole('navigation', { name: 'Mês exibido' })

    await expect(mes).toContainText('Nov 2026')
    await mes.getByRole('button', { name: 'Próximo mês' }).click()
    await expect(page).toHaveURL(/\/dashboard\?mes=12&ano=2026$/)
    await expect(mes).toContainText('Dez 2026')
  })

  test('Sair apaga a sessão e volta para o login', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    const sidebar = page.locator('#sidebar')
    // hidratada: no computador o botão de alternar passa a dizer "Recolher menu" (no servidor a largura é desconhecida)
    await expect(sidebar.getByRole('button', { name: 'Recolher menu' })).toBeVisible()

    await sidebar.getByRole('button', { name: 'Sair' }).click()

    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 })
    expect((await context.cookies()).some((cookie) => cookie.name === 'pm_token')).toBe(false)
    // sem sessão, a área logada volta a pedir login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?voltar=/)
  })

  test('o mês do Dashboard fica na URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard?mes=1&ano=2026')

    await expect(page.getByRole('main').getByRole('navigation', { name: 'Mês exibido' })).toContainText('Janeiro 2026')
    await page.getByRole('button', { name: 'Mês anterior' }).click()

    await expect(page).toHaveURL(/\/dashboard\?mes=12&ano=2025$/)
    await expect(page.getByRole('main').getByRole('navigation', { name: 'Mês exibido' })).toContainText('Dezembro 2025')
  })
})
