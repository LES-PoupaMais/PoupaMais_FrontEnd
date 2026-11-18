'use client'

import { Plus, X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Chip do Design System (components/Chip): pílula compacta, 36px visuais com alvo de 44px. Categorias são SEMPRE neutras
// (a cor diferencia tipos, não instâncias). Para chip que liga/desliga (filtro ou seleção), use `FilterChip`.

/** Classe base dos chips (também usada pelo FilterChip) */
export const estiloChip =
  'relative inline-flex max-w-full min-h-9 items-center gap-1 rounded-pilula border-[1.5px] border-border bg-secondary px-3 text-legenda font-semibold text-foreground after:absolute after:-inset-x-0.5 after:-inset-y-1'

export type ChipProps = Omit<ComponentProps<'span'>, 'children'> & {
  children: ReactNode
  /** Ícone (ou avatar de 24px) à esquerda */
  icon?: ReactNode
  /** Mostra o × e chama ao remover */
  onRemove?: () => void
  /** Nome do botão ×; padrão "Remover <texto>" quando o texto é string */
  removerLabel?: string
  /** Filtro aplicado (abaixo do botão Filtros no celular): fundo primária-fundo com borda primária */
  ativo?: boolean
  disabled?: boolean
}

export function Chip({
  children,
  icon,
  onRemove,
  removerLabel,
  ativo = false,
  disabled,
  className,
  ...props
}: ChipProps) {
  const nomeRemover = removerLabel ?? (typeof children === 'string' ? `Remover ${children}` : 'Remover')
  return (
    <span
      data-slot="chip"
      data-ativo={ativo || undefined}
      className={cn(
        estiloChip,
        'cursor-default after:hidden',
        onRemove && 'pr-1',
        ativo && 'border-primary bg-accent text-primary',
        disabled && 'opacity-45',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={nomeRemover}
          className={cn(
            'text-muted-foreground hover:bg-border hover:text-foreground rounded-pilula relative inline-grid size-7 shrink-0 place-items-center after:absolute after:-inset-2 disabled:cursor-not-allowed',
            ativo && 'text-primary hover:bg-card hover:text-primary',
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

export type ChipAcaoProps = ComponentProps<'button'>

/** "+ Adicionar": borda tracejada, abre a criação de uma opção nova */
export function ChipAcao({ children, className, type = 'button', ...props }: ChipAcaoProps) {
  return (
    <button
      type={type}
      data-slot="chip-acao"
      className={cn(
        estiloChip,
        'border-input text-primary hover:border-primary hover:bg-accent cursor-pointer border-dashed bg-transparent disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <Plus className="size-4" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </button>
  )
}

/** Grupo de chips com 8px entre eles (o grupo garante o alvo de 44px) */
export function ChipGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="chip-group" className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
}
