import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Slot } from 'radix-ui'

// PoupaMais: variantes trocadas pelas do Design System (Badge / `.pm-selo`): tipo do lançamento, aviso, erro,
// neutro e contorno ("Fora do saldo", "Na lixeira"). Selo de 1 a 3 palavras em caixa alta; a cor só reforça o texto.
const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-mini leading-4 tracking-[0.04em] whitespace-nowrap uppercase [&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:stroke-[2.25]',
  {
    variants: {
      variant: {
        receita: 'bg-receita-fundo text-receita',
        despesa: 'bg-despesa-fundo text-despesa',
        atencao: 'bg-atencao-fundo text-atencao',
        erro: 'bg-erro-fundo text-destructive',
        neutro: 'bg-secondary text-foreground',
        contorno: 'text-muted-foreground shadow-[inset_0_0_0_1px_var(--input)]',
      },
    },
    defaultVariants: {
      variant: 'neutro',
    },
  },
)

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({ className, variant = 'neutro', asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
