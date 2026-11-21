'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Calendar } from '@/components/atoms/calendar'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/atoms/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover'
import { cn } from '@/lib/cn'
import { ANO_MAXIMO, ANO_MINIMO } from '@/lib/data'
import { MESES } from '@/lib/format'
import { deslocarMes } from '@/lib/periodo'
import type { MesAno } from '@/types/api'

// "‹ Novembro 2026 ›" (DS: MonthNavigator). Puro: recebe o mês e avisa a troca por `onChange`; quem guarda na URL
// (`?mes=11&ano=2026`) é o Context da tela. Com `seletor`, o nome do mês vira botão que abre o calendário do DatePicker no
// modo mês (começa nos meses, sem a visão de dias): "popover" (computador) ou "folha" (celular), como o DatePicker. Quem
// escolhe é a tela; sem `seletor`, o nome é só texto.
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
    /** O nome do mês abre o calendário no modo mês (DS): "popover" (computador) ou "folha" (celular). Sem isto, é só texto. */
    seletor?: 'popover' | 'folha'
    /** Hoje em ISO, para o "Hoje" do calendário (padrão: hoje no fuso local). Útil nos testes. */
    hoje?: string
  }

const extenso = ({ mes, ano }: MesAno) => `${MESES[mes - 1]} de ${ano}`
const dentroDoLimite = ({ ano }: MesAno) => ano >= ANO_MINIMO && ano <= ANO_MAXIMO

export function MonthNavigator({
  mes,
  ano,
  onChange,
  seletor,
  hoje,
  variante = 'padrao',
  contornado = false,
  className,
  ...props
}: MonthNavigatorProps) {
  const [anuncio, setAnuncio] = useState('')
  const [aberto, setAberto] = useState(false)
  const atual = { mes, ano }
  const anterior = deslocarMes(atual, -1)
  const proximo = deslocarMes(atual, 1)
  const nome = variante === 'compacto' ? `${MESES[mes - 1].slice(0, 3)} ${ano}` : `${MESES[mes - 1]} ${ano}`

  function irPara(novo: MesAno) {
    setAnuncio(`Mostrando ${extenso(novo)}`)
    onChange(novo)
  }

  function escolher(novoMes: number, novoAno: number) {
    setAberto(false)
    if (novoMes !== mes || novoAno !== ano) irPara({ mes: novoMes, ano: novoAno })
  }

  const calendario = (
    <Calendar
      modo="mes"
      selecionado={`${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-01`}
      onSelecionarMes={escolher}
      hoje={hoje}
      focarAoAbrir
    />
  )

  const botaoNome = (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={aberto}
      aria-label={`${extenso(atual)}. Escolher outro mês`}
      className={cn(nomeDoMes, 'hover:bg-secondary')}
      onClick={seletor === 'folha' ? () => setAberto(true) : undefined}
    >
      {nome}
    </button>
  )

  let centro: React.ReactNode
  if (seletor === 'popover') {
    centro = (
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>{botaoNome}</PopoverTrigger>
        <PopoverContent
          align="center"
          aria-label="Mês exibido"
          className="w-[min(328px,calc(100vw-2rem))]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {calendario}
        </PopoverContent>
      </Popover>
    )
  } else if (seletor === 'folha') {
    centro = (
      <>
        {botaoNome}
        <Drawer open={aberto} onOpenChange={setAberto}>
          <DrawerContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DrawerHeader>
              <DrawerTitle>Mês exibido</DrawerTitle>
              <DrawerDescription className="sr-only">Escolha o mês e o ano no calendário.</DrawerDescription>
              <DrawerClose asChild>
                <Button variant="texto" size="icone" aria-label="Fechar">
                  <X aria-hidden="true" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="px-5 pb-5">{calendario}</div>
          </DrawerContent>
        </Drawer>
      </>
    )
  } else {
    centro = (
      <span className={nomeDoMes} aria-label={extenso(atual)}>
        {nome}
      </span>
    )
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
      {centro}
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
