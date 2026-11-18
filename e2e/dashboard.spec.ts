import { expect, test } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { simularDashboard } from './fixtures/dashboard'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Dashboard (pranchetas dashboard-*): números do mês, troca de mês pela URL, vazio, erro e o atalho para Lançamentos.
test.describe('dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)
  })

  test('carrega e mostra os números do mês', async ({ page }) => {
    await simularDashboard(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard?mes=11&ano=2026')

    const saldo = page.getByRole('article', { name: 'Saldo do mês de novembro de 2026' })
    await expect(saldo).toContainText('+ R$ 4.920,00', { timeout: 15_000 })
    await expect(saldo).toContainText('Você fechou o mês com R$ 4.920,00 positivos.')
    const resumo = page.getByRole('list', { name: 'Resumo de novembro de 2026' })
    await expect(resumo).toContainText('R$ 12.480,50')
    await expect(resumo).toContainText('R$ 7.560,50')
    await expect(resumo).toContainText('60,6%')
    await expect(resumo).toContainText('Dentro do limite')
    await expect(page.getByRole('region', { name: 'Receitas × Despesas' })).toContainText('Ago a Nov/2026')
    await expect(page.getByRole('region', { name: 'Saldo mensal' })).toContainText('+4.920,00')
    await expect(page.getByRole('region', { name: 'Maiores despesas' })).toContainText('64,7% das despesas do mês')
  })

  test('trocar de mês atualiza a URL e os números', async ({ page }) => {
    await simularDashboard(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/dashboard?mes=8&ano=2026')
    await expect(page.getByRole('article', { name: 'Saldo do mês de agosto de 2026' })).toContainText('R$ 3.579,60', {
      timeout: 15_000,
    })

    await page.getByRole('main').getByRole('button', { name: 'Mês anterior' }).click()
    await expect(page).toHaveURL(/mes=7&ano=2026/)
    const saldo = page.getByRole('article', { name: 'Saldo do mês de julho de 2026' })
    await expect(saldo).toContainText('− R$ 750,40')
    await expect(page.getByText('Acima do limite')).toBeVisible()
  })

  test('mês sem lançamentos mostra o primeiro passo', async ({ page }) => {
    await simularDashboard(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard?mes=1&ano=2026')

    await expect(page.getByRole('heading', { name: 'Comece pelo seu primeiro lançamento' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Janeiro 2026 ainda não tem lançamentos.', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Criar primeiro lançamento' })).toHaveAttribute(
      'href',
      '/lancamentos/novo',
    )
    await expect(page.getByRole('link', { name: 'Importar CSV' })).toBeVisible()
  })

  test('erro ao carregar oferece "Tentar de novo"', async ({ page }) => {
    const api = await simularDashboard(page, { falhar: true })
    await page.goto('/dashboard?mes=11&ano=2026')

    const erro = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o dashboard' })
    await expect(erro).toBeVisible({ timeout: 15_000 })
    api.voltar()
    await erro.getByRole('button', { name: 'Tentar de novo' }).click()
    await expect(page.getByRole('article', { name: 'Saldo do mês de novembro de 2026' })).toBeVisible()
  })

  test('tocar numa categoria leva a Lançamentos filtrado pela categoria e pelo mês', async ({ page }) => {
    await simularDashboard(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard?mes=11&ano=2026')

    await page.getByRole('link', { name: 'Mercado: R$ 1.480,35. Ver lançamentos de Mercado' }).click()
    await expect(page).toHaveURL(/\/lancamentos\?categoriaId=2&mes=11&ano=2026&tipo=DESPESA/)
  })
})
