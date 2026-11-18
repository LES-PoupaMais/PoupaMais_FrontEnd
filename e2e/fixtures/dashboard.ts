import type { Page, Route } from '@playwright/test'

// Dados do Dashboard nas pranchetas (Novembro 2026; Julho 2026 = acima do limite; Setembro 2026 = atenção).
type Mes = { mes: number; ano: number; receitas: number; despesas: number; saldo: number }

const MESES: Mes[] = [
  { mes: 4, ano: 2026, receitas: 11600, despesas: 8240.15, saldo: 3359.85 },
  { mes: 5, ano: 2026, receitas: 11750, despesas: 7890.6, saldo: 3859.4 },
  { mes: 6, ano: 2026, receitas: 11800, despesas: 8105.3, saldo: 3694.7 },
  { mes: 7, ano: 2026, receitas: 6200, despesas: 6950.4, saldo: -750.4 },
  { mes: 8, ano: 2026, receitas: 11900, despesas: 8320.4, saldo: 3579.6 },
  { mes: 9, ano: 2026, receitas: 12050, despesas: 9870.15, saldo: 2179.85 },
  { mes: 10, ano: 2026, receitas: 12300, despesas: 7940.8, saldo: 4359.2 },
  { mes: 11, ano: 2026, receitas: 12480.5, despesas: 7560.5, saldo: 4920 },
]

const CATEGORIAS = [
  { categoriaId: 1, descricao: 'Aluguel', valor: 2200 },
  { categoriaId: 2, descricao: 'Mercado', valor: 1480.35 },
  { categoriaId: 3, descricao: 'Contas de casa', valor: 912.4 },
  { categoriaId: 4, descricao: 'Transporte', valor: 780 },
  { categoriaId: 5, descricao: 'Saúde', valor: 640.25 },
  { categoriaId: 6, descricao: 'Educação', valor: 520 },
  { categoriaId: 7, descricao: 'Restaurantes', valor: 468.9 },
  { categoriaId: 8, descricao: 'Lazer', valor: 356.6 },
  { categoriaId: 9, descricao: 'Outros', valor: 202 },
]

const MAIORES = [
  { id: 1, descricao: 'Aluguel do apartamento', valor: 2200, categorias: ['Aluguel'] },
  { id: 3, descricao: 'Mercado do mês', valor: 1120.35, categorias: ['Mercado'] },
  { id: 6, descricao: 'Plano de saúde', valor: 640.25, categorias: ['Saúde'] },
  { id: 7, descricao: 'Mensalidade da faculdade', valor: 520, categorias: ['Educação'] },
  { id: 9, descricao: 'Conta de luz', valor: 412.35, categorias: ['Contas de casa'] },
]

/** Resposta de GET /dashboard para o mês (4 meses até ele; meses sem dados = vazio) */
export function dashboardDoMes(mes: number, ano: number) {
  const indice = MESES.findIndex((m) => m.mes === mes && m.ano === ano)
  const atual = MESES[indice] ?? { mes, ano, receitas: 0, despesas: 0, saldo: 0 }
  const ultimosMeses =
    indice >= 3
      ? MESES.slice(indice - 3, indice + 1)
      : [3, 2, 1, 0].map((n) => {
          const i = ano * 12 + mes - 1 - n
          return { mes: (i % 12) + 1, ano: Math.floor(i / 12), receitas: 0, despesas: 0, saldo: 0 }
        })
  const vazio = atual.despesas === 0 && atual.receitas === 0
  const taxa = atual.receitas > 0 ? Math.round((atual.despesas / atual.receitas) * 10000) / 100 : null
  const positivo = atual.saldo >= 0
  const valorSaldo = Math.abs(atual.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  return {
    ...atual,
    taxaGasto: taxa,
    classificacaoTaxa:
      taxa === null ? null : taxa > 100 ? 'ACIMA_DO_LIMITE' : taxa >= 70 ? 'ATENCAO' : 'DENTRO_DO_LIMITE',
    mensagem: vazio
      ? 'Ainda não há lançamentos neste mês.'
      : positivo
        ? `Você fechou o mês com R$ ${valorSaldo} positivos.`
        : `Suas despesas passaram as receitas em R$ ${valorSaldo} neste mês.`,
    ultimosMeses,
    despesasPorCategoria: vazio ? [] : CATEGORIAS,
    maioresDespesas: vazio ? [] : MAIORES,
    pesoMaioresDespesas: vazio ? { valor: 0, percentual: null } : { valor: 4892.95, percentual: 64.72 },
  }
}

/** Simula GET /api/dashboard?mes&ano. `falhar` devolve 500 (até chamar `voltar`). */
export async function simularDashboard(page: Page, opcoes: { falhar?: boolean } = {}) {
  const estado = { falhar: opcoes.falhar ?? false }
  await page.route('**/api/dashboard?*', (rota: Route) => {
    if (estado.falhar) return rota.fulfill({ status: 500, json: { status: 500, mensagem: 'Erro interno' } })
    const url = new URL(rota.request().url())
    return rota.fulfill({
      json: dashboardDoMes(Number(url.searchParams.get('mes')), Number(url.searchParams.get('ano'))),
    })
  })
  return { voltar: () => (estado.falhar = false) }
}
