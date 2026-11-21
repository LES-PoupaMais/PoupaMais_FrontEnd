import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'
import { formatarInstante } from '@/lib/data'

// Timeline do Design System: linha do tempo vertical e neutra (sem cor de função), da mais recente para a mais antiga.
// Uso atual: auditoria do lançamento (Criado, Alterado, Movido para a lixeira, Restaurado), com data e hora
// "05/11/2026 às 19:42" no fuso de quem vê. O primeiro item recebe o destaque (marca em primária).
// Lista ordenada com rótulo; datas em <time datetime>; ícones decorativos.

type ItemDaTimeline = {
  id?: string | number
  icone: LucideIcon
  /** O que aconteceu ("Criado", "Movido para a lixeira") */
  titulo: string
  /** Instante ISO (ex.: "2026-11-05T22:42:00Z") */
  quando: string
  detalhe?: React.ReactNode
}

type TimelineItemProps = Omit<React.ComponentProps<'li'>, 'children'> & {
  item: ItemDaTimeline
  atual?: boolean
}

function TimelineItem({ item, atual = false, className, ...props }: TimelineItemProps) {
  const { icone: Icone, titulo, quando, detalhe } = item
  return (
    <li
      data-slot="timeline-item"
      data-atual={atual || undefined}
      className={cn(
        'relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 pb-5 last:pb-0',
        'before:bg-border before:absolute before:top-8.5 before:bottom-0.5 before:left-[15px] before:w-0.5 before:rounded-[1px] last:before:hidden',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'rounded-pilula border-card grid size-8 place-items-center border-2',
          atual ? 'bg-accent text-primary' : 'bg-secondary text-muted-foreground',
        )}
      >
        <Icone className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 pt-1">
        <p className="text-corpo-forte">{titulo}</p>
        <time dateTime={quando} className="text-legenda text-muted-foreground tabular-nums">
          {formatarInstante(quando)}
        </time>
        {detalhe && <p className="text-legenda text-muted-foreground">{detalhe}</p>}
      </div>
    </li>
  )
}

type TimelineProps = Omit<React.ComponentProps<'ol'>, 'children'> & {
  /** Já ordenados do mais recente para o mais antigo */
  itens: readonly ItemDaTimeline[]
}

/** Dê um nome à lista com `aria-labelledby` (título da seção) ou `aria-label`. */
function Timeline({ itens, className, ...props }: TimelineProps) {
  return (
    <ol data-slot="timeline" className={cn('m-0 list-none p-0', className)} {...props}>
      {itens.map((item, indice) => (
        <TimelineItem key={item.id ?? `${item.titulo}-${item.quando}`} item={item} atual={indice === 0} />
      ))}
    </ol>
  )
}

export { Timeline, TimelineItem }
export type { ItemDaTimeline, TimelineItemProps, TimelineProps }
