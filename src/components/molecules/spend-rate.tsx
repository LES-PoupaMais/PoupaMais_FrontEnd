import { cva } from 'class-variance-authority'
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'
import { formatarPorcentagem } from '@/lib/format'
import type { ClassificacaoTaxa } from '@/types/api'

// SpendRate do Design System (Taxa de gasto, RN010), igual à preview aprovada:
// rótulo + número no topo, barra de 0 a 100% com a marca em 70%, escala "0% · 70% · 100%", faixa (ícone + texto) e a explicação neutra.
// Nunca só cor: número + ícone + texto da faixa sempre juntos. A faixa vem da API (`classificacaoTaxa`); o front não recalcula.
// Acima de 100% a barra fica cheia e o número mostra o valor real ("112%"). `taxa` null → "—" e "Não disponível para o período".

type Estado = 'dentro' | 'atencao' | 'acima' | 'indisponivel' | 'sem-faixa'

const preenchidoVariants = cva('absolute inset-y-0 left-0 max-w-full rounded-pilula', {
  variants: {
    estado: {
      dentro: 'bg-receita-grafico',
      atencao: 'bg-atencao',
      acima: 'bg-despesa-grafico',
      indisponivel: 'hidden',
      'sem-faixa': 'bg-muted-foreground',
    },
  },
})

const faixaVariants = cva('flex items-center gap-2 text-legenda font-bold', {
  variants: {
    estado: {
      dentro: 'text-receita',
      atencao: 'text-atencao',
      acima: 'text-despesa',
      indisponivel: 'text-muted-foreground',
      'sem-faixa': 'text-muted-foreground',
    },
  },
})

const FAIXA: Record<Exclude<Estado, 'sem-faixa'>, { texto: string; Icone: LucideIcon }> = {
  dentro: { texto: 'Dentro do limite', Icone: CircleCheck },
  atencao: { texto: 'Atenção', Icone: TriangleAlert },
  acima: { texto: 'Acima do limite', Icone: CircleAlert },
  indisponivel: { texto: 'Não disponível para o período', Icone: Info },
}

const ESTADO_DA_CLASSIFICACAO: Record<ClassificacaoTaxa, Estado> = {
  DENTRO_DO_LIMITE: 'dentro',
  ATENCAO: 'atencao',
  ACIMA_DO_LIMITE: 'acima',
}

/** Marca de referência da RN010 (70%) */
const MARCA = 70

type SpendRateProps = Omit<React.ComponentProps<'article'>, 'children'> & {
  /** Taxa em % (despesas ÷ receitas × 100) ou `null` (mês sem receitas) */
  taxa: number | null
  classificacao: ClassificacaoTaxa | null
  rotulo?: string
  /** Sem a superfície de card (quando já está dentro de um card) */
  semCartao?: boolean
}

function explicacao(estado: Estado, taxa: string): string {
  if (estado === 'indisponivel') return 'Não há receitas neste mês, então a taxa não é calculada.'
  if (estado === 'acima') return `Você gastou ${taxa} do que recebeu: as despesas passaram as receitas.`
  return `Você gastou ${taxa} do que recebeu.`
}

function SpendRate({
  taxa,
  classificacao,
  rotulo = 'Taxa de gasto',
  semCartao = false,
  className,
  ...props
}: SpendRateProps) {
  const estado: Estado =
    taxa === null ? 'indisponivel' : classificacao ? ESTADO_DA_CLASSIFICACAO[classificacao] : 'sem-faixa'
  const textoTaxa = taxa === null ? '' : formatarPorcentagem(taxa)
  const preenchido = taxa === null ? 0 : Math.min(100, Math.max(0, taxa))
  const faixa = estado === 'sem-faixa' ? null : FAIXA[estado]

  return (
    <article
      data-slot="spend-rate"
      data-estado={estado}
      className={cn(
        'flex flex-col gap-3',
        !semCartao && 'rounded-card border-border bg-card text-card-foreground shadow-card border p-5',
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-rotulo-campo text-muted-foreground">{rotulo}</p>
        <p className={cn('text-valor-tile tabular-nums', estado === 'indisponivel' && 'text-muted-foreground')}>
          {taxa === null ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Sem valor</span>
            </>
          ) : (
            textoTaxa
          )}
        </p>
      </div>

      <div aria-hidden="true">
        <div data-slot="spend-rate-trilho" className="rounded-pilula bg-secondary relative h-2.5">
          {estado !== 'indisponivel' && (
            <>
              <div className={preenchidoVariants({ estado })} style={{ width: `${preenchido}%` }} />
              <span
                data-slot="spend-rate-marca"
                className="bg-muted-foreground absolute -top-1 -bottom-1 -ml-px w-0.5 rounded-[1px]"
                style={{ left: `${MARCA}%` }}
              />
            </>
          )}
        </div>
      </div>

      {estado !== 'indisponivel' && (
        <div
          aria-hidden="true"
          className="text-muted-foreground relative h-4 text-[11px] leading-4 font-bold tabular-nums"
        >
          <span className="absolute top-0 left-0">0%</span>
          <span className="absolute top-0 -translate-x-1/2" style={{ left: `${MARCA}%` }}>
            {MARCA}%
          </span>
          <span className="absolute top-0 right-0">100%</span>
        </div>
      )}

      {faixa && (
        <p className={faixaVariants({ estado })}>
          <faixa.Icone className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {faixa.texto}
        </p>
      )}
      <p className="text-legenda text-muted-foreground">{explicacao(estado, textoTaxa)}</p>
    </article>
  )
}

export { SpendRate }
export type { SpendRateProps }
