'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { ANO_MAXIMO, ANO_MINIMO } from '@/lib/data'
import { MESES } from '@/lib/format'
import { deslocarMes } from '@/lib/periodo'
import type { MesAno } from '@/types/api'

// "‹ Novembro 2026 ›" (DS: MonthNavigator). Puro: recebe o mês e avisa a troca por `onChange`; quem guarda na URL
// (`?mes=11&ano=2026`) é o Context da tela. O nome do mês abre o DatePicker no modo mês quando a tela passa
// `onEscolherMes`; sem ele, o nome é só texto.
const navegadorVariants = cva('inline-flex items-center', {
  variants: {
    variante: {
      /** cabeçalho das telas no tablet e no computador: "Novembro 2026", 17px */
      padrao: 'gap-1',
      /** dentro da TopBar do celular: "Nov 2026", 15px, setas de 32px com alvo de 44px */
      compacto: 'gap-0',
    },
    contornado: {
      /** sobre a barra de filtros */
      true: 'border-border bg-card rounded-pilula border',
      false: '',
    },
  },
  defaultVariants: { variante: 'padrao', contornado: false },
})

const seta =
  'rounded-pilula text-foreground hover:enabled:bg-secondary relative inline-grid size-11 shrink-0 place-items-center disabled:cursor-not-allowed disabled:opacity-45 group-data-[variante=compacto]/mes:-mx-1.5'

const nomeDoMes =
  'rounded-pilula text-foreground text-titulo-3 inline-flex min-h-11 min-w-42 items-center justify-center px-3 tabular-nums group-data-[variante=compacto]/mes:min-w-0 group-data-[variante=compacto]/mes:px-2 group-data-[variante=compacto]/mes:text-[15px] group-data-[variante=compacto]/mes:leading-[22px]'

export type MonthNavigatorProps = Omit<React.ComponentProps<'nav'>, 'onChange'> &
  VariantProps<typeof navegadorVariants> & {
    mes: number
    ano: number
    onChange: (periodo: MesAno) => void
    /** Abre o DatePicker no modo mês (DS). Sem isto, o nome do mês não é botão. */
    onEscolherMes?: () => void
  }

const extenso = ({ mes, ano }: MesAno) => `${MESES[mes - 1]} de ${ano}`
const dentroDoLimite = ({ ano }: MesAno) => ano >= ANO_MINIMO && ano <= ANO_MAXIMO

export function MonthNavigator({
  mes,
  ano,
  onChange,
  onEscolherMes,
  variante = 'padrao',
  contornado = false,
  className,
  ...props
}: MonthNavigatorProps) {
  const [anuncio, setAnuncio] = useState('')
  const atual = { mes, ano }
  const anterior = deslocarMes(atual, -1)
  const proximo = deslocarMes(atual, 1)
  const nome = variante === 'compacto' ? `${MESES[mes - 1].slice(0, 3)} ${ano}` : `${MESES[mes - 1]} ${ano}`

  function irPara(novo: MesAno) {
    setAnuncio(`Mostrando ${extenso(novo)}`)
    onChange(novo)
  }

  return (
    <nav
      aria-label="Mês exibido"
      data-slot="month-navigator"
      data-variante={variante}
      className={cn('group/mes', navegadorVariants({ variante, contornado }), className)}
      {...props}
    >
      <button
        type="button"
        aria-label="Mês anterior"
        className={seta}
        disabled={!dentroDoLimite(anterior)}
        onClick={() => irPara(anterior)}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      {onEscolherMes ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`${extenso(atual)}. Escolher outro mês`}
          className={cn(nomeDoMes, 'hover:bg-secondary')}
          onClick={onEscolherMes}
        >
          {nome}
        </button>
      ) : (
        <span className={nomeDoMes} aria-label={extenso(atual)}>
          {nome}
        </span>
      )}
      <button
        type="button"
        aria-label="Próximo mês"
        className={seta}
        disabled={!dentroDoLimite(proximo)}
        onClick={() => irPara(proximo)}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        {anuncio}
      </span>
    </nav>
  )
}

export { navegadorVariants }
