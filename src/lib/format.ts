const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

/** 8500 → "R$ 8.500,00" */
export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

/** Valor da listagem de lançamentos: "+R$ 8.500,00" (receita) ou "-R$ 680,00" (despesa) */
export function formatarValorComSinal(valor: number, tipo: 'RECEITA' | 'DESPESA'): string {
  return `${tipo === 'RECEITA' ? '+' : '-'}${formatarMoeda(Math.abs(valor))}`
}

/** 8 → "Agosto" */
export function nomeDoMes(mes: number): string {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new RangeError(`Mês inválido: ${mes}`)
  }
  return MESES[mes - 1]
}

/** (8, 2026) → "Ago/2026" */
export function formatarPeriodo(mes: number, ano: number): string {
  return `${nomeDoMes(mes).slice(0, 3)}/${ano}`
}
