import { ArrowDownRight, ArrowUpRight, Calendar } from 'lucide-react'
import type * as React from 'react'
import { Skeleton } from '@/components/atoms/skeleton'
import { cn } from '@/lib/cn'
import { formatarMesAno, formatarSaldo, nomeDoMes } from '@/lib/format'

// HighlightCard do Design System: "Saldo do mês", o card de destaque do Dashboard (MUDANCAS_RODADA2 §2).
// Claro: fundo branco (`destaque-card`) com borda; o valor e o ícone mudam de cor pelo sinal. Escuro: fundo azul e valor branco
// (os tokens `destaque-*` resolvem sozinhos). Sempre sinal + seta + cor. Zero usa a variante positiva, sem sinal ("R$ 0,00").
// A `mensagem` é a da API (RN010), mostrada como veio: descreve o saldo, nunca aconselha (RNI003).

type HighlightCardProps = Omit<React.ComponentProps<'article'>, 'children'> & {
  saldo: number
  mes: number
  ano: number
  /** `mensagem` de `GET /dashboard` */
  mensagem?: string
  carregando?: boolean
}

const CARTAO =
  'rounded-grande border border-destaque-borda bg-destaque-card text-sobre-destaque-card shadow-card p-6 flex flex-col gap-3 @container'

function HighlightCard({ saldo, mes, ano, mensagem, carregando = false, className, ...props }: HighlightCardProps) {
  if (carregando) {
    return (
      <article data-slot="highlight-card" aria-hidden="true" className={cn(CARTAO, className)} {...props}>
        <Skeleton forma="texto" claro className="w-2/5" />
        <Skeleton forma="valor" claro className="w-3/5" />
        <Skeleton forma="texto" claro className="w-4/5" />
      </article>
    )
  }

  const negativo = saldo < 0
  const Icone = negativo ? ArrowDownRight : ArrowUpRight
  const sinal = saldo > 0 ? '+ ' : ''

  return (
    <article
      data-slot="highlight-card"
      data-sinal={negativo ? 'negativo' : 'positivo'}
      aria-label={`Saldo do mês de ${nomeDoMes(mes).toLowerCase()} de ${ano}`}
      className={cn(CARTAO, 'justify-between', className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-rotulo-secao uppercase opacity-82">Saldo do mês</p>
        <span className="text-legenda inline-flex items-center gap-1 font-semibold opacity-86">
          <Calendar className="size-4" strokeWidth={1.75} aria-hidden="true" />
          {formatarMesAno(mes, ano)}
        </span>
      </div>
      <p
        className={cn(
          'flex items-center gap-2 text-[clamp(24px,10cqi,34px)] leading-[1.15] font-extrabold tracking-[-0.02em] whitespace-nowrap tabular-nums',
          negativo ? 'text-destaque-negativo' : 'text-destaque-positivo',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'rounded-icone grid size-10 shrink-0 place-items-center',
            negativo
              ? 'bg-despesa-fundo text-destaque-icone-negativo'
              : 'bg-receita-fundo text-destaque-icone-positivo',
          )}
        >
          <Icone className="size-5" strokeWidth={2} />
        </span>
        <span>
          <span className="sr-only">{negativo ? 'negativo, ' : 'positivo, '}</span>
          {sinal}
          {formatarSaldo(saldo)}
        </span>
      </p>
      {mensagem && (
        <p className="text-corpo relative pt-3 font-semibold before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-current before:opacity-24">
          {mensagem}
        </p>
      )}
    </article>
  )
}

export { HighlightCard }
export type { HighlightCardProps }
