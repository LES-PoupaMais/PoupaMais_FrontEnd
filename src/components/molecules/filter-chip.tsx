'use client'

import { Check } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { estiloChip } from '@/components/molecules/chip'
import { cn } from '@/lib/cn'

// Chip que liga e desliga (DS components/Chip): `papel="filtro"` é um botão com aria-pressed (liga um filtro na lista);
// `papel="selecao"` é role="checkbox" com aria-checked, para escolhas múltiplas dentro de um grupo com rótulo
// (`<ChipGroup role="group" aria-label="…">`). Ligado = primária-fundo + borda primária E o ✓ (nunca só cor).

export type FilterChipProps = Omit<ComponentProps<'button'>, 'onChange' | 'role'> & {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  papel?: 'filtro' | 'selecao'
  /** Ícone (ou avatar de 24px) à esquerda, quando desligado */
  icon?: ReactNode
  children: ReactNode
}

export function FilterChip({
  pressed,
  onPressedChange,
  papel = 'filtro',
  icon,
  children,
  className,
  onClick,
  ...props
}: FilterChipProps) {
  const estado = papel === 'filtro' ? { 'aria-pressed': pressed } : { role: 'checkbox', 'aria-checked': pressed }
  return (
    <button
      type="button"
      data-slot="filter-chip"
      {...estado}
      onClick={(evento) => {
        onClick?.(evento)
        if (!evento.defaultPrevented) onPressedChange(!pressed)
      }}
      className={cn(
        estiloChip,
        'hover:border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-45',
        pressed && 'border-primary bg-accent text-primary hover:border-primary',
        className,
      )}
      {...props}
    >
      {pressed ? <Check className="size-4 shrink-0" aria-hidden="true" /> : icon}
      <span className="truncate">{children}</span>
    </button>
  )
}
