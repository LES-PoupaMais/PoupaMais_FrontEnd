import { expect, test, type Page } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { simularApiDeLancamentos } from './fixtures/lancamentos'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Lançamentos: filtrar, tirar do saldo (roteiro da demo, passo 4), mover para a lixeira com e sem Desfazer,
// visualizar, Mostrar mais, exportar com os filtros e restaurar da lixeira.
const COMPUTADOR = { width: 1440, height: 900 }
const CELULAR = { width: 390, height: 844 }

const tabela = (page: Page) => page.getByRole('table')

test.describe('Lançamentos', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)
  })

  test('filtrar e tirar do saldo (roteiro da demo, passo 4)', async ({ page }) => {
    const api = await simularApiDeLancamentos(page)
    await page.setViewportSize(COMPUTADOR)
    await page.goto('/lancamentos?mes=11&ano=2026')
    const barra = page.getByRole('search', { name: 'Filtrar lançamentos' })
    await expect(barra.getByRole('status')).toHaveText('15 lançamentos')

    await barra.getByLabel('Buscar').fill('mercado')
    await expect(page).toHaveURL(/q=mercado/)
    await expect(barra.getByRole('status')).toHaveText('1 lançamento')

    await barra.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Despesa' }).click()
    await expect(page).toHaveURL(/tipo=DESPESA/)

    const chave = tabela(page).getByRole('switch', { name: 'Conta no saldo: Mercado do mês' })
    await expect(chave).toBeChecked()
    await chave.click()
    await expect(page.getByText('Lançamento fora do saldo. Ele continua na lista.')).toBeVisible()
    await expect(chave).not.toBeChecked()
    expect(api.statusAlterados).toEqual([{ id: 3, status: 'INATIVO' }])

    await barra.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(barra.getByRole('status')).toHaveText('15 lançamentos')
  })

  test('mover para a lixeira: o DELETE vai na hora; o Desfazer restaura ao status de antes', async ({ page }) => {
    const api = await simularApiDeLancamentos(page)
    await page.setViewportSize(COMPUTADOR)
    await page.goto('/lancamentos?mes=11&ano=2026')
    const barra = page.getByRole('search', { name: 'Filtrar lançamentos' })

    await tabela(page).getByRole('button', { name: 'Mover Feira 1 para a lixeira' }).click()
    await expect(tabela(page).getByRole('link', { name: 'Ver Feira 1', exact: true })).toBeHidden()
    await expect(barra.getByRole('status')).toHaveText('14 lançamentos')
    await expect.poll(() => api.excluidos).toEqual([100])
    await page.getByRole('button', { name: 'Desfazer' }).click()
    await expect.poll(() => api.restaurados).toEqual([100])
    await expect(tabela(page).getByRole('link', { name: 'Ver Feira 1', exact: true })).toBeVisible()
    // Voltou ATIVO (era ATIVO antes da lixeira): continua contando no saldo
    await expect(tabela(page).getByRole('switch', { name: 'Conta no saldo: Feira 1', exact: true })).toBeChecked()
    await expect(barra.getByRole('status')).toHaveText('15 lançamentos')

    await tabela(page).getByRole('button', { name: 'Mover Feira 2 para a lixeira' }).click()
    await expect(page.getByText('Movido para a lixeira').last()).toBeVisible()
    await expect.poll(() => api.excluidos).toEqual([100, 101])
    await page.mouse.move(0, 0)
    await expect(page.getByText('Movido para a lixeira')).toHaveCount(0, { timeout: 10_000 })
    await expect(tabela(page).getByRole('link', { name: 'Ver Feira 2', exact: true })).toBeHidden()
    expect(api.restaurados).toEqual([100])
  })

  test('computador: a linha abre o painel; Mostrar mais carrega o resto', async ({ page }) => {
    await simularApiDeLancamentos(page)
    await page.setViewportSize(COMPUTADOR)
    await page.goto('/lancamentos?mes=11&ano=2026')

    await expect(page.getByText('Mostrando 12 de 15 lançamentos')).toBeVisible()
    await page.getByRole('button', { name: 'Mostrar mais' }).click()
    await expect(page.getByText('Mostrando 15 de 15 lançamentos')).toBeVisible()

    await tabela(page).getByRole('link', { name: 'Ver Mercado do mês' }).click()
    const painel = page.getByRole('dialog', { name: 'Lançamento' })
    await expect(painel.getByRole('heading', { name: 'Mercado do mês' })).toBeVisible()
    await expect(painel.getByText('5 de novembro de 2026')).toBeVisible()
    await expect(painel.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/lancamentos/3/editar')
    await expect(page).toHaveURL(/ver=3/)
    await page.keyboard.press('Escape')
    await expect(painel).toBeHidden()
    await expect(page).not.toHaveURL(/ver=/)
  })

  test('celular: filtros pela folha e visualização em tela cheia', async ({ page }) => {
    await simularApiDeLancamentos(page)
    await page.setViewportSize(CELULAR)
    await page.goto('/lancamentos?mes=11&ano=2026')
    const filtros = page.getByRole('search', { name: 'Filtrar lançamentos' })

    await filtros.getByRole('button', { name: 'Filtros' }).click()
    const folha = page.getByRole('dialog', { name: 'Filtros' })
    await folha.getByRole('radio', { name: 'Receita' }).click()
    await folha.getByRole('button', { name: 'Aplicar filtros' }).click()
    await expect(filtros.getByRole('button', { name: 'Filtros, 1 ativo' })).toBeVisible()
    await expect(filtros.getByRole('status')).toHaveText('1 lançamento')

    await page.getByRole('link', { name: 'Ver Salário' }).click()
    await expect(page).toHaveURL(/\/lancamentos\/2$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Salário' })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Conta no saldo' })).toBeChecked()
  })

  test('exportar com os filtros ativos baixa o arquivo com o nome da API', async ({ page }) => {
    const api = await simularApiDeLancamentos(page)
    await page.setViewportSize(COMPUTADOR)
    await page.goto('/lancamentos?mes=11&ano=2026&tipo=DESPESA')
    await page.getByRole('search', { name: 'Filtrar lançamentos' }).getByRole('button', { name: 'Exportar' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Exportar lançamentos' })
    await expect(
      dialogo.getByText('O arquivo segue os filtros ativos: Novembro 2026 · Despesa · Todos os status'),
    ).toBeVisible()
    await dialogo.getByRole('radio', { name: 'Excel' }).click()
    const download = page.waitForEvent('download')
    await dialogo.getByRole('button', { name: 'Baixar arquivo' }).click()
    expect((await download).suggestedFilename()).toBe('lancamentos-novembro-2026.xlsx')
    await expect(page.getByText('Arquivo exportado')).toBeVisible()
    expect(Object.fromEntries(api.exportacoes[0])).toMatchObject({
      formato: 'xlsx',
      mes: '11',
      ano: '2026',
      tipo: 'DESPESA',
    })
  })

  test('lixeira: restaurar volta como inativo', async ({ page }) => {
    await simularApiDeLancamentos(page)
    await page.setViewportSize(COMPUTADOR)
    await page.goto('/lancamentos?mes=11&ano=2026')
    await page.getByRole('search', { name: 'Filtrar lançamentos' }).getByRole('radio', { name: 'Lixeira' }).click()
    await expect(page).toHaveURL(/\/lancamentos\/lixeira$/)
    await expect(page.getByText('1 lançamento na lixeira').filter({ visible: true })).toBeVisible()

    await tabela(page).getByRole('button', { name: 'Restaurar Academia' }).click()
    await expect(page.getByText('Restaurado como inativo. Ative para voltar ao dashboard.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'A lixeira está vazia' })).toBeVisible()
    await page.getByRole('button', { name: 'Ver', exact: true }).click()
    await expect(page).toHaveURL(/\/lancamentos\?mes=9&ano=2026/)
    await expect(tabela(page).getByRole('switch', { name: 'Conta no saldo: Academia' })).not.toBeChecked()
  })
})
