'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'
import { formatarData, hojeIso, partesDaData } from '@/lib/data'
import { MESES } from '@/lib/format'

// Calendário do Design System (components/DatePicker): três visões no mesmo painel — dias, meses e anos.
// Átomo próprio (não usa react-day-picker): as visões de meses e anos, os nomes por extenso em português e o teclado seguem
// a preview do DS. Fluxo: ano → mês → dia. Semana começa no domingo. Datas sempre em ISO "AAAA-MM-DD" (sem fuso).
// `modo="mes"` abre direto em meses e devolve só mês/ano (para o MonthNavigator saltar de mês).

export type VisaoCalendario = 'dias' | 'meses' | 'anos'

export type CalendarProps = {
  /** Data escolhida (ISO) ou null */
  selecionado: string | null
  /** Modo dia: a pessoa escolheu um dia (ISO) */
  onSelecionar?: (iso: string) => void
  /** Modo mês: a pessoa escolheu um mês (1–12) */
  onSelecionarMes?: (mes: number, ano: number) => void
  modo?: 'dia' | 'mes'
  /** Hoje em ISO (padrão: hoje no fuso local). Útil nos testes. */
  hoje?: string
  /** Limites em ISO (padrão 01/01/2000 a 31/12/2100) */
  min?: string
  max?: string
  /** Leva o foco para o dia escolhido (ou a opção escolhida) ao montar, como ao abrir o painel */
  focarAoAbrir?: boolean
  className?: string
}

export const DATA_MINIMA = '2000-01-01'
export const DATA_MAXIMA = '2100-12-31'

const SEMANA = [
  ['D', 'domingo'],
  ['S', 'segunda-feira'],
  ['T', 'terça-feira'],
  ['Q', 'quarta-feira'],
  ['Q', 'quinta-feira'],
  ['S', 'sexta-feira'],
  ['S', 'sábado'],
] as const

const dd = (n: number) => String(n).padStart(2, '0')
const iso = (ano: number, mes: number, dia: number) => `${String(ano).padStart(4, '0')}-${dd(mes)}-${dd(dia)}`
const diasNoMes = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).getUTCDate()
const diaDaSemana = (ano: number, mes: number, dia: number) => new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()
const minusculo = (mes: number) => MESES[mes - 1].toLowerCase()

/** Soma dias ou meses a uma data (meses: o dia é limitado ao fim do mês) */
function deslocar(ano: number, mes: number, dia: number, passo: { dias?: number; meses?: number }) {
  if (passo.meses) {
    const alvo = new Date(Date.UTC(ano, mes - 1 + passo.meses, 1))
    const a = alvo.getUTCFullYear()
    const m = alvo.getUTCMonth() + 1
    return { ano: a, mes: m, dia: Math.min(dia, diasNoMes(a, m)) }
  }
  const alvo = new Date(Date.UTC(ano, mes - 1, dia + (passo.dias ?? 0)))
  return { ano: alvo.getUTCFullYear(), mes: alvo.getUTCMonth() + 1, dia: alvo.getUTCDate() }
}

const estiloDia =
  'w-full min-w-0 rounded-campo border-[1.5px] border-transparent bg-transparent p-0 text-corpo font-semibold text-foreground tabular-nums hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent'
const estiloAtual = 'border-primary font-bold text-primary'
const estiloEscolhido = 'border-primary bg-primary font-bold text-primary-foreground hover:bg-primary'

function BotaoTitulo({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="hover:bg-secondary hover:text-primary rounded-campo min-h-11 px-2 tabular-nums"
    >
      {children}
    </button>
  )
}

export function Calendar({
  selecionado,
  onSelecionar,
  onSelecionarMes,
  modo = 'dia',
  hoje = hojeIso(),
  min = DATA_MINIMA,
  max = DATA_MAXIMA,
  focarAoAbrir = false,
  className,
}: CalendarProps) {
  const partesHoje = partesDaData(hoje)
  const inicial = partesDaData(selecionado ?? (hoje < min ? min : hoje > max ? max : hoje))
  const limiteMin = partesDaData(min)
  const limiteMax = partesDaData(max)
  const escolhido = selecionado ? partesDaData(selecionado) : null

  const [visao, setVisao] = useState<VisaoCalendario>(modo === 'mes' ? 'meses' : 'dias')
  const [ano, setAno] = useState(inicial.ano)
  const [mes, setMes] = useState(inicial.mes)
  const [foco, setFoco] = useState(inicial.dia)

  const painel = useRef<HTMLDivElement>(null)
  const focarDepois = useRef<string | null>(focarAoAbrir ? '[data-foco-inicial]' : null)

  useEffect(() => {
    if (!focarDepois.current) return
    painel.current?.querySelector<HTMLElement>(focarDepois.current)?.focus()
    focarDepois.current = null
  })

  const chaveMes = (a: number, m: number) => a * 12 + m
  const mesForaDoLimite = (a: number, m: number) =>
    chaveMes(a, m) < chaveMes(limiteMin.ano, limiteMin.mes) || chaveMes(a, m) > chaveMes(limiteMax.ano, limiteMax.mes)
  const diaForaDoLimite = (a: number, m: number, d: number) => iso(a, m, d) < min || iso(a, m, d) > max
  const anoForaDoLimite = (a: number) => a < limiteMin.ano || a > limiteMax.ano

  const irParaDia = (alvo: { ano: number; mes: number; dia: number }) => {
    if (diaForaDoLimite(alvo.ano, alvo.mes, alvo.dia)) return
    setAno(alvo.ano)
    setMes(alvo.mes)
    setFoco(alvo.dia)
    focarDepois.current = `[data-dia="${alvo.dia}"]`
  }

  const trocarVisao = (nova: VisaoCalendario) => {
    setVisao(nova)
    focarDepois.current = '[data-foco-inicial]'
  }

  const anterior = () => {
    if (visao === 'dias') {
      const alvo = deslocar(ano, mes, 1, { meses: -1 })
      setAno(alvo.ano)
      setMes(alvo.mes)
    } else {
      setAno((a) => Math.max(limiteMin.ano, a - (visao === 'meses' ? 1 : 12)))
    }
  }

  const proximo = () => {
    if (visao === 'dias') {
      const alvo = deslocar(ano, mes, 1, { meses: 1 })
      setAno(alvo.ano)
      setMes(alvo.mes)
    } else {
      setAno((a) => Math.min(limiteMax.ano, a + (visao === 'meses' ? 1 : 12)))
    }
  }

  const escolherMes = (m: number) => {
    if (modo === 'mes') {
      onSelecionarMes?.(m, ano)
      return
    }
    setMes(m)
    setFoco((d) => Math.min(d, diasNoMes(ano, m)))
    trocarVisao('dias')
  }

  const escolherAno = (a: number) => {
    setAno(a)
    trocarVisao('meses')
  }

  const escolherHoje = () => {
    if (modo === 'mes') {
      onSelecionarMes?.(partesHoje.mes, partesHoje.ano)
      return
    }
    setAno(partesHoje.ano)
    setMes(partesHoje.mes)
    setFoco(partesHoje.dia)
    setVisao('dias')
    onSelecionar?.(hoje)
  }

  const aoTeclarNoDia = (evento: KeyboardEvent<HTMLButtonElement>, dia: number) => {
    const passos: Record<string, { dias?: number; meses?: number }> = {
      ArrowLeft: { dias: -1 },
      ArrowRight: { dias: 1 },
      ArrowUp: { dias: -7 },
      ArrowDown: { dias: 7 },
      PageUp: { meses: -1 },
      PageDown: { meses: 1 },
      Home: { dias: -diaDaSemana(ano, mes, dia) },
      End: { dias: 6 - diaDaSemana(ano, mes, dia) },
    }
    const passo = passos[evento.key]
    if (!passo) return
    evento.preventDefault()
    irParaDia(deslocar(ano, mes, dia, passo))
  }

  // ---------- cabeçalho ----------
  let titulo: ReactNode
  let rotulos: [string, string]
  let anteriorDesabilitado: boolean
  let proximoDesabilitado: boolean
  const inicioBloco = ano - ((((ano - 2020) % 12) + 12) % 12)

  if (visao === 'dias') {
    titulo = (
      <>
        <BotaoTitulo rotulo={`Escolher mês, ${minusculo(mes)}`} onClick={() => trocarVisao('meses')}>
          {MESES[mes - 1]}
        </BotaoTitulo>
        <BotaoTitulo rotulo={`Escolher ano, ${ano}`} onClick={() => trocarVisao('anos')}>
          {ano}
        </BotaoTitulo>
      </>
    )
    rotulos = ['Mês anterior', 'Próximo mês']
    anteriorDesabilitado = chaveMes(ano, mes) <= chaveMes(limiteMin.ano, limiteMin.mes)
    proximoDesabilitado = chaveMes(ano, mes) >= chaveMes(limiteMax.ano, limiteMax.mes)
  } else if (visao === 'meses') {
    titulo = (
      <BotaoTitulo rotulo={`Escolher ano, ${ano}`} onClick={() => trocarVisao('anos')}>
        {ano}
      </BotaoTitulo>
    )
    rotulos = ['Ano anterior', 'Próximo ano']
    anteriorDesabilitado = ano <= limiteMin.ano
    proximoDesabilitado = ano >= limiteMax.ano
  } else {
    titulo = (
      <span className="px-2">
        {inicioBloco} – {inicioBloco + 11}
      </span>
    )
    rotulos = ['Anos anteriores', 'Próximos anos']
    anteriorDesabilitado = inicioBloco <= limiteMin.ano
    proximoDesabilitado = inicioBloco + 11 >= limiteMax.ano
  }

  // ---------- corpo ----------
  let corpo: ReactNode
  if (visao === 'dias') {
    const vazios = diaDaSemana(ano, mes, 1)
    const total = diasNoMes(ano, mes)
    const focoValido = Math.min(foco, total)
    const celulas: Array<number | null> = [
      ...Array.from({ length: vazios }, () => null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ]
    while (celulas.length % 7) celulas.push(null)
    const semanas = Array.from({ length: celulas.length / 7 }, (_, i) => celulas.slice(i * 7, i * 7 + 7))

    corpo = (
      <table
        role="grid"
        aria-label={`${MESES[mes - 1]} de ${ano}`}
        className="w-full table-fixed border-separate border-spacing-0.5"
      >
        <thead>
          <tr>
            {SEMANA.map(([letra, nome]) => (
              <th
                key={nome}
                scope="col"
                aria-label={nome}
                className="text-rotulo-secao text-muted-foreground h-7 text-center"
              >
                {letra}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana, i) => (
            <tr key={i}>
              {semana.map((dia, j) => {
                if (dia === null) return <td key={`v${j}`} />
                const ehHoje = partesHoje.ano === ano && partesHoje.mes === mes && partesHoje.dia === dia
                const ehEscolhido = escolhido?.ano === ano && escolhido.mes === mes && escolhido.dia === dia
                return (
                  <td key={dia} role="gridcell" aria-selected={ehEscolhido} className="p-0 text-center">
                    <button
                      type="button"
                      data-dia={dia}
                      data-foco-inicial={dia === focoValido || undefined}
                      tabIndex={dia === focoValido ? 0 : -1}
                      disabled={diaForaDoLimite(ano, mes, dia)}
                      aria-label={`${dia} de ${minusculo(mes)} de ${ano}${ehHoje ? ', hoje' : ''}`}
                      aria-current={ehHoje ? 'date' : undefined}
                      onClick={() => {
                        setFoco(dia)
                        onSelecionar?.(iso(ano, mes, dia))
                      }}
                      onKeyDown={(e) => aoTeclarNoDia(e, dia)}
                      className={cn(
                        estiloDia,
                        'min-h-11',
                        ehHoje && estiloAtual,
                        ehEscolhido && estiloEscolhido,
                        ehHoje && ehEscolhido && 'shadow-[inset_0_0_0_2px_var(--card)]',
                      )}
                    >
                      {dia}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )
  } else if (visao === 'meses') {
    const mesEscolhido = escolhido && escolhido.ano === ano ? escolhido.mes : null
    corpo = (
      <div role="group" aria-label={`Meses de ${ano}`} className="grid grid-cols-3 gap-1">
        {MESES.map((nome, i) => {
          const m = i + 1
          const atual = partesHoje.ano === ano && partesHoje.mes === m
          const pressionado = mesEscolhido === m
          const foco = m === (mesEscolhido ?? (partesHoje.ano === ano ? partesHoje.mes : 1))
          return (
            <button
              key={nome}
              type="button"
              aria-pressed={pressionado}
              aria-label={`${nome.toLowerCase()} de ${ano}`}
              data-foco-inicial={foco || undefined}
              disabled={mesForaDoLimite(ano, m)}
              onClick={() => escolherMes(m)}
              className={cn(estiloDia, 'min-h-[52px]', atual && estiloAtual, pressionado && estiloEscolhido)}
            >
              {nome.slice(0, 3)}
            </button>
          )
        })}
      </div>
    )
  } else {
    const anoEscolhido = escolhido?.ano ?? null
    corpo = (
      <div role="group" aria-label="Anos" className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }, (_, i) => inicioBloco + i).map((a) => {
          const pressionado = anoEscolhido === a
          return (
            <button
              key={a}
              type="button"
              aria-pressed={pressionado}
              data-foco-inicial={(anoEscolhido !== null ? pressionado : a === ano) || undefined}
              disabled={anoForaDoLimite(a)}
              onClick={() => escolherAno(a)}
              className={cn(
                estiloDia,
                'min-h-[52px]',
                partesHoje.ano === a && estiloAtual,
                pressionado && estiloEscolhido,
              )}
            >
              {a}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={painel} data-slot="calendar" data-visao={visao} className={cn('flex w-full flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-1">
        <Button variant="texto" size="icone" aria-label={rotulos[0]} disabled={anteriorDesabilitado} onClick={anterior}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div aria-live="polite" className="text-titulo-3 flex min-w-0 items-center justify-center gap-0.5 tabular-nums">
          {titulo}
        </div>
        <Button variant="texto" size="icone" aria-label={rotulos[1]} disabled={proximoDesabilitado} onClick={proximo}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      {corpo}
      <div className="border-border flex items-center justify-between gap-2 border-t pt-2">
        <Button
          variant="texto"
          size="pequeno"
          onClick={escolherHoje}
          disabled={diaForaDoLimite(partesHoje.ano, partesHoje.mes, partesHoje.dia)}
        >
          Hoje
        </Button>
        {selecionado && modo === 'dia' && (
          <span className="text-legenda text-muted-foreground tabular-nums">
            Escolhida: {formatarData(selecionado)}
          </span>
        )}
      </div>
    </div>
  )
}
