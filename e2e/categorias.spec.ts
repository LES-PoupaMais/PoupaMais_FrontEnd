import { expect, test, type Page } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'
import { entrarComSessaoFalsa } from './fixtures/sessao'

type Categoria = { id: number; descricao: string; ativa: boolean; quantidadeLancamentos: number }

// API de categorias em memória: GET (ativas primeiro, ordem alfabética), POST (409 se repetida), PUT e PATCH status
async function simularCategorias(page: Page, iniciais: Categoria[]) {
  const categorias = [...iniciais]
  const ordenar = () =>
    [...categorias].sort((a, b) => Number(b.ativa) - Number(a.ativa) || a.descricao.localeCompare(b.descricao))
  const repetida = (nome: string, id?: number) =>
    categorias.some((c) => c.id !== id && c.descricao.toLowerCase() === nome.toLowerCase())
  const duplicada = { status: 409, json: { status: 409, mensagem: 'Já existe uma categoria com essa descrição' } }

  await page.route(/\/api\/categorias(\?.*)?$/, async (rota) => {
    if (rota.request().method() === 'POST') {
      const { descricao } = rota.request().postDataJSON() as { descricao: string }
      if (repetida(descricao)) return rota.fulfill(duplicada)
      const nova = { id: categorias.length + 100, descricao, ativa: true, quantidadeLancamentos: 0 }
      categorias.push(nova)
      return rota.fulfill({ status: 201, json: nova })
    }
    return rota.fulfill({ json: ordenar() })
  })
  await page.route(/\/api\/categorias\/\d+(\/status)?$/, async (rota) => {
    const id = Number(/categorias\/(\d+)/.exec(rota.request().url())?.[1])
    const categoria = categorias.find((c) => c.id === id)!
    const corpo = rota.request().postDataJSON() as { descricao?: string; ativa?: boolean }
    if (corpo.descricao !== undefined) {
      if (repetida(corpo.descricao, id)) return rota.fulfill(duplicada)
      categoria.descricao = corpo.descricao
    }
    if (corpo.ativa !== undefined) categoria.ativa = corpo.ativa
    return rota.fulfill({ json: { id, descricao: categoria.descricao, ativa: categoria.ativa } })
  })
}

test.describe('categorias', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularApiBasica(page)
    await simularCategorias(page, [
      { id: 1, descricao: 'Aluguel', ativa: true, quantidadeLancamentos: 1 },
      { id: 2, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 5 },
      { id: 3, descricao: 'Academia', ativa: false, quantidadeLancamentos: 0 },
    ])
  })

  test('cria, renomeia, inativa e reativa (computador)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/categorias?mes=11&ano=2026')
    const tabela = page.locator('[data-slot="categoria-lista-tabela"]')
    await expect(tabela.getByText('3 categorias')).toBeVisible()
    await expect(tabela.getByRole('columnheader', { name: 'Lançamentos em Nov/2026' })).toBeVisible()

    // criar, com o nome repetido recusado no diálogo
    await page.getByRole('button', { name: 'Nova categoria' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Nova categoria' })
    await dialogo.getByLabel(/Nome/).fill('mercado')
    await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
    await expect(dialogo.getByText('Já existe uma categoria com essa descrição')).toBeVisible()
    await dialogo.getByLabel(/Nome/).fill('Assinaturas')
    await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
    await expect(dialogo).toBeHidden()
    await expect(page.getByText('Categoria criada')).toBeVisible()
    await expect(tabela.getByRole('row', { name: /Assinaturas/ })).toBeVisible()

    // renomear
    await tabela.getByRole('button', { name: 'Editar categoria Mercado' }).click()
    const edicao = page.getByRole('dialog', { name: 'Editar categoria' })
    await edicao.getByLabel(/Nome/).fill('Feira')
    await edicao.getByRole('button', { name: 'Salvar' }).click()
    await expect(tabela.getByRole('row', { name: /Feira/ })).toBeVisible()

    // inativar
    await tabela.getByRole('button', { name: 'Editar categoria Feira' }).click()
    await page
      .getByRole('dialog', { name: 'Editar categoria' })
      .getByRole('button', { name: 'Inativar categoria' })
      .click()
    await expect(page.getByText('Categoria inativada')).toBeVisible()
    await expect(tabela.getByRole('button', { name: 'Reativar Feira' })).toBeVisible()

    // reativar
    await tabela.getByRole('button', { name: 'Reativar Academia' }).click()
    await expect(page.getByText('Categoria reativada')).toBeVisible()
    await expect(tabela.getByRole('button', { name: 'Reativar Academia' })).toHaveCount(0)
  })

  test('no celular, "Nova categoria" da folha Criar abre o diálogo sem sair da tela', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard?mes=11&ano=2026')

    await page.locator('[data-slot="app-shell-bottom-nav"]').getByRole('button', { name: 'Criar' }).click()
    await page
      .getByRole('dialog', { name: 'Criar' })
      .getByRole('button', { name: /Nova categoria/ })
      .click()

    const dialogo = page.getByRole('dialog', { name: 'Nova categoria' })
    await expect(dialogo).toBeVisible()
    await expect(dialogo.getByLabel(/Nome/)).toBeFocused()
    await dialogo.getByLabel(/Nome/).fill('Pet')
    await dialogo.getByRole('button', { name: 'Criar categoria' }).click()

    await expect(dialogo).toBeHidden()
    await expect(page.getByText('Categoria criada')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.locator('[data-slot="app-shell-bottom-nav"]').getByRole('link', { name: 'Categorias' }).click()
    await expect(page.locator('[data-slot="categoria-lista-cartoes"]').getByText('Pet', { exact: true })).toBeVisible()
  })
})
