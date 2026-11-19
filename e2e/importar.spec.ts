import { expect, test } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Roteiro da demo, passo 3: importar um CSV com uma linha inválida e ver quais linhas falharam (RN007).
const CSV = [
  'descricao;tipo;data;valor;categorias',
  'Mercado do mês;DESPESA;05/11/2026;1.120,35;Mercado',
  'Padaria;DESPESA;31/02/2026;32,50;Mercado',
  'Ração;DESPESA;10/11/2026;89,90;Pet',
].join('\n')

test.describe('importar CSV', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)
  })

  test('importa um CSV com uma linha inválida e mostra a linha e o motivo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    let recebido = ''
    await page.route('**/api/lancamentos/importar', async (rota) => {
      recebido = rota.request().postData() ?? ''
      await rota.fulfill({
        json: {
          totalLinhas: 3,
          importados: 2,
          falhas: [
            {
              linha: 3,
              conteudo: 'Padaria;DESPESA;31/02/2026;32,50;Mercado',
              motivo: 'Data inválida (31/02/2026). Use dd/mm/aaaa com um dia que exista.',
            },
          ],
          categoriasCriadas: ['Pet'],
        },
      })
    })
    await page.goto('/lancamentos/importar')

    await expect(page.getByRole('heading', { level: 1, name: 'Importar CSV' })).toBeVisible()
    // o rodapé com "Importar lançamentos" ocupa o lugar da barra inferior
    await expect(page.locator('[data-slot="app-shell-bottom-nav"]')).toHaveCount(0)
    const importar = page.getByRole('button', { name: 'Importar lançamentos' })
    await expect(importar).toBeDisabled()

    await page.getByLabel('Escolher arquivo').setInputFiles({
      name: 'lancamentos-novembro.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV),
    })
    await expect(page.getByText('lancamentos-novembro.csv')).toBeVisible()
    await importar.click()

    await expect(page.getByRole('heading', { name: 'Importação concluída' })).toBeVisible()
    const resumo = page.getByRole('status').filter({ hasText: 'importados' })
    await expect(resumo).toContainText('2 lançamentos importados')
    await expect(resumo).toContainText('1 linha ignorada')
    const linha = page.getByRole('table', { name: 'Linhas ignoradas' }).getByRole('row', { name: /Linha 3/ })
    await expect(linha).toContainText('Data inválida (31/02/2026)')
    await expect(page.getByText('Pet', { exact: true })).toBeVisible()
    await expect(page.getByText('2 lançamentos importados. 1 linha ignorada.')).toBeVisible()
    expect(recebido).toContain('name="arquivo"')
    await expect(page.getByRole('link', { name: 'Ver lançamentos' })).toHaveAttribute('href', '/lancamentos')
  })

  test('recusa arquivo acima de 2 MB sem enviar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    let enviou = false
    await page.route('**/api/lancamentos/importar', async (rota) => {
      enviou = true
      await rota.fulfill({ json: {} })
    })
    await page.goto('/lancamentos/importar')

    await page.getByLabel('Escolher arquivo').setInputFiles({
      name: 'grande.csv',
      mimeType: 'text/csv',
      buffer: Buffer.alloc(3 * 1024 * 1024, 'a'),
    })

    await expect(page.getByRole('main').getByRole('alert')).toContainText('O arquivo tem 3 MB. O limite é 2 MB')
    await expect(page.getByRole('button', { name: 'Importar lançamentos' })).toBeDisabled()
    expect(enviou).toBe(false)
    // computador: duas colunas, com o modelo no card "Formato do arquivo"
    await expect(page.getByRole('heading', { name: 'Formato do arquivo' })).toBeVisible()
    await expect(page.locator('#modelo-csv')).toBeVisible()
  })
})
