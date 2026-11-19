import { MENOS, nomeDoMes } from './format'

// Escala dos gráficos do Dashboard (DS: Gráficos.md). O eixo começa no zero e tem 3 marcas redondas além dele;
// o passo é o menor valor redondo (1, 2, 2,5 ou 5 × 10ⁿ) que cobre os dados. Com valores negativos (saldo mensal),
// as marcas descem abaixo do zero e o intervalo inteiro cabe em 3 passos.

const MULTIPLOS = [1, 2, 2.5, 5] as const
/** Passo mínimo quando não há valor (mês zerado): "R$ 0 · R$ 1 mil · R$ 2 mil · R$ 3 mil" */
const PASSO_MINIMO = 1000
const INTERVALOS = 3

function intervalosNecessarios(minimo: number, maximo: number, passo: number): number {
  return Math.ceil(maximo / passo - 1e-9) - Math.floor(minimo / passo + 1e-9)
}

/** Marcas do eixo, do menor para o maior, sempre com o zero. Ex.: (0, 12480.5) → [0, 5000, 10000, 15000] */
export function marcasDoEixo(valores: readonly number[]): number[] {
  const minimo = Math.min(0, ...valores)
  const maximo = Math.max(0, ...valores)
  if (minimo === 0 && maximo === 0) return [0, PASSO_MINIMO, PASSO_MINIMO * 2, PASSO_MINIMO * 3]

  const amplitude = maximo - minimo
  let expoente = Math.floor(Math.log10(amplitude / INTERVALOS))
  let passo = 0
  while (!passo) {
    for (const multiplo of MULTIPLOS) {
      const candidato = multiplo * 10 ** expoente
      if (intervalosNecessarios(minimo, maximo, candidato) <= INTERVALOS) {
        passo = candidato
        break
      }
    }
    expoente += 1
  }

  // Completa até 3 intervalos: primeiro para cima (o lado positivo é o mais comum), sem cortar o zero
  let inicio = Math.floor(minimo / passo + 1e-9)
  let fim = Math.ceil(maximo / passo - 1e-9)
  while (fim - inicio < INTERVALOS) {
    if (maximo > 0 || inicio === 0) fim += 1
    else inicio -= 1
  }
  const marcas: number[] = []
  for (let i = inicio; i <= fim; i += 1) marcas.push(Math.round(i * passo * 100) / 100)
  return marcas
}

const numeroCurto = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Rótulo da marca: 0 → "R$ 0", 5000 → "R$ 5 mil", 2500 → "R$ 2,5 mil", −2000 → "R$ −2 mil", 1_500_000 → "R$ 1,5 mi" */
export function formatarMarca(valor: number): string {
  const absoluto = Math.abs(valor)
  const sinal = valor < 0 ? MENOS : ''
  if (absoluto >= 1_000_000) return `R$ ${sinal}${numeroCurto.format(absoluto / 1_000_000)} mi`
  if (absoluto >= 1000) return `R$ ${sinal}${numeroCurto.format(absoluto / 1000)} mil`
  return `R$ ${sinal}${numeroCurto.format(absoluto)}`
}

/** Mês abreviado do eixo X: 8 → "Ago" */
export function mesAbreviado(mes: number): string {
  return nomeDoMes(mes).slice(0, 3)
}

type MesDoGrafico = { mes: number; ano: number }

/** Período dos gráficos: "Ago a Nov/2026"; virando o ano, "Nov/2025 a Fev/2026" */
export function formatarIntervaloMeses(meses: readonly MesDoGrafico[]): string {
  if (meses.length === 0) return ''
  const primeiro = meses[0]
  const ultimo = meses[meses.length - 1]
  if (primeiro.mes === ultimo.mes && primeiro.ano === ultimo.ano) return `${mesAbreviado(ultimo.mes)}/${ultimo.ano}`
  const inicio =
    primeiro.ano === ultimo.ano ? mesAbreviado(primeiro.mes) : `${mesAbreviado(primeiro.mes)}/${primeiro.ano}`
  return `${inicio} a ${mesAbreviado(ultimo.mes)}/${ultimo.ano}`
}

/** Mês por extenso para tabelas acessíveis: (8, 2026) → "Agosto de 2026" */
export function mesPorExtenso(mes: number, ano: number): string {
  return `${nomeDoMes(mes)} de ${ano}`
}

/** Intervalo por extenso para a legenda da tabela: "de agosto a novembro de 2026" */
export function intervaloPorExtenso(meses: readonly MesDoGrafico[]): string {
  if (meses.length === 0) return ''
  const primeiro = meses[0]
  const ultimo = meses[meses.length - 1]
  const nome = (m: MesDoGrafico) => nomeDoMes(m.mes).toLowerCase()
  if (primeiro.ano === ultimo.ano) return `de ${nome(primeiro)} a ${nome(ultimo)} de ${ultimo.ano}`
  return `de ${nome(primeiro)} de ${primeiro.ano} a ${nome(ultimo)} de ${ultimo.ano}`
}

const valorSemMoeda = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Rótulo da barra do saldo: "+4.920,00" ou "−750,40" (zero sem sinal: "0,00") */
export function formatarSaldoCurto(valor: number): string {
  const texto = valorSemMoeda.format(Math.abs(valor))
  if (valor > 0) return `+${texto}`
  if (valor < 0) return `${MENOS}${texto}`
  return texto
}
