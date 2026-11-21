import { expect, test, type Page } from '@playwright/test'
import { simularApiDoFormulario, type Enviado } from './fixtures/lancamento-form'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Novo e Editar lançamento: roteiro da demo (1. criar categoria pelo campo; 2. lançamento com duas categorias e data),
// validação, edição com "Conta no saldo", Descartar alterações e o lançamento na lixeira.
let enviados: Enviado[]

test.beforeEach(async ({ page, context }) => {
  await entrarComSessaoFalsa(context)
  enviados = await simularApiDoFormulario(page)
})

const salvar = (page: Page) => page.getByRole('button', { name: 'Salvar lançamento' }).click()

test('roteiro da demo: cria a categoria pelo campo e salva com duas categorias e data', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/lancamentos/novo')

  await page.getByLabel('Descrição').fill('Remédios')
  await page.getByRole('radio', { name: 'Despesa' }).click()
  await page.getByLabel('Data').fill('05/11/2026')
  await page.getByLabel('Valor').fill('86,40')
  await expect(page.getByText('Despesa: vai aparecer como')).toBeVisible()

  // 409: já existe (sem diferenciar maiúsculas)
  await page.getByRole('button', { name: 'Abrir lista de categorias' }).click()
  await page.getByRole('searchbox', { name: 'Buscar categoria' }).fill('mercado')
  await page.getByRole('button', { name: 'Criar "mercado"' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Nova categoria' })
  await expect(dialogo.getByLabel('Nome da categoria')).toHaveValue('mercado')
  await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
  await expect(dialogo.getByText('Já existe uma categoria com essa descrição')).toBeVisible()

  await dialogo.getByLabel('Nome da categoria').fill('Farmácia')
  await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
  await expect(dialogo).toBeHidden()
  await expect(page.getByText('Categoria "Farmácia" criada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover Farmácia' })).toBeVisible()

  await page.getByRole('button', { name: 'Abrir lista de categorias' }).click()
  await page.getByRole('checkbox', { name: 'Mercado' }).click()
  await expect(page.getByRole('checkbox', { name: 'Academia' })).toBeDisabled()
  await page.keyboard.press('Escape')

  await salvar(page)
  // volta para a lista do mês do lançamento (o toast "Lançamento salvo" é conferido no teste da tela)
  await expect(page).toHaveURL(/\/lancamentos\?mes=11&ano=2026$/)

  const post = enviados.find((e) => e.metodo === 'POST' && e.caminho === '/api/lancamentos')
  expect(post?.corpo).toEqual({
    descricao: 'Remédios',
    tipo: 'DESPESA',
    data: '2026-11-05',
    valor: 86.4,
    categoriaIds: [100, 2],
    status: 'ATIVO',
  })
  // "Conta no saldo" vai no próprio POST: nenhum PATCH de status depois
  expect(enviados.some((e) => e.caminho.endsWith('/status'))).toBe(false)
})

test('validação: data que não existe, valor zero e sem categoria não enviam', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lancamentos/novo')

  await page.getByLabel('Descrição').fill('Conta de luz')
  await page.getByRole('radio', { name: 'Despesa' }).click()
  await page.getByLabel('Data').fill('31/02/2026')
  await page.getByLabel('Valor').fill('0')
  await salvar(page)

  await expect(page.getByText('Faltam 3 informações. Confira os campos marcados.')).toBeVisible()
  await expect(page.getByText('Informe uma data válida, no formato dd/mm/aaaa.')).toBeVisible()
  await expect(page.getByText('Informe um valor maior que zero.')).toBeVisible()
  await expect(page.getByText('Informe pelo menos uma categoria.')).toBeVisible()
  expect(enviados).toHaveLength(0)
})

test('editar: muda o valor e tira do saldo (status no próprio PUT)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/lancamentos/3/editar')

  await expect(page.getByRole('heading', { name: 'Editar lançamento' })).toBeVisible()
  await expect(page.getByText('Mercado do mês · 5 de novembro de 2026')).toBeVisible()
  await expect(page.getByLabel('Descrição')).toHaveValue('Mercado do mês')
  await page.getByLabel('Valor').fill('1.200,00')
  await page.getByRole('switch', { name: 'Conta no saldo' }).click()
  await salvar(page)

  await expect(page).toHaveURL(/\/lancamentos\?mes=11&ano=2026$/)
  const put = enviados.find((e) => e.metodo === 'PUT')
  expect(put).toMatchObject({
    caminho: '/api/lancamentos/3',
    corpo: { valor: 1200, data: '2026-11-05', categoriaIds: [2], status: 'INATIVO' },
  })
  expect(enviados.some((e) => e.metodo === 'PATCH')).toBe(false)
})

test('descartar alterações: pelo ‹ e pelo Voltar do navegador', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')
  await page.goto('/lancamentos/novo')
  await page.getByLabel('Descrição').fill('Padaria')

  await page.getByRole('link', { name: 'Voltar para Lançamentos' }).click()
  const dialogo = page.getByRole('alertdialog', { name: 'Descartar alterações?' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page).toHaveURL(/\/lancamentos\/novo$/)
  await expect(page.getByLabel('Descrição')).toHaveValue('Padaria')

  // Limpar também pergunta
  await page.getByRole('button', { name: 'Limpar' }).click()
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()

  await page.goBack()
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: 'Descartar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('"Sair" da sidebar com alterações pergunta antes (Cancelar fica no formulário)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/lancamentos/novo')
  await page.getByLabel('Descrição').fill('Padaria')

  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  const dialogo = page.getByRole('alertdialog', { name: 'Descartar alterações?' })
  await expect(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page).toHaveURL(/\/lancamentos\/novo$/)
  await expect(page.getByLabel('Descrição')).toHaveValue('Padaria')
})

test('lançamento na lixeira: aviso no lugar do formulário e Restaurar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/lancamentos/9/editar')

  await expect(
    page.getByText('Este lançamento está na lixeira e não pode ser editado.', { exact: false }),
  ).toBeVisible()
  await expect(page.getByLabel('Descrição')).toHaveCount(0)
  await page.getByRole('button', { name: 'Restaurar' }).click()

  await expect(page.getByText('Restaurado como inativo. Ative para voltar ao dashboard.')).toBeVisible()
  await expect(page.getByLabel('Descrição')).toHaveValue('Lanche')
  await expect(page.getByRole('switch', { name: 'Conta no saldo' })).toHaveAttribute('aria-checked', 'false')
})
