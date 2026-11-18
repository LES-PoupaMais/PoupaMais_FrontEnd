'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Progress as ProgressPrimitive } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// Barra de progresso do Design System (ProgressBar / `.pm-progress-bar__trilho`): trilho superfície 2 de 8px em pílula,
// preenchimento na cor do token. O texto de situação (fora daqui) carrega o sentido; a cor só reforça.
const progressIndicatorVariants = cva('h-full rounded-pilula transition-[width] duration-200', {
  variants: {
    cor: {
      primaria: 'bg-primary',
      receita: 'bg-receita-grafico',
      atencao: 'bg-atencao',
      despesa: 'bg-despesa-grafico',
      // reservados: não use nas telas da entrega atual
      investimento: 'bg-investimento',
      compartilhado: 'bg-compartilhado',
      destaque: 'bg-destaque',
    },
  },
  defaultVariants: { cor: 'primaria' },
})

type ProgressProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, 'value' | 'max' | 'getValueLabel'> &
  VariantProps<typeof progressIndicatorVariants> & {
    /** Porcentagem de 0 a 100; acima de 100 a barra fica cheia e `aria-valuenow` fica em 100 */
    valor: number
    /** Leitura em português para o leitor de tela (`aria-valuetext`), ex.: "68%, faltam R$ 320,00" */
    textoValor?: string
  }

function Progress({ valor, cor, textoValor, className, ...props }: ProgressProps) {
  const limitado = Math.min(100, Math.max(0, Number.isFinite(valor) ? valor : 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={limitado}
      max={100}
      getValueLabel={(atual) => textoValor ?? `${Math.round(atual)}%`}
      className={cn('rounded-pilula bg-secondary relative h-2 w-full overflow-hidden', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={progressIndicatorVariants({ cor })}
        style={{ width: `${limitado}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress, progressIndicatorVariants }
export type { ProgressProps }
