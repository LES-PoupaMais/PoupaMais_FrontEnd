const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Sinal de menos tipográfico (U+2212): o Design System usa "−", não o hífen. */
export const MENOS = '−'

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

/** A API manda número (o back usa BigDecimal); aceita também a string decimal "1120.35". */
export type ValorMonetario = number | string

function paraNumero(valor: ValorMonetario): number {
  const numero = typeof valor === 'string' ? Number(valor) : valor
  if (!Number.isFinite(numero)) {
    throw new RangeError(`Valor inválido: ${valor}`)
  }
  return numero
}

/** 8500 → "R$ 8.500,00" (sempre com centavos; negativo sai com "-" do Intl: prefira formatarSaldo) */
export function formatarMoeda(valor: ValorMonetario): string {
  return moeda.format(paraNumero(valor))
}

/** Valor de lançamento: "+ R$ 8.500,00" (receita) ou "− R$ 680,00" (despesa). O sinal vem do tipo, nunca do número. */
export function formatarValorComSinal(valor: ValorMonetario, tipo: 'RECEITA' | 'DESPESA'): string {
  return `${tipo === 'RECEITA' ? '+' : MENOS} ${formatarMoeda(Math.abs(paraNumero(valor)))}`
}

/** Totais e saldo (neutro): "R$ 4.920,00" ou "− R$ 750,40" */
export function formatarSaldo(valor: ValorMonetario): string {
  const numero = paraNumero(valor)
  return numero < 0 ? `${MENOS} ${formatarMoeda(Math.abs(numero))}` : formatarMoeda(numero)
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

/** (11, 2026) → "Novembro 2026" (mês do filtro, no topo do Dashboard e de Lançamentos) */
export function formatarMesAno(mes: number, ano: number): string {
  return `${nomeDoMes(mes)} ${ano}`
}

const porcentagem = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Taxa e participação: 60.6 → "60,6%", 52 → "52%", 112 → "112%" (até uma casa, sem arredondar a faixa: ela vem da API) */
export function formatarPorcentagem(valor: number): string {
  if (!Number.isFinite(valor)) throw new RangeError(`Porcentagem inválida: ${valor}`)
  return `${porcentagem.format(valor)}%`
}

/** Soma valores monetários em centavos (sem erro de ponto flutuante): ['186.40', 127.8] → 314.2 */
export function somarValores(valores: readonly ValorMonetario[]): number {
  return valores.reduce<number>((total, valor) => total + Math.round(paraNumero(valor) * 100), 0) / 100
}
