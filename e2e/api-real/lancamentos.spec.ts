import { readFile } from 'node:fs/promises'
import {
  alterarStatus,
  buscarDashboard,
  buscarLancamento,
  categoria,
  criarLancamento,
  listarCategorias,
  listarLancamentos,
} from './apoio/api'
import { ANO, expect, MES, PERIODO, test } from './apoio/teste'

// Roteiro da demo contra a API real. Cada teste usa um usuário novo e monta os dados que precisa pela API (apoio/api.ts);
// o que o teste prova passa pela tela. Mês fixo: outubro de 2026.
test.use({ viewport: { width: 1280, height: 900 } })

const tabela = (page: import('@playwright/test').Page) => page.getByRole('table')
const barraDeFiltros = (page: import('@playwright/test').Page) =>
  page.getByRole('search', { name: 'Filtrar lançamentos' })

test('1–2. cria a categoria pelo campo e salva o lançamento com duas categorias e data', async ({ page, logado }) => {
  await categoria(logado, 'Mercado')
  await page.goto('/lancamentos/novo')

  await page.getByLabel('Descrição').fill('Remédios')
  await page.getByRole('radio', { name: 'Despesa' }).click()
  await page.getByLabel('Data').fill(`05/${MES}/${ANO}`)
  await page.getByLabel('Valor').fill('86,40')

  // Já existe (409 da API, sem diferenciar maiúsculas): a mensagem da API aparece no diálogo
  await page.getByRole('button', { name: 'Abrir lista de categorias' }).click()
  await page.getByRole('searchbox', { name: 'Buscar categoria' }).fill('mercado')
  await page.getByRole('button', { name: 'Criar "mercado"' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Nova categoria' })
  await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
  await expect(dialogo.getByText('Já existe uma categoria com essa descrição')).toBeVisible()

  await dialogo.getByLabel('Nome da categoria').fill('Farmácia')
  await dialogo.getByRole('button', { name: 'Criar categoria' }).click()
  await expect(dialogo).toBeHidden()
  await expect(page.getByText('Categoria "Farmácia" criada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover Farmácia' })).toBeVisible()

  await page.getByRole('button', { name: 'Abrir lista de categorias' }).click()
  await page.getByRole('checkbox', { name: 'Mercado' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Salvar lançamento' }).click()

  await expect(page).toHaveURL(new RegExp(`/lancamentos\\?${PERIODO}$`))
  await expect(page.getByText('Lançamento salvo')).toBeVisible()
  const linha = tabela(page).getByRole('row', { name: /Remédios/ })
  await expect(linha).toContainText('05/10/2026')
  await expect(linha).toContainText('86,40')
  await expect(linha).toContainText('Farmácia')
  await expect(linha).toContainText('Mercado')

  // O que ficou gravado na API
  const [gravado] = await listarLancamentos(logado, { mes: String(MES), ano: String(ANO) })
  expect(gravado).toMatchObject({
    descricao: 'Remédios',
    tipo: 'DESPESA',
    data: '2026-10-05',
    valor: 86.4,
    status: 'ATIVO',
  })
  expect(gravado.categorias.map((c) => c.descricao).sort()).toEqual(['Farmácia', 'Mercado'])
  const categorias = (await listarCategorias(logado)).map((c) => c.descricao)
  expect(categorias.filter((d) => d === 'Farmácia' || d === 'Mercado')).toHaveLength(2)
})

test('3. importa um CSV com uma linha inválida e mostra a linha e o motivo vindos da API', async ({ page, logado }) => {
  await categoria(logado, 'Mercado')
  const csv = [
    'descricao;tipo;data;valor;categorias',
    `Mercado do mês;DESPESA;05/${MES}/${ANO};1.120,35;Mercado`,
    'Padaria;DESPESA;31/02/2026;32,50;Mercado',
    `Ração;DESPESA;10/${MES}/${ANO};89,90;Pet|Mercado`,
  ].join('\n')
  await page.goto('/lancamentos/importar')

  await page.getByLabel('Escolher arquivo').setInputFiles({
    name: 'lancamentos-outubro.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await page.getByRole('button', { name: 'Importar lançamentos' }).click()

  await expect(page.getByRole('heading', { name: 'Importação concluída' })).toBeVisible()
  const resumo = page.getByRole('status').filter({ hasText: 'importados' })
  await expect(resumo).toContainText('2 lançamentos importados')
  await expect(resumo).toContainText('1 linha ignorada')
  const falha = page.getByRole('table', { name: 'Linhas ignoradas' }).getByRole('row', { name: /Linha 3/ })
  await expect(falha).toContainText('Padaria')
  await expect(falha).not.toHaveText(/Linha 3\s*$/) // o motivo da API aparece junto
  await expect(page.getByText('Pet', { exact: true })).toBeVisible() // categoria criada na importação

  await page.goto(`/lancamentos?${PERIODO}`)
  await expect(barraDeFiltros(page).getByRole('status')).toHaveText('2 lançamentos')
  await expect(tabela(page).getByRole('link', { name: 'Ver Mercado do mês' })).toBeVisible()
  await expect(tabela(page).getByRole('row', { name: /Ração/ })).toContainText('Pet')
})

test('4–5. filtra, tira do saldo e o dashboard acompanha', async ({ page, logado }) => {
  const casa = await categoria(logado, 'Casa')
  const salario = await categoria(logado, 'Salário')
  await criarLancamento(logado, {
    descricao: 'Salário',
    tipo: 'RECEITA',
    data: `${ANO}-10-01`,
    valor: 5000,
    categoriaIds: [salario],
  })
  const mercado = await criarLancamento(logado, {
    descricao: 'Mercado do mês',
    tipo: 'DESPESA',
    data: `${ANO}-10-05`,
    valor: 1000,
    categoriaIds: [casa],
  })
  await criarLancamento(logado, {
    descricao: 'Conta de luz',
    tipo: 'DESPESA',
    data: `${ANO}-10-08`,
    valor: 200,
    categoriaIds: [casa],
  })

  await page.goto(`/dashboard?${PERIODO}`)
  const saldo = page.getByRole('article', { name: 'Saldo do mês de outubro de 2026' })
  await expect(saldo).toContainText('R$ 3.800,00')
  await expect(page.getByRole('list', { name: 'Resumo de outubro de 2026' })).toContainText('R$ 1.200,00')

  await page.goto(`/lancamentos?${PERIODO}`)
  const barra = barraDeFiltros(page)
  await expect(barra.getByRole('status')).toHaveText('3 lançamentos')
  await barra.getByLabel('Buscar').fill('mercado')
  await expect(page).toHaveURL(/q=mercado/)
  await expect(barra.getByRole('status')).toHaveText('1 lançamento')
  await barra.getByRole('combobox', { name: 'Tipo' }).click()
  await page.getByRole('option', { name: 'Despesa' }).click()
  await expect(page).toHaveURL(/tipo=DESPESA/)
  await expect(barra.getByRole('status')).toHaveText('1 lançamento')

  const chave = tabela(page).getByRole('switch', { name: 'Conta no saldo: Mercado do mês' })
  await expect(chave).toBeChecked()
  await chave.click()
  await expect(page.getByText('Lançamento fora do saldo. Ele continua na lista.')).toBeVisible()
  await expect(chave).not.toBeChecked()
  await expect.poll(async () => (await buscarLancamento(logado, mercado.id)).status).toBe('INATIVO')

  // Dashboard atualizado: a despesa fora do saldo sai da conta (RN003/RN004)
  await page.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).first().click()
  await expect(page).toHaveURL(/\/dashboard\?mes=10&ano=2026/)
  await expect(saldo).toContainText('R$ 4.800,00')
  await expect(page.getByRole('list', { name: 'Resumo de outubro de 2026' })).toContainText('R$ 200,00')
  expect(await buscarDashboard(logado, MES, ANO)).toMatchObject({ receitas: 5000, despesas: 200, saldo: 4800 })
})

test('lixeira: o Desfazer volta ao status anterior e o Restaurar da lixeira também', async ({ page, logado }) => {
  const casa = await categoria(logado, 'Casa')
  const foraDoSaldo = await criarLancamento(logado, {
    descricao: 'Academia',
    tipo: 'DESPESA',
    data: `${ANO}-10-03`,
    valor: 120,
    categoriaIds: [casa],
  })
  await alterarStatus(logado, foraDoSaldo.id, 'INATIVO')
  const noSaldo = await criarLancamento(logado, {
    descricao: 'Feira',
    tipo: 'DESPESA',
    data: `${ANO}-10-04`,
    valor: 80,
    categoriaIds: [casa],
  })

  await page.goto(`/lancamentos?${PERIODO}`)
  const barra = barraDeFiltros(page)
  await expect(barra.getByRole('status')).toHaveText('2 lançamentos')

  // Mover (DELETE na hora) e Desfazer: o inativo volta INATIVO
  await tabela(page).getByRole('button', { name: 'Mover Academia para a lixeira' }).click()
  await expect(tabela(page).getByRole('link', { name: 'Ver Academia' })).toBeHidden()
  await expect.poll(async () => (await buscarLancamento(logado, foraDoSaldo.id)).status).toBe('DELETADO')
  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(tabela(page).getByRole('switch', { name: 'Conta no saldo: Academia' })).not.toBeChecked()
  await expect.poll(async () => (await buscarLancamento(logado, foraDoSaldo.id)).status).toBe('INATIVO')

  // Mover sem desfazer: vai para a lixeira e some da lista
  await tabela(page).getByRole('button', { name: 'Mover Feira para a lixeira' }).click()
  await expect(tabela(page).getByRole('link', { name: 'Ver Feira' })).toBeHidden()
  await expect(barra.getByRole('status')).toHaveText('1 lançamento')
  await expect.poll(async () => (await buscarLancamento(logado, noSaldo.id)).status).toBe('DELETADO')

  // Lixeira: Restaurar devolve ATIVO (o status de antes) e ele volta ao saldo
  await barra.getByRole('radio', { name: 'Lixeira' }).click()
  await expect(page).toHaveURL(/\/lancamentos\/lixeira$/)
  await expect(page.getByText('1 lançamento na lixeira').filter({ visible: true })).toBeVisible()
  await tabela(page).getByRole('button', { name: 'Restaurar Feira' }).click()
  await expect(page.getByText('Lançamento restaurado', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A lixeira está vazia' })).toBeVisible()
  expect(await buscarLancamento(logado, noSaldo.id)).toMatchObject({ status: 'ATIVO', dataExclusao: null })
  expect(await buscarDashboard(logado, MES, ANO)).toMatchObject({ despesas: 80 })
})

test('6. exporta em CSV com os filtros ativos', async ({ page, logado }) => {
  const casa = await categoria(logado, 'Casa')
  const salario = await categoria(logado, 'Salário')
  await criarLancamento(logado, {
    descricao: 'Salário',
    tipo: 'RECEITA',
    data: `${ANO}-10-01`,
    valor: 5000,
    categoriaIds: [salario],
  })
  await criarLancamento(logado, {
    descricao: 'Mercado do mês',
    tipo: 'DESPESA',
    data: `${ANO}-10-05`,
    valor: 1120.35,
    categoriaIds: [casa, salario],
    status: 'INATIVO',
  })

  await page.goto(`/lancamentos?${PERIODO}&tipo=DESPESA`)
  await barraDeFiltros(page).getByRole('button', { name: 'Exportar' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Exportar lançamentos' })
  await expect(
    dialogo.getByText('O arquivo segue os filtros ativos: Outubro 2026 · Despesa · Todos os status'),
  ).toBeVisible()
  await dialogo.getByRole('radio', { name: 'CSV' }).click()
  const download = page.waitForEvent('download')
  await dialogo.getByRole('button', { name: 'Baixar arquivo' }).click()
  const arquivo = await download
  await expect(page.getByText('Arquivo exportado')).toBeVisible()

  expect(arquivo.suggestedFilename()).toMatch(/\.csv$/)
  const conteudo = await readFile((await arquivo.path())!, 'utf8')
  const linhas = conteudo.replace(/^﻿/, '').trim().split(/\r?\n/)
  expect(linhas[0].toLowerCase()).toContain('status')
  expect(linhas).toHaveLength(2) // cabeçalho + a despesa (a receita ficou fora pelo filtro)
  expect(linhas[1]).toContain('Mercado do mês')
  expect(linhas[1]).toContain('05/10/2026')
  expect(linhas[1]).toContain('INATIVO')
})
